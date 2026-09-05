module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const { gift_id, user_name, user_email, user_phone, gift_label } = body || {};

    if (!gift_id || !user_name || !user_email) {
      return res.status(400).json({ 
        success: false, 
        error: `Missing required fields. Received: ${JSON.stringify({ gift_id, user_name, user_email })}` 
      });
    }

    const SUPABASE_URL = 'https://sikxwjgkkwxkcorejjiy.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpa3h3amdra3d4a2NvcmVqaml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5NDM0MSwiZXhwIjoyMTA0MTcwMzQxfQ.4KPdNr4vfGKw2t227SQTsJGTgwprJPCY8YfrLHEeYRY';

    const headers = {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // 1. Fetch current stock and details for the gift
    const giftRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${gift_id}&select=*`, { headers });
    const giftData = await giftRes.json();
    const gift = Array.isArray(giftData) ? giftData[0] : null;

    if (!gift || gift.stock <= 0) {
      return res.status(400).json({ success: false, error: 'Item is out of stock.' });
    }

    // Resolve prize label name safely
    const resolvedLabel = gift_label || gift.name || gift.title || gift.label || gift.gift_name || 'Prize';

    // 2. Insert winner into Supabase matching exact table column names
    const winRes = await fetch(`${SUPABASE_URL}/rest/v1/winners`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        gift_id: gift_id, 
        gift_label: resolvedLabel,
        user_name: user_name, 
        user_email: user_email, 
        user_phone: user_phone,
        name: user_name,       // Fallback in case table has both
        email: user_email,     // Fallback
        phone: user_phone,     // Fallback
        status: 'Claimed'
      })
    });

    if (!winRes.ok) {
      const errData = await winRes.json();
      const message = typeof errData === 'object' ? JSON.stringify(errData) : errData;
      return res.status(500).json({ success: false, error: message });
    }

    // 3. Decrement inventory stock by 1
    await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${gift_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ stock: gift.stock - 1 })
    });

    return res.status(200).json({ success: true, message: 'Claim submitted successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};
