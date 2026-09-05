module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { gift_id, user_name, user_email, user_phone } = req.body || {};

    if (!gift_id || !user_name || !user_email) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    const SUPABASE_URL = 'https://sikxwjgkkwxkcorejjiy.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpa3h3amdra3d4a2NvcmVqaml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5NDM0MSwiZXhwIjoyMTA0MTcwMzQxfQ.4KPdNr4vfGKw2t227SQTsJGTgwprJPCY8YfrLHEeYRY';

    const headers = {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // 1. Fetch gift stock
    const giftRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${gift_id}&select=stock`, { headers });
    const giftData = await giftRes.json();
    const gift = giftData && giftData[0];

    if (!gift || gift.stock <= 0) {
      return res.status(400).json({ success: false, error: 'Item is out of stock.' });
    }

    // 2. Insert winner
    const winRes = await fetch(`${SUPABASE_URL}/rest/v1/winners`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ gift_id, name: user_name, email: user_email, phone: user_phone })
    });

    if (!winRes.ok) {
      const errData = await winRes.json();
      return res.status(500).json({ success: false, error: errData });
    }

    // 3. Decrement stock
    await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${gift_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ stock: gift.stock - 1 })
    });

    return res.status(200).json({ success: true, message: 'Claim submitted successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
