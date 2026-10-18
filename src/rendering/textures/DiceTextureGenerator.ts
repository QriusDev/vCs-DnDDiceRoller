import * as THREE from "three";
import type { DiceThemeConfig, DiceThemeId, DiceType } from "@/types";
import { DICE_THEMES } from "@/config/themeConfig";

export interface AtlasCellLayout {
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  atlasWidth: number;
  atlasHeight: number;
}

export class DiceTextureGenerator {
  private static readonly textureCache = new Map<string, THREE.CanvasTexture>();

  /**
   * Computes the grid layout for a given dice type
   */
  static getAtlasLayout(type: DiceType): AtlasCellLayout {
    let cols = 4;
    let rows = 2;
    switch (type) {
      case "d4":
        cols = 2;
        rows = 2;
        break;
      case "d6":
        cols = 3;
        rows = 2;
        break;
      case "d8":
        cols = 4;
        rows = 2;
        break;
      case "d10":
        cols = 5;
        rows = 2;
        break;
      case "d12":
        cols = 4;
        rows = 3;
        break;
      case "d20":
        cols = 5;
        rows = 4;
        break;
    }

    const cellWidth = 256;
    const cellHeight = 256;
    return {
      cols,
      rows,
      cellWidth,
      cellHeight,
      atlasWidth: cols * cellWidth,
      atlasHeight: rows * cellHeight,
    };
  }

  /**
   * Generates or retrieves a cached procedural texture atlas for a die
   */
  static generateAtlas(
    type: DiceType,
    faceValues: number[],
    themeId: DiceThemeId = "obsidian-gold",
    customBodyColor?: string,
    customNumberColor?: string
  ): THREE.CanvasTexture {
    const cacheKey = `${type}_${themeId}_${customBodyColor ?? ""}_${customNumberColor ?? ""}`;
    const cached = this.textureCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const theme = DICE_THEMES[themeId] || DICE_THEMES["obsidian-gold"];
    const bodyColor = customBodyColor || theme.bodyColor;
    const numberColor = customNumberColor || theme.numberColor;

    const layout = this.getAtlasLayout(type);

    // Fallback if running in headless Node.js unit test environment
    if (typeof document === "undefined") {
      const dummyCanvas = {} as HTMLCanvasElement;
      const texture = new THREE.CanvasTexture(dummyCanvas);
      this.textureCache.set(cacheKey, texture);
      return texture;
    }

    const canvas = document.createElement("canvas");
    canvas.width = layout.atlasWidth;
    canvas.height = layout.atlasHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      const texture = new THREE.CanvasTexture(canvas);
      this.textureCache.set(cacheKey, texture);
      return texture;
    }

    // 1. Fill base atlas background
    ctx.fillStyle = bodyColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Render procedural background style across the whole atlas
    this.renderProceduralBackground(ctx, canvas.width, canvas.height, theme, bodyColor);

    // 3. Render each face cell with centered number
    faceValues.forEach((val, idx) => {
      const col = idx % layout.cols;
      const row = Math.floor(idx / layout.cols);
      const cellX = col * layout.cellWidth;
      const cellY = row * layout.cellHeight;

      this.renderFaceCell(
        ctx,
        cellX,
        cellY,
        layout.cellWidth,
        layout.cellHeight,
        val,
        theme,
        numberColor
      );
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    this.textureCache.set(cacheKey, texture);
    return texture;
  }

  private static renderProceduralBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    theme: DiceThemeConfig,
    baseColor: string
  ): void {
    switch (theme.proceduralStyle) {
      case "marble": {
        // Veins / swirl pattern
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = theme.id === "crimson-dragon" ? "#000000" : "#d4af37";
        ctx.lineWidth = 12;
        for (let i = 0; i < 20; i++) {
          ctx.beginPath();
          const startX = (i * 137) % width;
          ctx.moveTo(startX, 0);
          ctx.bezierCurveTo(
            (startX + 200) % width,
            height * 0.3,
            (startX - 150 + width) % width,
            height * 0.7,
            (startX + 100) % width,
            height
          );
          ctx.stroke();
        }
        ctx.restore();
        break;
      }
      case "wood": {
        // Subtle wood grain lines
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = "#1a0f00";
        ctx.lineWidth = 4;
        for (let y = 0; y < height; y += 14) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(width * 0.3, y + 8, width * 0.7, y - 8, width, y);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }
      case "gem": {
        // Subtle crystalline facets
        ctx.save();
        ctx.globalAlpha = 0.2;
        const grad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          50,
          width / 2,
          height / 2,
          width
        );
        grad.addColorStop(0, "#a855f7");
        grad.addColorStop(1, baseColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        break;
      }
      case "neon": {
        // Subtle dark cyber grid
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 2;
        const gridSize = 32;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }
      case "plain":
      default: {
        // Soft vignette
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        break;
      }
    }
  }

  private static renderFaceCell(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    value: number,
    theme: DiceThemeConfig,
    numColor: string
  ): void {
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.save();

    // Special styling for Neon
    if (theme.id === "cyber-neon") {
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 18;
    } else {
      // Engraved recessed shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;
      ctx.shadowBlur = 4;
    }

    ctx.fillStyle = numColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Dynamic font sizing based on 1-digit vs 2-digit numbers
    const text = String(value);
    const fontSize = text.length > 1 ? Math.floor(h * 0.42) : Math.floor(h * 0.48);
    ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;

    // Render numeral
    ctx.fillText(text, cx, cy);

    // If 6 or 9, render an explicit underline dot or bar for unambiguous reading
    if (value === 6 || value === 9) {
      ctx.beginPath();
      const dotRadius = Math.max(3, fontSize * 0.08);
      ctx.arc(cx, cy + fontSize * 0.52, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Disposes all cached textures
   */
  static dispose(): void {
    for (const tex of this.textureCache.values()) {
      tex.dispose();
    }
    this.textureCache.clear();
  }
}
