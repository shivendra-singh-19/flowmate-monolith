import amqp from 'amqplib';
import { config } from '../index';

/**
 * Base class for all exchange producers
 * Handles common functionality like connection management and message publishing
 */
export abstract class ExchangeProducer {
  protected connection: amqp.Connection | null = null;
  protected channel: amqp.Channel | null = null;
  protected readonly exchangeName: string;
  protected readonly exchangeType: string;

  constructor(exchangeName: string, exchangeType: string) {
    this.exchangeName = exchangeName;
    this.exchangeType = exchangeType;
  }

  /**
   * Connects to RabbitMQ and creates a channel
   *
   * Connection Configuration:
   * - Timeout: 30 minutes (1800000 ms)
   * - Heartbeat: 60 seconds
   * - Durable: true (exchange survives broker restart)
   */
  async connect() {
    try {
      this.connection = await amqp.connect({
        protocol: 'amqp',
        hostname: process.env.RABBITMQ_HOST || 'localhost',
        port: Number(process.env.RABBITMQ_PORT) || 5672,
        username: process.env.RABBITMQ_USERNAME || 'guest',
        password: process.env.RABBITMQ_PASSWORD || 'guest',
        timeout: 1800000, // 30 minutes in milliseconds
        heartbeat: 60, // 60 seconds
      });

      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
        durable: true,
      });

      console.log(
        `Connected to RabbitMQ and asserted exchange: ${this.exchangeName} of type ${this.exchangeType}`
      );
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  }

  async publishMessage(message: any, routingKey: string = '') {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));

      // Publish the message to the exchange
      const success = this.channel.publish(
        this.exchangeName,
        routingKey,
        messageBuffer,
        {
          persistent: true, // Make the message persistent
        }
      );

      if (!success) {
        console.warn(
          'Message was not sent to exchange - exchange might be full'
        );
      } else {
        console.log(
          `Message published to exchange: ${this.exchangeName} with routing key: ${routingKey}`
        );
      }
    } catch (error) {
      console.error('Error publishing message:', error);
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
 * Direct Exchange Producer
 *
 * Characteristics:
 * - Routes messages to queues based on exact routing key matches
 * - One-to-one message routing
 * - Perfect for point-to-point messaging
 *
 * Consumer Setup:
 * 1. Create a queue: await channel.assertQueue('queue-name')
 * 2. Bind queue to exchange: await channel.bindQueue('queue-name', 'exchange-name', 'routing-key')
 * 3. Consume messages: await channel.consume('queue-name', (msg) => { ... })
 *
 * Use Cases:
 * - Order processing where different queues handle different order states
 * - Task distribution to specific workers
 * - Command routing to specific services
 */
export class DirectExchangeProducer extends ExchangeProducer {
  constructor(exchangeName: string) {
    super(exchangeName, 'direct');
  }
}

/**
 * Fanout Exchange Producer
 *
 * Characteristics:
 * - Broadcasts messages to all bound queues
 * - Ignores routing keys
 * - One-to-many message routing
 *
 * Consumer Setup:
 * 1. Create a queue: await channel.assertQueue('queue-name')
 * 2. Bind queue to exchange: await channel.bindQueue('queue-name', 'exchange-name', '')
 *    (routing key is ignored, can be empty string)
 * 3. Consume messages: await channel.consume('queue-name', (msg) => { ... })
 *
 * Use Cases:
 * - Broadcasting system updates
 * - Real-time notifications
 * - Event logging to multiple services
 * - Cache invalidation
 */
export class FanoutExchangeProducer extends ExchangeProducer {
  constructor(exchangeName: string) {
    super(exchangeName, 'fanout');
  }
}

/**
 * Topic Exchange Producer
 *
 * Characteristics:
 * - Routes messages based on pattern matching of routing keys
 * - Uses wildcards: * (single word) and # (zero or more words)
 * - Flexible routing based on patterns
 *
 * Consumer Setup:
 * 1. Create a queue: await channel.assertQueue('queue-name')
 * 2. Bind queue to exchange: await channel.bindQueue('queue-name', 'exchange-name', 'pattern.*.key')
 * 3. Consume messages: await channel.consume('queue-name', (msg) => { ... })
 *
 * Pattern Examples:
 * - 'order.*.created' matches 'order.europe.created' but not 'order.europe.region.created'
 * - 'order.#.created' matches both 'order.europe.created' and 'order.europe.region.created'
 *
 * Use Cases:
 * - Regional order processing
 * - Multi-level event routing
 * - Hierarchical message distribution
 */
export class TopicExchangeProducer extends ExchangeProducer {
  constructor(exchangeName: string) {
    super(exchangeName, 'topic');
  }
}

/**
 * Headers Exchange Producer
 *
 * Characteristics:
 * - Routes messages based on header values instead of routing keys
 * - Can match all headers (x-match: all) or any headers (x-match: any)
 * - Most flexible but least performant exchange type
 *
 * Consumer Setup:
 * 1. Create a queue: await channel.assertQueue('queue-name')
 * 2. Bind queue to exchange: await channel.bindQueue('queue-name', 'exchange-name', '', {
 *      headers: {
 *          'x-match': 'all', // or 'any'
 *          'priority': 'high',
 *          'source': 'payment-service'
 *      }
 *    })
 * 3. Consume messages: await channel.consume('queue-name', (msg) => { ... })
 *
 * Use Cases:
 * - Complex routing based on multiple message attributes
 * - Message filtering based on metadata
 * - Multi-criteria message routing
 */
export class HeadersExchangeProducer extends ExchangeProducer {
  constructor(exchangeName: string) {
    super(exchangeName, 'headers');
  }

  async publishMessageWithHeaders(
    message: any,
    headers: { [key: string]: any }
  ) {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));

      // Publish the message to the exchange with headers
      const success = this.channel.publish(
        this.exchangeName,
        '', // routing key is ignored for headers exchange
        messageBuffer,
        {
          persistent: true,
          headers: headers,
        }
      );

      if (!success) {
        console.warn(
          'Message was not sent to exchange - exchange might be full'
        );
      } else {
        console.log(
          `Message published to headers exchange: ${this.exchangeName} with headers:`,
          headers
        );
      }
    } catch (error) {
      console.error('Error publishing message:', error);
      throw error;
    }
  }
}
