import amqp from 'amqplib';
import { config } from '../index';

export class MessageProducer {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly queueName: string;

  constructor(queueName: string) {
    this.queueName = queueName;
  }

  async connect() {
    try {
      // Establish connection to RabbitMQ server
      this.connection = await amqp.connect(config.rabbitmq.url);
      // Create a channel for communication
      this.channel = await this.connection.createChannel();

      // Assert the queue exists
      // This is a crucial step because:
      // 1. If the queue doesn't exist, it will be created
      // 2. If the queue exists, it verifies its properties match what we want
      // 3. It ensures the queue is properly configured before we start using it
      // 4. It prevents errors from trying to publish to a non-existent queue
      await this.channel.assertQueue(this.queueName, {
        durable: true, // Make the queue persistent
        // durable: true means the queue will survive a RabbitMQ server restart
        // Messages in a durable queue will be recovered when the server restarts
        // This is important for mission-critical messages that must not be lost
      });

      console.log(
        `Connected to RabbitMQ and asserted queue: ${this.queueName}`
      );
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  }

  async publishMessage(message: any) {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }

    try {
      // Convert the message to a buffer for transmission
      const messageBuffer = Buffer.from(JSON.stringify(message));

      // Publish the message to the queue
      const success = this.channel.sendToQueue(this.queueName, messageBuffer, {
        persistent: true, // Make the message persistent
        // persistent: true means the message will be written to disk
        // This ensures the message survives a RabbitMQ server restart
        // Combined with durable: true on the queue, this provides maximum reliability
      });

      if (!success) {
        console.warn('Message was not sent to queue - queue might be full');
      } else {
        console.log(`Message published to queue: ${this.queueName}`);
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
