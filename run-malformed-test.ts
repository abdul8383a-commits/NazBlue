import { createShiprocketOrder } from "./src/lib/shiprocket";
import { config } from "dotenv";

config({ path: ".env.local" });

// Override global fetch
const originalFetch = global.fetch;
(global as any).fetch = async (url: string, options: any) => {
  if (url.includes("login")) {
    return { ok: true, json: async () => ({ token: "mock-token" }) };
  }
  if (url.includes("ad-hoc")) {
    return { ok: true, json: async () => ({ status: "success", random_field: "foo" }) }; // Missing order_id!
  }
  return originalFetch(url, options);
};

async function run() {
  console.log("Testing Malformed Success...");
  try {
    await createShiprocketOrder({ weight: 1 });
    console.log("SUCCESS (This should not happen)");
  } catch (err: any) {
    console.log("CAUGHT ERROR:", err.message);
    if (err.message.includes("missing order_id/shipment_id")) {
       console.log("Malformed response correctly rejected!");
    }
  }
}

// Bypassing isMockMode by overriding env
process.env.SHIPROCKET_MODE = "live";
process.env.SHIPROCKET_API_EMAIL = "real@example.com";
run();
