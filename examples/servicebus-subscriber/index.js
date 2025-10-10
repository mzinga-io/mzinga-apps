const amqp = require('amqplib');

// --- Configuration ---
// The RabbitMQ server URL. Defaults to a standard local instance.
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/';
// The routing key to listen for. This MUST match the hook environment variable name from the main app.
const ROUTING_KEY = process.env.ROUTING_KEY;
// The exchange events are published to.
const EXCHANGE_NAME = 'mzinga_events';

async function consume() {
  try {
    console.log('Connecting to RabbitMQ...');
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    console.log('Asserting exchange:', EXCHANGE_NAME);
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });

    // Create a temporary, exclusive queue. It will be deleted when the consumer disconnects.
    const q = await channel.assertQueue('', { exclusive: true });
    console.log(`Created temporary queue: ${q.queue}`);

    console.log(`Binding queue to exchange with routing key: "${ROUTING_KEY}"`);
    await channel.bindQueue(q.queue, EXCHANGE_NAME, ROUTING_KEY);

    console.log('--- Waiting for messages. To exit press CTRL+C ---');

    channel.consume(q.queue, (msg) => {
      if (msg.content) {
        console.log('\n--- Message Received ---');
        console.log(`Routing Key: ${msg.fields.routingKey}`);
        
        // The actual event data from Mzinga is nested in the 'data' property of the message
        const payload = JSON.parse(msg.content.toString());
        const { hook, doc, previousDoc, operation } = payload.data;

        console.log(`Event Type: ${hook.type}`);
        console.log(`Collection: ${hook.key}`);
        console.log(`Operation: ${operation}`);
        console.log('--------------------------');

        if (operation === 'update') {
          console.log('Updated Document (After Change):');
          console.log(doc);
          console.log('\nPrevious Document (Before Change):');
          console.log(previousDoc);
        } else if (operation === 'create') {
          console.log('New Document Created:');
          console.log(doc);
        }
        console.log('--- End of Message ---');
      }
    }, { noAck: true }); // noAck: true means we don't need to manually acknowledge messages.

  } catch (error) {
    console.error('Error connecting or consuming from RabbitMQ:', error.message);
    // Exit after a delay to allow logs to be read
    setTimeout(() => process.exit(1), 5000);
  }
}

if (!ROUTING_KEY) {
  console.error('Error: The ROUTING_KEY environment variable is not set.');
  console.error('Please set it to the event name you want to subscribe to (e.g., HOOKSURL_PLAYER_AFTERCHANGE).');
  process.exit(1);
}

consume();
