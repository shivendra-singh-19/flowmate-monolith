import { Queue } from 'bullmq';

export class QueueInstance {
  private static queueInstances: Map<string, Queue<any>> = new Map();
  private static createInstance(name: string) {
    const queue = new Queue(name);
    return queue;
  }

  public static getInstance(name: string) {
    if (this.queueInstances.has(name)) {
      return this.queueInstances.get(name);
    }

    const newQueue = this.createInstance(name);
    this.queueInstances.set(name, newQueue);
    return newQueue;
  }
}
