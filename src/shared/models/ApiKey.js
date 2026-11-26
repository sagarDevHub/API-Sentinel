import mongoose from 'mongoose';

const IPV4_CIDR_REGEX =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\/(?:3[0-2]|[12]?\d))?$/;

const getExpiryDays = () => {
  const parsed = parseInt(process.env.API_KEY_EXPIRY_DAYS || '365', 10);
  return Number.isNaN(parsed) || parsed <= 0 ? 365 : parsed;
};

const apiKeySchema = new mongoose.Schema(
  {
    keyId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    keyValue: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    environment: {
      type: String,
      enum: ['production', 'staging', 'development', 'testing'],
      default: 'production',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    permissions: {
      canIngest: {
        type: Boolean,
        default: true,
      },
      canReadAnalytics: {
        type: Boolean,
        default: false,
      },
      allowedServices: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    security: {
      allowedIPs: [
        {
          type: String,
          trim: true,
          validate: {
            validator(value) {
              return value === '0.0.0.0/0' || IPV4_CIDR_REGEX.test(value);
            },
            message: 'Invalid IPv4 address or CIDR range format',
          },
        },
      ],
      allowedOrigins: [
        {
          type: String,
          trim: true,
          validate: {
            validator(value) {
              if (value === '*') return true;
              try {
                const parsed = new URL(value);
                return parsed.protocol === 'http:' || parsed.protocol === 'https:';
              } catch {
                return false;
              }
            },
            message: 'Invalid origin format',
          },
        },
      ],
      lastRotated: {
        type: Date,
        default: Date.now,
      },
      rotationWarningDays: {
        type: Number,
        default: 30,
        min: 1,
      },
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + getExpiryDays() * 24 * 60 * 60 * 1000),
    },
    metadata: {
      purpose: {
        type: String,
        trim: true,
        maxlength: 200,
        default: '',
      },
      tags: [
        {
          type: String,
          trim: true,
          maxlength: 50,
        },
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'api_keys',
  }
);

apiKeySchema.index({ clientId: 1, isActive: 1 });
apiKeySchema.index({ environment: 1, clientId: 1 });
apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

export default ApiKey;
