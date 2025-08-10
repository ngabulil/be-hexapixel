const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['super_admin', 'manager', 'employee'],
      default: 'employee',
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      default: '', // bisa simpan filename, path, atau URL
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
