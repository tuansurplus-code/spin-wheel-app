module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  if (req.headers['x-admin-auth'] !== ADMIN_PASSWORD) {
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
    // GET: Load gifts, winners, form fields, and settings
    if (req.method === 'GET') {
      const [giftsRes, winnersRes, fieldsRes, settingsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/gifts?select=*&order=id.asc`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/winners?select=*&order=created_at.desc`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/form_fields?select=*&order=created_at.asc`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/settings?select=*`, { headers })
      ]);

      return res.status(200).json({
        success: true,
        gifts: await giftsRes.json(),
        winners: await winnersRes.json(),
        form_fields: await fieldsRes.json(),
        settings: await settingsRes.json()
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    const { action } = body || {};

    // Form Field CRUD
    if (action === 'save_field') {
      const { id, field_label, field_name, field_type, is_required } = body;
      const method = id ? 'PATCH' : 'POST';
      const url = id ? `${SUPABASE_URL}/rest/v1/form_fields?id=eq.${id}` : `${SUPABASE_URL}/rest/v1/form_fields`;

      const resp = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          field_label,
          field_name: field_name || field_label.toLowerCase().replace(/\s+/g, '_'),
          field_type: field_type || 'text',
          is_required: is_required ?? true
        })
      });
      return res.status(200).json({ success: resp.ok });
    }

    if (action === 'delete_field') {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/form_fields?id=eq.${body.id}`, { method: 'DELETE', headers });
      return res.status(200).json({ success: resp.ok });
    }

    // Save Settings (Spins per day & Speed)
    if (action === 'save_settings') {
      const { spins_per_day, spin_speed } = body;
      await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.spins_per_day`, { method: 'PATCH', headers, body: JSON.stringify({ value: String(spins_per_day) }) }),
        fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.spin_speed`, { method: 'PATCH', headers, body: JSON.stringify({ value: String(spin_speed) }) })
      ]);
      return res.status(200).json({ success: true });
    }

    // Prize CRUD
    if (req.method === 'POST') {
      const { name, stock, color, probability } = body;
      const addRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, stock: Number(stock ?? 10), color: color || '#3b82f6', probability: Number(probability ?? 10), active: true })
      });
      return res.status(200).json({ success: addRes.ok });
    }

    if (req.method === 'PATCH') {
      const { gift_id, name, stock, color, probability } = body;
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${gift_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name, stock: Number(stock), color, probability: Number(probability) })
      });
      return res.status(200).json({ success: updateRes.ok });
    }

    if (req.method === 'DELETE') {
      const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${body.gift_id}`, { method: 'DELETE', headers });
      return res.status(200).json({ success: deleteRes.ok });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

this is my current 
