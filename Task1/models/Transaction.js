
// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  hash: String,
  from: String,
  to: String,
  value: String,
});

module.exports = mongoose.model('Transaction', transactionSchema);
