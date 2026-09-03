async function testRegister() {
  try {
    const res = await fetch('https://cg-plantbatam.com/api/chis/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser99',
        password: 'password123',
        full_name: 'Test User 99',
        email: 'testuser99@example.com'
      })
    });
    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('DATA:', data);
  } catch (err) {
    console.error('NETWORK ERROR:', err.message);
  }
}

testRegister();
