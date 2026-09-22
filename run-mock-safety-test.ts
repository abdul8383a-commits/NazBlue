import { getShiprocketToken } from "./src/lib/shiprocket";
import { config } from "dotenv";

config({ path: ".env.local" });

async function run() {
  console.log("Testing Mock/Live Safety...");
  
  // Simulate Production Environment with invalid live setup
  process.env.NODE_ENV = "production";
  process.env.SHIPROCKET_MODE = "live";
  process.env.SHIPROCKET_API_EMAIL = "placeholder@example.com";
  
  try {
    await getShiprocketToken();
    console.log("SUCCESS (This should not happen)");
  } catch (err: any) {
    console.log("CAUGHT ERROR:", err.message);
    if (err.message.includes("valid credentials")) {
       console.log("Production live mode correctly rejected placeholder credentials!");
    }
  }
}

run();
