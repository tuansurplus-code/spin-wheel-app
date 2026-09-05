const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        success: false, 
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables." 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('active', true)
      .gt('stock', 0);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, items: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
