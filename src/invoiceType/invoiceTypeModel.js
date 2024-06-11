const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const InvoiceType = new Schema({
  typeName: {
    type: String,
  },
  serviceProvider: {
    type: Schema.Types.ObjectId,
    ref: "ServiceProvider",
  },
  active: {
    type: Boolean,
    default: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
const model = new mongoose.model("InvoiceType", InvoiceType);
module.exports = model;
