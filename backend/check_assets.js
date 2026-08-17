const https = require('https');

https.get('https://altruixx-aisprint.vercel.app/admin/login', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('--- FULL HTML FROM VERCEL ---');
    console.log(data);
    const matches = data.match(/(src|href)="\/[^"]+"/g);
    console.log('--- LINKED ASSETS ---', matches);

    if (matches) {
      matches.forEach(m => {
        const path = m.split('"')[1];
        https.get('https://altruixx-aisprint.vercel.app' + path, (r) => {
          let assetData = '';
          r.on('data', c => assetData += c);
          r.on('end', () => {
            console.log('Asset', path, '-> Status:', r.statusCode, 'Length:', assetData.length);
            if (r.statusCode !== 200) {
              console.log('FAILED ASSET CONTENT:', assetData.substring(0, 200));
            }
          });
        });
      });
    }
  });
});
