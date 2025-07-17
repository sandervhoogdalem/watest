// Import Express.js
const express = require('express');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// Route for GET requests
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    const userAgent = req.get('User-Agent');
    console.log('WEBHOOK VERIFIED');
    console.log('User-Agent:', userAgent);
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests
app.post('/', (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);
  const userAgent = req.get('User-Agent') || 'Onbekend';
console.log(`\n\n📩 Webhook received ${timestamp}`);
  
console.log(`🕵️‍♂️ User-Agent: ${userAgent}\n`);
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).end();


 console.log(JSON.stringify(req.body, null, 2));

  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (message && message.type === 'text') {
    const from = message.from; // 316... zonder +
    const text = message.text.body;

    console.log(`📨 Bericht ontvangen van ${from}: ${text}`);

    // 📤 Stuur antwoord terug
    const reply = {
      messaging_product: 'whatsapp',
      to: from,
      type: 'text',
      text: {
        body: `Hallo! Je zei: "${text}"`
      }
    };

    try {
      const phoneNumberId = process.env.PHONE_NUMBER_ID;
      const accessToken = process.env.ACCESS_TOKEN;

      const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

      const response = await axios.post(url, reply, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Antwoord verzonden:', response.data);
    } catch (err) {
      console.error('❌ Fout bij verzenden:', err.response?.data || err.message);
    }
  }


  
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
