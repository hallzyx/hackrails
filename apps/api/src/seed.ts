import "dotenv/config";
import { migrate } from "./db.js";
import { resetDemo, seedDemo } from "./service.js";
await migrate();
await resetDemo();
if (process.argv.includes("--activity")) await seedDemo();
console.log("HackRails demo reset.");
