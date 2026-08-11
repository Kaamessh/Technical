const https = require('https');

const SUPABASE_URL = 'ylxshybjrvbdmiozajxo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlseHNoeWJqcnZiZG1pb3phanhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MzE1NDgsImV4cCI6MjEwMTQwNzU0OH0._bM3JFcIlwNbO1mmZ2j86ikA6q6HKyZ0iuR8iYllM8Q';

function clean(u) {
  if (!u) return '';
  let cleaned = String(u).trim();
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  cleaned = cleaned.replace(/\\/g, '/');
  cleaned = cleaned.replace(/^[a-zA-Z]:\//, '');
  cleaned = cleaned.replace(/^.*\/Images\//i, 'Images/');
  if (!cleaned.toLowerCase().startsWith('images/')) {
    cleaned = 'Images/' + cleaned;
  }
  return cleaned;
}

function request(path, method, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: '/rest/v1' + path,
      method: method || 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function fix() {
  const wf = await request('/workflow_challenges?select=*');
  if (Array.isArray(wf)) {
    for (const item of wf) {
      const fixed = item.image_urls.map(clean);
      await request('/workflow_challenges?id=eq.' + item.id, 'PATCH', { image_urls: fixed });
      console.log('Fixed workflow:', item.id, fixed);
    }
  }

  const ai = await request('/ai_or_real_challenges?select=*');
  if (Array.isArray(ai)) {
    for (const item of ai) {
      const cleanA = clean(item.image_a_url);
      const cleanB = clean(item.image_b_url);
      await request('/ai_or_real_challenges?id=eq.' + item.id, 'PATCH', { image_a_url: cleanA, image_b_url: cleanB });
      console.log('Fixed AI:', item.id, cleanA, cleanB);
    }
  }
}
fix();
