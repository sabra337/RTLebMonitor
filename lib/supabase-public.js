const { createClient } = require('@supabase/supabase-js');

let warnedServiceRoleFallback = false;

function getPublicSupabaseKey() {
  const publishableKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();
  if (publishableKey) return publishableKey;

  const anonKey = String(process.env.SUPABASE_ANON_KEY || '').trim();
  if (anonKey) return anonKey;

  if (process.env.NODE_ENV !== 'production') {
    const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (serviceRoleKey) {
      if (!warnedServiceRoleFallback) {
        console.warn('SUPABASE_PUBLISHABLE_KEY is not configured; falling back to service role outside production.');
        warnedServiceRoleFallback = true;
      }
      return serviceRoleKey;
    }
  }

  return '';
}

function isPublicSupabaseConfigured() {
  return getPublicSupabaseKey().length > 0;
}

function createPublicSupabaseClient() {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
  const publicKey = getPublicSupabaseKey();

  if (!supabaseUrl || !publicKey) {
    throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY) are required for public read APIs.');
  }

  return createClient(supabaseUrl, publicKey);
}

module.exports = { createPublicSupabaseClient, isPublicSupabaseConfigured };
