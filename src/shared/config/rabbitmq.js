// import amqp from 'amqplib';
// import config from './index';
// import logger from './logger';

// class RabbitMQConnection {
//   constructor() {
//     this.connection = null;
//     this.channel = null;
//     this.isConnecting = false;
//   }

//   async connect() {
//     if (this.channel) {
//       return this.channel;
//     }

//     if (this.isConnecting) {
//       await new Promise(res => {
//         const checkInterval = setInterval(() => {
//           if (!this.isConnecting) {
//             clearInterval(checkInterval);
//             res();
//           }
//         }, 100);
//       });
//       return this.channel;
//     }
//     try {
//       this.isConnecting = true;

//       logger.info('Connecting to RabbitMQ: ', config.rabbitmq.url);
//       this.connection = await amqp.connect(config.rabbitmq.url);
//       this.channel = await this.connection.createChannel();

//       const dlqName = `${config.rabbitmq.queue}.dlq`;
//       await this.channel.assertQueue(dlqName, {
//         durable: true,
//       });

//       await this.channel.assertQueue(config.rabbitmq.queue, {
//         durable: true,
//         arguments: {
//           'x-dead-letter-exchange': '',
//           'x-dead-letter-routing-key': dlqName,
//         },
//       });

//       logger.info('RabbitMQ connected, Queue: ', config.rabbitmq.queue);

//       this.connection.on('close', () => {
//         logger.warn('RabbitMQ connection closed');
//         this.connection = null;
//         this.channel = null;
//       });

//       this.connection.on('error', err => {
//         logger.error('RabbitMQ connection error: ', err);
//         this.connection = null;
//         this.channel = null;
//       });

//       this.isConnecting = false;
//       return this.channel;
//     } catch (error) {
//       this.isConnecting = false;
//       logger.error('Failed to connect to RabbitMQ: ', error);
//       throw error;
//     }
//   }

//   getChannel() {
//     return this.channel;
//   }

//   getStatus() {
//     if (!this.connection || !this.channel) return 'disconnected';
//     if (this.connection.closing) return 'closing';
//     return 'connected';
//   }

//   async close() {
//     try {
//       if (this.channel) {
//         await this.channel.close();
//         this.channel = null;
//       }
//       if (this.connection) {
//         await this.connection.close();
//         this.connection = null;
//       }

//       logger.info('RabbitMQ connection closed');
//     } catch (error) {
//       logger.error('Error in closing RabbitMQ connection: ', error);
//     }
//   }
// }

// export default new RabbitMQConnection();

import { EventEmitter } from 'events';
import amqp from 'amqplib';
import config from './index.js';
import logger from './logger.js';

class RabbitMQConnection extends EventEmitter {
  constructor() {
    super();
    this.connection = null;
    this.channel = null;
    this.isConnecting = false;
    this.isClosing = false;
    this.reconnectTimer = null;
    this.reconnectDelayMs = 1000;
  }

  async connect() {
    if (this.channel && !this.isClosing) {
      return this.channel;
    }

    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        const onReady = ch => {
          cleanup();
          resolve(ch);
        };
        const onFail = err => {
          cleanup();
          reject(err);
        };
        const cleanup = () => {
          this.off('ready', onReady);
          this.off('error', onFail);
        };
        this.once('ready', onReady);
        this.once('error', onFail);
      });
    }

    this.isConnecting = true;
    this.isClosing = false;

    try {
      logger.info(`Connecting to RabbitMQ (queue: ${config.rabbitmq.queue})`);
      const conn = await amqp.connect(config.rabbitmq.url);
      const ch = await conn.createChannel();

      const dlqName = `${config.rabbitmq.queue}.dlq`;
      await ch.assertQueue(dlqName, { durable: true });
      await ch.assertQueue(config.rabbitmq.queue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': dlqName,
        },
      });

      conn.on('error', err => {
        logger.error('RabbitMQ connection error:', err);
        this._resetState();
        this._scheduleReconnect();
      });

      conn.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this._resetState();
        if (!this.isClosing) {
          this._scheduleReconnect();
        }
      });

      ch.on('error', err => {
        logger.error('RabbitMQ channel error:', err);
        this.channel = null;
      });

      ch.on('close', () => {
        logger.warn('RabbitMQ channel closed');
        this.channel = null;
      });

      this.connection = conn;
      this.channel = ch;
      this.reconnectDelayMs = 1000;
      this.isConnecting = false;

      logger.info(`RabbitMQ connected, Queue: ${config.rabbitmq.queue}`);
      this.emit('ready', this.channel);
      return this.channel;
    } catch (error) {
      this.isConnecting = false;
      logger.error('Failed to connect to RabbitMQ:', error);
      this.emit('error', error);
      if (!this.isClosing) {
        this._scheduleReconnect();
      }
      throw error;
    }
  }

  _resetState() {
    this.connection = null;
    this.channel = null;
    this.isConnecting = false;
  }

  _scheduleReconnect() {
    if (this.isClosing || this.reconnectTimer) {
      return;
    }

    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 30000);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
      } catch {
        // Error already logged and next backoff scheduled in connect()
      }
    }, delay);
  }

  getChannel() {
    return this.channel;
  }

  getStatus() {
    if (this.isClosing) return 'closing';
    if (this.isConnecting) return 'connecting';
    if (!this.connection || !this.channel) return 'disconnected';
    return 'connected';
  }

  async close() {
    this.isClosing = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
    } finally {
      this._resetState();
    }
  }
}

export default new RabbitMQConnection();
