const express = require('express');
const app = express();
const PORT = 4000;

// Use the express.json middleware to parse JSON bodies
app.use(express.json());

// Define the webhook endpoint
app.post('/webhook', (req, res) => {
  console.log('--- Webhook Received ---');

  const { hook, doc, previousDoc, operation } = req.body;

  if (hook && doc) {
    console.log(`Event Type: ${hook.type}`);
    console.log(`Collection: ${hook.key}`);
    console.log(`Operation: ${operation}`);
    console.log('--------------------------');

    if (operation === 'update') {
      console.log('Updated Player Data (After Change):');
      console.log(doc);
      console.log('\nPrevious Player Data (Before Change):');
      console.log(previousDoc);
    } else if (operation === 'create') {
      console.log('New Player Created:');
      console.log(doc);
    }
  } else {
    console.log('Received payload was not in the expected format.');
    console.log(req.body);
  }

  console.log('--- End of Webhook ---\n');

  // Respond to acknowledge receipt of the webhook
  res.status(200).send('Webhook received successfully.');
});

app.listen(PORT, () => {
  console.log(`Webhook subscriber server listening on http://localhost:${PORT}`);
});
