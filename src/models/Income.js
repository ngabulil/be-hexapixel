const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ItemIncome',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    whatsapp: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return /^08\d{8,11}$/.test(v);
        },
        message: 'Invalid WhatsApp number format',
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Income', incomeSchema);
