import { getShiprocketToken } from "./src/lib/shiprocket";
import { config } from "dotenv";

config({ path: ".env.local" }); // Load env vars so SHIPROCKET_MODE is set

async function run() {
  console.log("Testing Token Mutex...");
  const start = Date.now();
  
  // Trigger 5 concurrent token fetches
  const promises = Array.from({ length: 5 }).map(() => getShiprocketToken());
  const results = await Promise.all(promises);
  
  console.log("Results:", results);
  console.log("All resolved to same mock token?", results.every(t => t === results[0]));
  console.log("Time taken:", Date.now() - start, "ms");
}

run();
