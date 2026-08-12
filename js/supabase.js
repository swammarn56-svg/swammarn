// Browser-safe Supabase client.
// The Supabase UMD build is loaded before this file from index.html.
(function(){
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    window.__BAKERY_BOOT_ERROR = "Supabase JS SDK failed to load.";
    return;
  }
  try {
    window.bakerySupabase = window.supabase.createClient(
      window.BAKERY_SUPABASE_URL,
      window.BAKERY_SUPABASE_PUBLISHABLE_KEY,
      {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
    );
  } catch (e) {
    window.__BAKERY_BOOT_ERROR = e?.message || String(e);
  }
})();
