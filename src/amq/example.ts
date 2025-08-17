import { MessageProducer } from './MessageProducer';

async function example() {
  const producer = new MessageProducer('my-queue');

  try {
    // Connect to RabbitMQ
    await producer.connect();

    // Example message
    const message = {
      id: 1,
      content: 'Hello RabbitMQ!',
      timestamp: new Date().toISOString(),
    };

    // Publish the message
    await producer.publishMessage(message);

    // Close the connection when done
    await producer.close();
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Run the example
example();
