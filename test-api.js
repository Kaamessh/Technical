async function test() {
  try {
    const res = await fetch('https://technical-gray-chi.vercel.app/api/events', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer faketoken123',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'test' })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error(err);
  }
}
test();
