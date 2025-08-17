import {
  DirectExchangeProducer,
  FanoutExchangeProducer,
  TopicExchangeProducer,
  HeadersExchangeProducer,
} from './ExchangeTypes';

async function runExchangeExamples() {
  // 1. Direct Exchange Example
  // Messages are routed to queues based on exact matching of routing keys
  const directProducer = new DirectExchangeProducer('direct-exchange');
  await directProducer.connect();
  await directProducer.publishMessage(
    { type: 'order', id: 1 },
    'order.created' // routing key
  );
  await directProducer.close();

  // 2. Fanout Exchange Example
  // Messages are broadcast to all bound queues, routing key is ignored
  const fanoutProducer = new FanoutExchangeProducer('fanout-exchange');
  await fanoutProducer.connect();
  await fanoutProducer.publishMessage(
    { type: 'notification', message: 'System update' }
    // routing key is ignored in fanout exchanges
  );
  await fanoutProducer.close();

  // 3. Topic Exchange Example
  // Messages are routed based on pattern matching of routing keys
  const topicProducer = new TopicExchangeProducer('topic-exchange');
  await topicProducer.connect();
  await topicProducer.publishMessage(
    { type: 'order', status: 'shipped' },
    'order.europe.shipped' // routing key with pattern matching
  );
  await topicProducer.close();

  // 4. Headers Exchange Example
  // Messages are routed based on header values instead of routing keys
  const headersProducer = new HeadersExchangeProducer('headers-exchange');
  await headersProducer.connect();
  await headersProducer.publishMessageWithHeaders(
    { type: 'log', level: 'error' },
    {
      'x-match': 'all', // 'all' means all headers must match
      priority: 'high',
      source: 'payment-service',
    }
  );
  await headersProducer.close();
}

// Run the examples
runExchangeExamples().catch(console.error);
