const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { gift_id, user_name, user_email, user_phone } = req.body;

    if (!gift_id || !user_name || !user_email) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Missing environment variables.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check stock
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .select('stock')
      .eq('id', gift_id)
      .single();

    if (giftError || !gift || gift.stock <= 0) {
      return res.status(400).json({ success: false, error: 'Item is out of stock.' });
    }

    // 2. Insert winner record
    const { error: winnerError } = await supabase
      .from('winners')
      .insert([{ gift_id, name: user_name, email: user_email, phone: user_phone }]);

    if (winnerError) {
      return res.status(500).json({ success: false, error: winnerError.message });
    }

    // 3. Decrement inventory stock by 1
    const { error: updateError } = await supabase
      .from('gifts')
      .update({ stock: gift.stock - 1 })
      .eq('id', gift_id);

    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message });
    }

    return res.status(200).json({ success: true, message: 'Claim submitted successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
