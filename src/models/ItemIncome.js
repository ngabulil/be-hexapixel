const mongoose = require('mongoose');

const itemIncomeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ItemIncome', itemIncomeSchema);
