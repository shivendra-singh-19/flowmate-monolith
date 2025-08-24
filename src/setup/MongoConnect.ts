import * as _ from 'lodash';
import mongoose from 'mongoose';
import * as qs from 'querystring';
export class MongoConnect {
  static async connect(database: any) {
    const { host, schema, debug } = database;
    const mongoURI = this.buildMongoUri(database);
    mongoose.connect(mongoURI);
    // mongoose.set('debug', enableDebugger);
  }

  static buildMongoUri(dbConfiguration) {
    const { user, host, schema, password } = dbConfiguration;
    const port = dbConfiguration.port || 27017;

    let mongoUri = 'mongodb://';
    if (user && password)
      mongoUri += `${encodeURIComponent(user)}:${encodeURIComponent(
        password
      )}@`;
    mongoUri += `${host}:${port}/${schema}`;

    const connectionOptions = dbConfiguration.options;
    if (!_.isEmpty(connectionOptions))
      mongoUri += `?${qs.stringify(connectionOptions)}`;

    return mongoUri;
  }
}
