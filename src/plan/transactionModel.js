const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the transaction schema
const transactionSchema = new mongoose.Schema({
  mdn: {
    type: String,
  },
  itemId: {
    type: Schema.Types.ObjectId,
    ref: "Plan",
  },
  transactionType: {
    type: String,
  },
  status: {
    type: String,
  },
  price: {
    type: Number,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  fullName: {
    type: String,
  },
});

// Create the Transaction model
const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
