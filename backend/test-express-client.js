fetch('http://localhost:5001/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: '123' })
}).then(r => r.json()).then(console.log).catch(console.error);
