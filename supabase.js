import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://lqqcohecbxhveuykvgnm.supabase.co";
const supabaseKey = "SUA_CHAVE_ATUAL";

export const supabase = createClient(supabaseUrl, supabaseKey);