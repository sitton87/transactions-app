import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://grtnnimmwajobegjcwvk.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydG5uaW1td2Fqb2JlZ2pjd3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjQzMTcsImV4cCI6MjA1ODkwMDMxN30.4RaJVVfXuL0X_yBsLzWQ64oIuLSta4UxWUm9DmD6KmI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
