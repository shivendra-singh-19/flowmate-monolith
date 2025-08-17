import amqp from 'amqplib';

/**
 * Base class for all exchange consumers
 * Handles common functionality like connection management and message consumption
 */
export abstract class ExchangeConsumer {
  protected connection: amqp.Connection | null = null;
  protected channel: amqp.Channel | null = null;
  protected readonly exchangeName: string;
  protected readonly exchangeType: string;
  protected readonly queueName: string;

  constructor(exchangeName: string, exchangeType: string, queueName: string) {
    this.exchangeName = exchangeName;
    this.exchangeType = exchangeType;
    this.queueName = queueName;
  }

  /**
   * Connects to RabbitMQ and sets up the consumer
   *
   * Connection Configuration:
   * - Timeout: 30 minutes (1800000 ms)
   * - Heartbeat: 60 seconds
   * - Durable: true (queue survives broker restart)
   */
  async connect() {
    try {
      this.connection = await amqp.connect({
        protocol: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'localhost',
        port: Number(process.env.RABBITMQ_PORT) || 5672,
        username: process.env.RABBITMQ_USERNAME || 'guest',
        password: process.env.RABBITMQ_PASSWORD || 'guest',
        timeout: 1800000,
        heartbeat: 60,
      });

      this.channel = await this.connection.createChannel();

      // Assert the exchange exists
      await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
        durable: true,
      });

      // Assert the queue exists
      await this.channel.assertQueue(this.queueName, { durable: true });

      console.log(
        `Connected to RabbitMQ and set up consumer for exchange: ${this.exchangeName}`
      );
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Starts consuming messages from the queue
   * @param callback - Function to handle incoming messages
   */
  async startConsuming(callback: (message: any) => Promise<void>) {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }

    try {
      await this.channel.consume(this.queueName, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await callback(content);
            this.channel?.ack(msg); // Acknowledge the message
          } catch (error) {
            console.error('Error processing message:', error);
            this.channel?.nack(msg); // Negative acknowledge the message
          }
        }
      });

      console.log(`Started consuming from queue: ${this.queueName}`);
    } catch (error) {
      console.error('Error starting consumer:', error);
      throw error;
    }
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    console.log('RabbitMQ connection closed');
  }
}

/**
 * Direct Exchange Consumer
 *
 * Usage:
 * const consumer = new DirectExchangeConsumer('direct-exchange', 'order-queue');
 * await consumer.connect();
 * await consumer.bindQueue('order.created');
 * await consumer.startConsuming(async (message) => {
 *   console.log('Received order:', message);
 * });
 */
export class DirectExchangeConsumer extends ExchangeConsumer {
  constructor(exchangeName: string, queueName: string) {
    super(exchangeName, 'direct', queueName);
  }

  /**
   * Binds the queue to the exchange with a specific routing key
   * @param routingKey - The routing key to bind the queue with
   */
  async bindQueue(routingKey: string) {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }
    await this.channel.bindQueue(this.queueName, this.exchangeName, routingKey);
    console.log(
      `Bound queue ${this.queueName} to exchange ${this.exchangeName} with routing key ${routingKey}`
    );
  }
}

/**
 * Fanout Exchange Consumer
 *
 * Usage:
 * const consumer = new FanoutExchangeConsumer('fanout-exchange', 'notification-queue');
 * await consumer.connect();
 * await consumer.bindQueue();
 * await consumer.startConsuming(async (message) => {
 *   console.log('Received notification:', message);
 * });
 */
export class FanoutExchangeConsumer extends ExchangeConsumer {
  constructor(exchangeName: string, queueName: string) {
    super(exchangeName, 'fanout', queueName);
  }

  /**
   * Binds the queue to the fanout exchange (routing key is ignored)
   */
  async bindQueue() {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }
    await this.channel.bindQueue(this.queueName, this.exchangeName, '');
    console.log(
      `Bound queue ${this.queueName} to fanout exchange ${this.exchangeName}`
    );
  }
}

/**
 * Topic Exchange Consumer
 *
 * Usage:
 * const consumer = new TopicExchangeConsumer('topic-exchange', 'order-queue');
 * await consumer.connect();
 * await consumer.bindQueue('order.*.created');
 * await consumer.startConsuming(async (message) => {
 *   console.log('Received order:', message);
 * });
 */
export class TopicExchangeConsumer extends ExchangeConsumer {
  constructor(exchangeName: string, queueName: string) {
    super(exchangeName, 'topic', queueName);
  }

  /**
   * Binds the queue to the exchange with a topic pattern
   * @param pattern - The topic pattern to bind the queue with (e.g., 'order.*.created')
   */
  async bindQueue(pattern: string) {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }
    await this.channel.bindQueue(this.queueName, this.exchangeName, pattern);
    console.log(
      `Bound queue ${this.queueName} to exchange ${this.exchangeName} with pattern ${pattern}`
    );
  }
}

/**
 * Headers Exchange Consumer
 *
 * Usage:
 * const consumer = new HeadersExchangeConsumer('headers-exchange', 'log-queue');
 * await consumer.connect();
 * await consumer.bindQueue({
 *   'x-match': 'all',
 *   'priority': 'high',
 *   'source': 'payment-service'
 * });
 * await consumer.startConsuming(async (message) => {
 *   console.log('Received log:', message);
 * });
 */
export class HeadersExchangeConsumer extends ExchangeConsumer {
  constructor(exchangeName: string, queueName: string) {
    super(exchangeName, 'headers', queueName);
  }

  /**
   * Binds the queue to the exchange with specific headers
   * @param headers - The headers to match (e.g., { 'x-match': 'all', 'priority': 'high' })
   */
  async bindQueue(headers: { [key: string]: any }) {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }
    await this.channel.bindQueue(this.queueName, this.exchangeName, '', {
      headers,
    });
    console.log(
      `Bound queue ${this.queueName} to exchange ${this.exchangeName} with headers:`,
      headers
    );
  }
}
