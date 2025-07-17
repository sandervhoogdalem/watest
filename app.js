// app.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

app.use(bodyParser.json());

// ✅ Webhook-verificatie (GET)
app.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const userAgent = req.get('User-Agent') || 'Onbekend';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log(`✅ Webhook verified — User-Agent: ${userAgent}`);
    return res.status(200).send(challenge);
  }

  console.log(`❌ Verificatie mislukt — token ontvangen: ${token}`);
  res.sendStatus(403);
});

// ✅ Webhook POST-handler
app.post('/', async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const userAgent = req.get('User-Agent') || 'Onbekend';

  console.log(`\n📩 Webhook ontvangen (${timestamp})`);
  console.log(`🕵️‍♂️ User-Agent: ${userAgent}`);
  console.log(JSON.stringify(req.body, null, 2));

  fs.appendFileSync('log.txt', `${timestamp}\nUser-Agent: ${userAgent}\n${JSON.stringify(req.body, null, 2)}\n\n`);

  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (message && message.type === 'text') {
    const from = message.from;
    const text = message.text.body;

    console.log(`📨 Bericht van ${from}: ${text}`);

    // 📤 Automatisch antwoord verzenden
    const reply = {
      messaging_product: 'whatsapp',
      to: from,
      type: 'text',
      text: { body: `Hallo! Je zei: "${text}"` }
    };

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
        reply,
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Antwoord verzonden:', response.data);
    } catch (error) {
      console.error('❌ Fout bij verzenden:', error.response?.data || error.message);
    }
  }

  res.sendStatus(200);
});

// ✅ Server starten
app.listen(PORT, () => {
  console.log(`🚀 Server draait op poort ${PORT}`);
});
