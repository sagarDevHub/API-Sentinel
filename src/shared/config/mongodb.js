// import mongoose from 'mongoose';
// import config from './index';
// import logger from './logger';

// class MongoConnection {
//   constructor() {
//     this.connection = null;
//   }

//   /**
//    * Connect to MongoDB
//    * @returns {Promise<mongoose.Connection>}
//    */
//   async connect() {
//     try {
//       if (this.connection) {
//         logger.info(`Mongodb already connected :(`);
//         return this.connection;
//       }

//       await mongoose.connect(config.mongo.uri, {
//         dbName: config.mongo.dbName,
//       });

//     this.connection = mongoose.connection;
//       logger.info(`MongoDB connected: ${config.mongo.uri}`);

//       this.connection.on('error', err => {
//         logger.error(`MongoDB connection error: ${err}`);
//       });
//       this.connection.on('disconnected', () => {
//         logger.error(`MongoDB disconnected`);
//       });

//       return this.connection;
//     } catch (error) {
//       logger.error(`Failed to connect to MongoDB: ${error}`);
//       throw error;
//     }
//   }
//   /**
//    * This is to disconnect the MongoDB connection
//    */
//   async disconnect() {
//     try {
//       if (this.connection) {
//         await mongoose.disconnect();
//         this.connection = null;
//         logger.info(`MongoDB disconnected :(`);
//       }
//     } catch (error) {
//       logger.error(`Failed to disconnect to MongoDB: ${error}`);
//       throw error;
//     }
//   }

//   /**
//    * Get the active connection
//    * @returns {mongoose.Connection}
//    */
//   getConnection() {
//     return this.connection;
//   }
// }

// export default new MongoConnection();

import mongoose from 'mongoose';
import config from './index.js';
import logger from './logger.js';

class MongoConnection {
  constructor() {
    this.connection = null;
    this.listenersAttached = false;
  }

  _attachListeners() {
    if (this.listenersAttached) {
      return;
    }

    mongoose.connection.on('connected', () => {
      logger.info(`MongoDB connected (db: ${config.mongo.dbName})`);
    });

    mongoose.connection.on('error', err => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    this.listenersAttached = true;
  }

  /**
   * Connect to MongoDB
   * @returns {Promise<mongoose.Connection>}
   */
  async connect() {
    try {
      if (this.connection && mongoose.connection.readyState === 1) {
        logger.debug('MongoDB already connected');
        return this.connection;
      }

      this._attachListeners();

      await mongoose.connect(config.mongo.uri, {
        dbName: config.mongo.dbName,
      });

      this.connection = mongoose.connection;
      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      this.connection = null;
      logger.info('MongoDB disconnected');
    } catch (error) {
      logger.error('Failed to disconnect from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Get the active Mongoose connection
   * @returns {mongoose.Connection | null}
   */
  getConnection() {
    return this.connection;
  }

  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[mongoose.connection.readyState] ?? 'unknown';
  }
}

export default new MongoConnection();
