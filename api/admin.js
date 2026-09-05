module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = 'https://sikxwjgkkwxkcorejjiy.supabase.co';
  const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpa3h3amdra3d4a2NvcmVqaml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5NDM0MSwiZXhwIjoyMTA0MTcwMzQxfQ.4KPdNr4vfGKw2t227SQTsJGTgwprJPCY8YfrLHEeYRY';

  const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    // GET: Fetch all gifts and winners
    if (req.method === 'GET') {
      const [giftsRes, winnersRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/gifts?select=*`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/winners?select=*&order=created_at.desc`, { headers })
      ]);

      const gifts = await giftsRes.json();
      const winners = await winnersRes.json();

      return res.status(200).json({
        success: true,
        gifts: Array.isArray(gifts) ? gifts : [],
        winners: Array.isArray(winners) ? winners : []
      });
    }

    // PATCH: Update gift stock level
    if (req.method === 'PATCH') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }

      const { gift_id, stock } = body || {};

      if (!gift_id || stock === undefined || stock < 0) {
        return res.status(400).json({ success: false, error: 'Invalid gift_id or stock quantity.' });
      }

      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${gift_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ stock: Number(stock) })
      });

      if (!updateRes.ok) {
        const err = await updateRes.json();
        return res.status(500).json({ success: false, error: err });
      }

      return res.status(200).json({ success: true, message: 'Stock level updated.' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};
