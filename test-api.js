const http = require('http');

const data = JSON.stringify({
  date: '2024',
  title: 'test',
  role: 'dev',
  description: 'desc'
});

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/history',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(data);
