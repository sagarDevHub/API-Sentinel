import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import SecurityUtils from '../utils/SecurityUtils.js';

const BCRYPT_HASH_REGEX = /^\$2[abxy]\$\d{2}\$/;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
      validate: {
        validator(username) {
          return /^[a-zA-Z0-9_-]+$/.test(username);
        },
        message: 'Please enter a valid username',
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator(email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please enter a valid email',
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
      validate: {
        validator(password) {
          if (!this.isModified('password') || !password) {
            return true;
          }
          if (BCRYPT_HASH_REGEX.test(password)) {
            return true;
          }
          const validation = SecurityUtils.validatePassword(password);
          return validation.success;
        },
        message(props) {
          const val = props.value;
          if (!val || BCRYPT_HASH_REGEX.test(val)) {
            return 'Password validation failed';
          }
          const validation = SecurityUtils.validatePassword(val);
          return validation.errors.join('. ');
        },
      },
    },
    role: {
      type: String,
      enum: ['super_admin', 'client_admin', 'client_viewer'],
      default: 'client_admin',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required() {
        return this.role !== 'super_admin';
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    permissions: {
      canCreateApiKeys: {
        type: Boolean,
        default: false,
      },
      canManageUsers: {
        type: Boolean,
        default: false,
      },
      canViewAnalytics: {
        type: Boolean,
        default: true,
      },
      canExportData: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password') || BCRYPT_HASH_REGEX.test(this.password)) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.index({ clientId: 1, isActive: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;
