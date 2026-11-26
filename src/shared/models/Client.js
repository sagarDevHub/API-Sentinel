import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug can only contain lowercase letters, numbers, and hyphens',
      ],
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator(value) {
          if (!value) return true;
          try {
            const parsed = new URL(value);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
          } catch {
            return false;
          }
        },
        message: 'Please enter a valid HTTP or HTTPS URL',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      dataRetentionDays: {
        type: Number,
        default: 30,
        min: 7,
        max: 365,
      },
      alertsEnabled: {
        type: Boolean,
        default: true,
      },
      timeZone: {
        type: String,
        trim: true,
        default: 'UTC',
      },
    },
  },
  {
    timestamps: true,
    collection: 'clients',
  }
);

clientSchema.index({ isActive: 1, createdAt: -1 });
clientSchema.index({ createdBy: 1 });

const Client = mongoose.model('Client', clientSchema);

export default Client;
