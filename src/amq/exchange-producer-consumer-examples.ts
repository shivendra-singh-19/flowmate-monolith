import {
  DirectExchangeProducer,
  FanoutExchangeProducer,
  TopicExchangeProducer,
  HeadersExchangeProducer,
} from './ExchangeTypes';
import {
  DirectExchangeConsumer,
  FanoutExchangeConsumer,
  TopicExchangeConsumer,
  HeadersExchangeConsumer,
} from './ExchangeConsumers';

async function runExchangeExamples() {
  // 1. Direct Exchange Example
  const directExchange = 'direct-exchange';
  const directQueue = 'order-processing-queue';

  // Setup producer
  const directProducer = new DirectExchangeProducer(directExchange);
  await directProducer.connect();

  // Setup consumer
  const directConsumer = new DirectExchangeConsumer(
    directExchange,
    directQueue
  );
  await directConsumer.connect();
  await directConsumer.startConsuming(async (message) => {
    console.log('Direct Exchange - Processing order:', message);
  });

  // Send message
  await directProducer.publishMessage(
    { type: 'order', id: 1, status: 'created' },
    'order.created'
  );

  // 2. Fanout Exchange Example
  const fanoutExchange = 'fanout-exchange';
  const fanoutQueue1 = 'notification-queue-1';
  const fanoutQueue2 = 'notification-queue-2';

  // Setup producer
  const fanoutProducer = new FanoutExchangeProducer(fanoutExchange);
  await fanoutProducer.connect();

  // Setup consumers
  const fanoutConsumer1 = new FanoutExchangeConsumer(
    fanoutExchange,
    fanoutQueue1
  );
  await fanoutConsumer1.connect();
  await fanoutConsumer1.startConsuming(async (message) => {
    console.log('Fanout Exchange - Queue 1 received:', message);
  });

  const fanoutConsumer2 = new FanoutExchangeConsumer(
    fanoutExchange,
    fanoutQueue2
  );
  await fanoutConsumer2.connect();
  await fanoutConsumer2.startConsuming(async (message) => {
    console.log('Fanout Exchange - Queue 2 received:', message);
  });

  // Send message (received by both queues)
  await fanoutProducer.publishMessage({
    type: 'notification',
    message: 'System update available',
  });

  // 3. Topic Exchange Example
  const topicExchange = 'topic-exchange';
  const topicQueue = 'order-status-queue';

  // Setup producer
  const topicProducer = new TopicExchangeProducer(topicExchange);
  await topicProducer.connect();

  // Setup consumer with pattern
  const topicConsumer = new TopicExchangeConsumer(topicExchange, topicQueue);
  await topicConsumer.connect();
  await topicConsumer.startConsuming(async (message) => {
    console.log('Topic Exchange - Processing shipped order:', message);
  });

  // Send messages
  await topicProducer.publishMessage(
    { type: 'order', id: 2, status: 'shipped', region: 'europe' },
    'order.europe.shipped'
  );

  // 4. Headers Exchange Example
  const headersExchange = 'headers-exchange';
  const headersQueue = 'error-logging-queue';

  // Setup producer
  const headersProducer = new HeadersExchangeProducer(headersExchange);
  await headersProducer.connect();

  // Setup consumer with headers
  const headersConsumer = new HeadersExchangeConsumer(
    headersExchange,
    headersQueue
  );
  await headersConsumer.connect();
  await headersConsumer.startConsuming(async (message) => {
    console.log('Headers Exchange - Processing error log:', message);
  });

  // Send message with headers
  await headersProducer.publishMessageWithHeaders(
    { type: 'log', level: 'error', message: 'Payment failed' },
    {
      priority: 'high',
      source: 'payment-service',
      environment: 'production',
    }
  );

  // Cleanup after a delay
  setTimeout(async () => {
    await directProducer.close();
    await directConsumer.close();
    await fanoutProducer.close();
    await fanoutConsumer1.close();
    await fanoutConsumer2.close();
    await topicProducer.close();
    await topicConsumer.close();
    await headersProducer.close();
    await headersConsumer.close();
  }, 5000);
}

// Run the examples
runExchangeExamples().catch(console.error);
