
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://mbftpscpinopeztwddji.supabase.co";

const supabaseKey =
  "sb_publishable_UvCZ9jGEvJNRXdB6K253Ig_nstA4dwL";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      flowType: "implicit",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
