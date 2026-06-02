import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
    "https://ccfhebwsodywrgagqozr.supabase.co",
    process.env.SUPABASE_API_SECRET!
)