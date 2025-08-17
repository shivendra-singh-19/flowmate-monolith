import { initializeConsumers } from './consumerInit';

/**
 * Main function to start the AMQ consumers
 */
export async function startConsumers() {
  try {
    console.log('Starting AMQ consumers...');
    await initializeConsumers();
  } catch (error) {
    console.error('Failed to start consumers:', error);
    process.exit(1);
  }
}

// Start the consumers
startConsumers();

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down consumers...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down consumers...');
  process.exit(0);
});
