module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-auth');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  if (req.headers['x-admin-auth'] !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid admin password.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sikxwjgkkwxkcorejjiy.supabase.co';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpa3h3amdra3d4a2NvcmVqaml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5NDM0MSwiZXhwIjoyMTA0MTcwMzQxfQ.4KPdNr4vfGKw2t227SQTsJGTgwprJPCY8YfrLHEeYRY';

  const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    if (req.method === 'GET') {
      const [giftsRes, winnersRes, fieldsRes, settingsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/gifts?select=*&order=created_at.asc`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/winners?select=*&order=created_at.desc`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/form_fields?select=*&order=created_at.asc`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/settings?select=*`, { headers })
      ]);

      const giftsRaw = await giftsRes.json();
      const gifts = (Array.isArray(giftsRaw) ? giftsRaw : []).map(g => ({
        ...g,
        name: g.label || 'Prize',
        label: g.label || 'Prize'
      }));

      return res.status(200).json({
        success: true,
        gifts,
        winners: await winnersRes.json(),
        form_fields: await fieldsRes.json(),
        settings: await settingsRes.json()
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    const { action, gifts } = body || {};

    // Bulk Overwrite Gifts (Corrected UUID clear filter)
    if (gifts && Array.isArray(gifts)) {
      await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=not.is.null`, { method: 'DELETE', headers });
      
      const payload = gifts.map(g => ({
        label: g.label || g.name || 'Prize',
        stock: Number(g.stock ?? 100),
        color: g.color || '#3b82f6',
        weight: Number(g.weight ?? 10),
        emoji: g.emoji || '🎁',
        active: true
      }));

      const bulkRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      return res.status(200).json({ success: bulkRes.ok });
    }

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

    // Settings
    if (action === 'save_settings') {
      const { spins_per_day, spin_speed } = body;
      await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.spins_per_day`, { method: 'PATCH', headers, body: JSON.stringify({ value: String(spins_per_day) }) }),
        fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.spin_speed`, { method: 'PATCH', headers, body: JSON.stringify({ value: String(spin_speed) }) })
      ]);
      return res.status(200).json({ success: true });
    }

    // Single Gift CRUD
    if (req.method === 'POST') {
      const { label, name, stock, color, weight, emoji } = body;
      const addRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          label: label || name || 'Prize',
          stock: Number(stock ?? 10),
          color: color || '#3b82f6',
          weight: Number(weight ?? 10),
          emoji: emoji || '🎁',
          active: true
        })
      });
      return res.status(200).json({ success: addRes.ok });
    }

    if (req.method === 'PATCH') {
      const { gift_id, id, label, name, stock, color, weight, emoji } = body;
      const targetId = gift_id || id;
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${targetId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          label: label || name,
          stock: Number(stock),
          color,
          weight: Number(weight ?? 10),
          emoji
        })
      });
      return res.status(200).json({ success: updateRes.ok });
    }

    if (req.method === 'DELETE') {
      const targetId = body.gift_id || body.id;
      const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${targetId}`, { method: 'DELETE', headers });
      return res.status(200).json({ success: deleteRes.ok });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};
