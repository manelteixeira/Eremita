import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lqqcohecbxhveuykvgnm.supabase.co";
const supabaseKey = "sb_publishable_cMsrSiM1JUv_W446t6Y4hA_yy4q2PBi";

export const supabase = createClient(supabaseUrl, supabaseKey);