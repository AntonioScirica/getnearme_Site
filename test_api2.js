const http = require('http');

const data = JSON.stringify({
  nome: 'Test via node',
  addr: '',
  prezzo: 0,
  mq: 0,
  locali: 0,
  titolo: '',
  cover: ''
});

// Since I don't have the user's token, I can't hit the API as the user.
// Let me just look at the Next.js process output using `lsof` to find its log if it's logging to a file,
// or I can check the latest logs in the system?
