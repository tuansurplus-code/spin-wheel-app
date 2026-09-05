module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  const authHeader = req.headers['x-admin-auth'];
  if (authHeader !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid admin password.' });
  }

  const SUPABASE_URL = 'https://sikxwjgkkwxkcorejjiy.supabase.co';
  const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpa3h3amdra3d4a2NvcmVqaml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5NDM0MSwiZXhwIjoyMTA0MTcwMzQxfQ.4KPdNr4vfGKw2t227SQTsJGTgwprJPCY8YfrLHEeYRY';

  const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    // GET: Fetch gifts & winners
    if (req.method === 'GET') {
      const [giftsRes, winnersRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/gifts?select=*&order=id.asc`, { headers }),
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

    // POST: Add new prize
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }

      const { name, stock, color } = body || {};

      if (!name) {
        return res.status(400).json({ success: false, error: 'Prize name is required.' });
      }

      const addRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: name,
          stock: Number(stock ?? 10),
          color: color || '#3b82f6',
          active: true
        })
      });

      if (!addRes.ok) {
        const err = await addRes.json();
        return res.status(500).json({ success: false, error: err });
      }

      return res.status(200).json({ success: true, message: 'Prize added successfully!' });
    }

    // PATCH: Edit prize
    if (req.method === 'PATCH') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }

      const { gift_id, name, stock, color } = body || {};

      if (!gift_id) {
        return res.status(400).json({ success: false, error: 'Invalid gift_id.' });
      }

      const updatePayload = {};
      if (name !== undefined) updatePayload.name = name;
      if (stock !== undefined) updatePayload.stock = Number(stock);
      if (color !== undefined) updatePayload.color = color;

      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${gift_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updatePayload)
      });

      if (!updateRes.ok) {
        const err = await updateRes.json();
        return res.status(500).json({ success: false, error: err });
      }

      return res.status(200).json({ success: true, message: 'Prize updated successfully.' });
    }

    // DELETE: Delete prize
    if (req.method === 'DELETE') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }

      const { gift_id } = body || {};

      if (!gift_id) {
        return res.status(400).json({ success: false, error: 'Invalid gift_id.' });
      }

      const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${gift_id}`, {
        method: 'DELETE',
        headers
      });

      if (!deleteRes.ok) {
        const err = await deleteRes.json();
        return res.status(500).json({ success: false, error: err });
      }

      return res.status(200).json({ success: true, message: 'Prize deleted successfully.' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};
