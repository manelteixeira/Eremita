import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://lqqcohecbxhveuykvgnm.supabase.co";
const supabaseKey = "sb_publishable_cMsrSiM1JUv_W446t6Y4hA_yy4q2PBi";

export const supabase = createClient(supabaseUrl, supabaseKey);