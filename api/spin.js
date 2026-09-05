const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Missing environment variables.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active items with stock
    const { data: items, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('active', true)
      .gt('stock', 0);

    if (error || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No active prizes available.' });
    }

    // Weighted random selection
    const totalWeight = items.reduce((acc, item) => acc + (item.weight || 1), 0);
    let randomNum = Math.random() * totalWeight;
    let winningIndex = 0;

    for (let i = 0; i < items.length; i++) {
      if (randomNum < items[i].weight) {
        winningIndex = i;
        break;
      }
      randomNum -= items[i].weight;
    }

    const winningItem = items[winningIndex];

    return res.status(200).json({
      success: true,
      winningIndex,
      winningItem
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
