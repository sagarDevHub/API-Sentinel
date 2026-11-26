import mongoose from 'mongoose';

const apiHitSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    method: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    },
    statusCode: {
      type: Number,
      required: true,
      min: 100,
      max: 599,
    },
    latencyMs: {
      type: Number,
      required: true,
      min: 0,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiKey',
      required: true,
    },
    ip: {
      type: String,
      required: true,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: 'api_hits',
  }
);

apiHitSchema.index({ clientId: 1, serviceName: 1, endpoint: 1, timestamp: -1 });
apiHitSchema.index({ clientId: 1, timestamp: -1, statusCode: 1 });
apiHitSchema.index({ apiKeyId: 1, timestamp: -1 });
apiHitSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

const ApiHit = mongoose.model('ApiHit', apiHitSchema);

export default ApiHit;
