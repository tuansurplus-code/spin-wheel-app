const { createClient } = require('@supabase/supabase-js');

// Direct credentials bypass environment variable sync issues
const SUPABASE_URL = 'https://tpvvrfornspqgjwogxag.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpa3h3amdra3d4a2NvcmVqaml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5NDM0MSwiZXhwIjoyMTA0MTcwMzQxfQ.4KPdNr4vfGKw2t227SQTsJGTgwprJPCY8YfrLHEeYRY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
  try {
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
