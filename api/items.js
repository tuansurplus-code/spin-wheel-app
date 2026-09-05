import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('active', true) // <-- MUST be 'active', NOT 'is_active'
      .gt('stock', 0);

    if (error) throw error;

    return res.status(200).json({ success: true, items: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
