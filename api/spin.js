module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const SUPABASE_URL = 'https://sikxwjgkkwxkcorejjiy.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpa3h3amdra3d4a2NvcmVqaml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5NDM0MSwiZXhwIjoyMTA0MTcwMzQxfQ.4KPdNr4vfGKw2t227SQTsJGTgwprJPCY8YfrLHEeYRY';

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/gifts?select=*&active=eq.true&stock=gt.0`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const items = await response.json();

    if (!response.ok || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No active prizes available.' });
    }

    const totalWeight = items.reduce((acc, item) => acc + (item.weight || 1), 0);
    let randomNum = Math.random() * totalWeight;
    let winningIndex = 0;

    for (let i = 0; i < items.length; i++) {
      if (randomNum < (items[i].weight || 1)) {
        winningIndex = i;
        break;
      }
      randomNum -= (items[i].weight || 1);
    }

    return res.status(200).json({
      success: true,
      winningIndex,
      winningItem: items[winningIndex]
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
