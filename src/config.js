// Credenciales del proyecto Supabase `dentalgest`.
// La anon key es publicable por diseño (va en el navegador del doctor); la
// protección real de la tabla `leads_congreso_lab` son sus policies de RLS.
// Se pueden sobreescribir con variables de entorno al desplegar.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://mouyfoiznwgvyrgwqoxu.supabase.co";

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdXlmb2l6bndndnlyZ3dxb3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTg0NDksImV4cCI6MjA5NjY5NDQ0OX0.MdOapYVCgEX-NYiE5wMONIuo04VPNWy1EKWZxuQR3tQ";

export const TABLE = import.meta.env.VITE_SUPABASE_TABLE || "leads_congreso_lab";
