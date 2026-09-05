module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sikxwjgkkwxkcorejjiy.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpa3h3amdra3d4a2NvcmVqaml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5NDM0MSwiZXhwIjoyMTA0MTcwMzQxfQ.4KPdNr4vfGKw2t227SQTsJGTgwprJPCY8YfrLHEeYRY';

    const headers = {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    };

    // Sort by created_at.asc instead of id.asc for UUID support
    const [giftsRes, fieldsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/gifts?select=*&active=eq.true&stock=gt.0&order=created_at.asc`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/form_fields?select=*&order=created_at.asc`, { headers })
    ]);

    const giftsData = await giftsRes.json();
    const fieldsData = await fieldsRes.json();

    if (!giftsRes.ok) return res.status(giftsRes.status).json({ success: false, error: giftsData });

    const itemsList = (Array.isArray(giftsData) ? giftsData : []).map(g => ({
      ...g,
      name: g.label || 'Prize',
      label: g.label || 'Prize',
      weight: Number(g.weight ?? 10)
    }));

    return res.status(200).json({
      success: true,
      items: itemsList,
      gifts: itemsList,
      form_fields: Array.isArray(fieldsData) ? fieldsData : []
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};
