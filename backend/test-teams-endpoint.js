const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

// Generate admin token
const token = jwt.sign({
  id: 'some-uuid',
  username: 'admin',
  email: 'admin@test.com',
  role: 'admin'
}, JWT_SECRET, { expiresIn: '1d' });

async function test() {
  try {
    const res = await fetch('https://technical-gray-chi.vercel.app/api/teams', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Data:", text);
  } catch (err) {
    console.error(err);
  }
}
test();
