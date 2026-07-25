import "dotenv/config";
import { config } from "./config.js";
import { createHttpServer } from "./server.js";

createHttpServer().listen(config.port, () => console.log("HackRails MCP listening"));

export { argumentsSchemas } from "./schemas.js";