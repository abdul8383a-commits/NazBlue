import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Just using anon key for test if RLS allows or we use service role

const supabase = createClient(supabaseUrl, supabaseKey);

async function acquireLock(orderId: string, processName: string) {
  const { data: lockData, error: lockError } = await supabase
    .from("orders")
    .update({ shiprocket_status: 'creating' })
    .eq("id", orderId)
    .is("shiprocket_order_id", null)
    .or("shiprocket_status.is.null,shiprocket_status.neq.creating")
    .select();

  if (lockError || !lockData || lockData.length === 0) {
    console.log(`[${processName}] Lock FAILED`);
    return false;
  }
  
  console.log(`[${processName}] Lock ACQUIRED. Row data:`, lockData[0].shiprocket_status);
  return true;
}

async function run() {
  // Use any order id from the db.
  const { data: order } = await supabase.from("orders").select("id").limit(1).single();
  if (!order) {
    console.log("No order found");
    return;
  }
  
  const orderId = order.id;
  console.log(`Testing concurrency on order ${orderId}...`);

  // Reset status to null
  await supabase.from("orders").update({ shiprocket_status: null, shiprocket_order_id: null }).eq("id", orderId);
  console.log("Order reset to NULL.");

  // Test B: NULL shiprocket_status -> lock can be acquired.
  console.log("--- Test B: NULL status ---");
  await acquireLock(orderId, "TestB");

  // Reset to NULL
  await supabase.from("orders").update({ shiprocket_status: null }).eq("id", orderId);
  
  // Test A & C: Two simultaneous requests
  console.log("--- Test A & C: Simultaneous requests ---");
  const p1 = acquireLock(orderId, "Req1");
  const p2 = acquireLock(orderId, "Req2");
  await Promise.all([p1, p2]);

  // Test D: existing shiprocket_order_id
  console.log("--- Test D: Existing order ID ---");
  await supabase.from("orders").update({ shiprocket_status: null, shiprocket_order_id: "mock-123" }).eq("id", orderId);
  await acquireLock(orderId, "Req3");

  // Cleanup
  await supabase.from("orders").update({ shiprocket_status: null, shiprocket_order_id: null }).eq("id", orderId);
}

run();
