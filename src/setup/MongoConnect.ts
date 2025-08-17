import mongoose from 'mongoose';

export class MongoConnect {
  static async connect(database: any) {
    const { url, name, enableDebugger } = database;
    mongoose.connect(`${url}/${name}`);
    mongoose.set('debug', enableDebugger);
  }
}
