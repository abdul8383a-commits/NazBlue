import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Anon key is limited by RLS

// Since RLS is on, let's see if we can read anything.
const supabase = createClient(supabaseUrl, supabaseKey);
supabase.from("orders").select("id").limit(1).then(console.log);
