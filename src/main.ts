import { bootstrap } from "./app/bootstrap";

bootstrap().catch((err) => {
  console.error("Failed to bootstrap application:", err);
});
