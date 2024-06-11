const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  cardNumber: String,
  cardType: String,
  securityCode: String,
  expDate: String,
  nameOnCard: String,
  receiptNumber: String,
  zipCode: String,
  city: String,
  state: String,
  billingAddress1: String,
  billingAddress2: String,
  amount: Number,
  currency: String,
  status: String,  // To store the status of the payment (success or fail)
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;