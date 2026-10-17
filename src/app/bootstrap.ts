import { App } from "./App";
import "@/styles/main.css";

export async function bootstrap(): Promise<App> {
  const rootElement = document.getElementById("app");
  if (!rootElement) {
    throw new Error("Application root container element '#app' not found in DOM.");
  }

  const app = new App(rootElement);
  await app.initialize();

  window.addEventListener("beforeunload", () => {
    app.dispose();
  });

  return app;
}
