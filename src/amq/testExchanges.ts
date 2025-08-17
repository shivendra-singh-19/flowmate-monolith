import { SchedulerApi } from '../api/scheduler/SchedulerApi';

/**
 * Test function to demonstrate different exchange behaviors
 */
export async function testExchangeBehaviors() {
  try {
    console.log('\n=== Testing Direct Exchange ===');
    // This message will only go to order-created-queue
    await SchedulerApi.testDirectExchange(
      { type: 'order', id: '123', status: 'created' },
      { routingKey: 'order.created' }
    );

    // This message will only go to order-cancelled-queue
    await SchedulerApi.testDirectExchange(
      { type: 'order', id: '123', status: 'cancelled' },
      { routingKey: 'order.cancelled' }
    );

    console.log('\n=== Testing Fanout Exchange ===');
    // This message will go to BOTH notification queues
    await SchedulerApi.testFanoutExchange(
      { type: 'notification', message: 'System update available' },
      {}
    );

    console.log('\n=== Testing Topic Exchange ===');
    // This message will match the pattern 'order.*.created'
    await SchedulerApi.testTopicExchange(
      { type: 'order', id: '123', region: 'europe', status: 'created' },
      { routingKey: 'order.europe.created' }
    );

    // Test another region
    await SchedulerApi.testTopicExchange(
      { type: 'order', id: '456', region: 'asia', status: 'created' },
      { routingKey: 'order.asia.created' }
    );

    // Test a different status
    await SchedulerApi.testTopicExchange(
      { type: 'order', id: '789', region: 'america', status: 'shipped' },
      { routingKey: 'order.america.shipped' }
    );

    console.log('\n=== Testing Headers Exchange ===');
    // This message will match the headers
    await SchedulerApi.testHeadersExchange(
      { type: 'log', level: 'error', message: 'Payment failed' },
      {
        headers: {
          priority: 'high',
          source: 'payment-service',
        },
      }
    );
  } catch (error) {
    console.error('Error testing exchanges:', error);
  }
}
