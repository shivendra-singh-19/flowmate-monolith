import {
  DirectExchangeConsumer,
  FanoutExchangeConsumer,
  TopicExchangeConsumer,
  HeadersExchangeConsumer,
} from './ExchangeConsumers';

/**
 * Initializes and starts all the consumers for different exchange types
 *
 * This function sets up consumers for:
 * 1. Direct Exchange - For point-to-point messaging
 * 2. Fanout Exchange - For broadcast messaging
 * 3. Topic Exchange - For pattern-based routing
 * 4. Headers Exchange - For header-based routing
 *
 * Each consumer:
 * - Connects to RabbitMQ
 * - Creates its queue
 * - Binds to its exchange
 * - Starts consuming messages
 */
export async function initializeConsumers() {
  try {
    // =============================================
    // 1. Direct Exchange Consumers
    // =============================================
    // Direct Exchange routes messages based on exact routing key matches
    // Each queue receives only messages with matching routing keys

    // Consumer for order.created events
    const orderCreatedConsumer = new DirectExchangeConsumer(
      'direct-exchange',
      'order-created-queue'
    );
    await orderCreatedConsumer.connect();
    await orderCreatedConsumer.bindQueue('order.created');
    await orderCreatedConsumer.startConsuming(async (message) => {
      console.log('Direct Exchange - Order Created Queue:', message);
    });

    // Consumer for order.cancelled events
    const orderCancelledConsumer = new DirectExchangeConsumer(
      'direct-exchange',
      'order-cancelled-queue'
    );
    await orderCancelledConsumer.connect();
    await orderCancelledConsumer.bindQueue('order.cancelled');
    await orderCancelledConsumer.startConsuming(async (message) => {
      console.log('Direct Exchange - Order Cancelled Queue:', message);
    });

    // =============================================
    // 2. Fanout Exchange Consumers
    // =============================================
    // Fanout Exchange broadcasts messages to all bound queues
    // Routing keys are ignored, all queues receive all messages

    // First notification queue
    const notificationQueue1 = new FanoutExchangeConsumer(
      'fanout-exchange',
      'notification-queue-1'
    );
    await notificationQueue1.connect();
    await notificationQueue1.bindQueue();
    await notificationQueue1.startConsuming(async (message) => {
      console.log('Fanout Exchange - Notification Queue 1:', message);
    });

    // Second notification queue
    const notificationQueue2 = new FanoutExchangeConsumer(
      'fanout-exchange',
      'notification-queue-2'
    );
    await notificationQueue2.connect();
    await notificationQueue2.bindQueue();
    await notificationQueue2.startConsuming(async (message) => {
      console.log('Fanout Exchange - Notification Queue 2:', message);
    });

    // =============================================
    // 3. Topic Exchange Consumers
    // =============================================
    // Topic Exchange routes messages based on pattern matching
    // * matches one word, # matches zero or more words
    //
    // IMPORTANT: The order of pattern matching matters
    // More specific patterns should be bound first
    //
    // Example routing keys from test:
    // - order.europe.created
    // - order.asia.created
    // - order.america.shipped

    // Consumer for all order.created events (any region)
    // Pattern: order.*.created
    // Matches: order.europe.created, order.asia.created
    // Does NOT match: order.america.shipped
    const createdOrdersConsumer = new TopicExchangeConsumer(
      'topic-exchange',
      'created-orders-queue'
    );
    await createdOrdersConsumer.connect();
    await createdOrdersConsumer.bindQueue('order.*.created');
    await createdOrdersConsumer.startConsuming(async (message) => {
      console.log('Topic Exchange - Created Orders Queue:', message);
    });

    // Consumer for all order.shipped events (any region)
    // Pattern: order.*.shipped
    // Matches: order.america.shipped
    // Does NOT match: order.europe.created, order.asia.created
    const shippedOrdersConsumer = new TopicExchangeConsumer(
      'topic-exchange',
      'shipped-orders-queue'
    );
    await shippedOrdersConsumer.connect();
    await shippedOrdersConsumer.bindQueue('order.*.shipped');
    await shippedOrdersConsumer.startConsuming(async (message) => {
      console.log('Topic Exchange - Shipped Orders Queue:', message);
    });

    // Consumer for all order events (any status, any region)
    // Pattern: order.#
    // Matches ALL:
    // - order.europe.created
    // - order.asia.created
    // - order.america.shipped
    // This is because # matches zero or more words
    const allOrdersConsumer = new TopicExchangeConsumer(
      'topic-exchange',
      'all-orders-queue'
    );
    await allOrdersConsumer.connect();
    await allOrdersConsumer.bindQueue('order.#');
    await allOrdersConsumer.startConsuming(async (message) => {
      console.log('Topic Exchange - All Orders Queue:', message);
    });

    // =============================================
    // 4. Headers Exchange Consumer
    // =============================================
    // Headers Exchange routes messages based on header values
    // x-match: 'all' means all headers must match
    // x-match: 'any' means any header can match

    const logConsumer = new HeadersExchangeConsumer(
      'headers-exchange',
      'log-queue'
    );
    await logConsumer.connect();
    await logConsumer.bindQueue({
      'x-match': 'all', // All headers must match
      priority: 'high',
      source: 'payment-service',
    });
    await logConsumer.startConsuming(async (message) => {
      console.log('Headers Exchange - Log:', message);
    });

    console.log('All consumers initialized and running');
  } catch (error) {
    console.error('Error initializing consumers:', error);
    throw error;
  }
}
