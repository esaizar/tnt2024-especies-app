import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = `https://ytoozusutyyxivixtmgl.supabase.co`;
const supabaseAnonKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0b296dXN1dHl5eGl2aXh0bWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAwMjYxNDYsImV4cCI6MjAzNTYwMjE0Nn0.zL4f2PUk_bJblL6n98Ot3S4u0ZDgVxuy6n5XlvBjaaw`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
