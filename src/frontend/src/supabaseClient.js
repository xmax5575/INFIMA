import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://kspsvissxcgnepqvpnxt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcHN2aXNzeGNnbmVwcXZwbnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NjcwMzIsImV4cCI6MjA3ODM0MzAzMn0.kH2GByaxM25r0X9YrnuBlkPWbsWER_Kxs3UsA1kcEN0"
);
