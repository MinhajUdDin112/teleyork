const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const billingModel = new Schema({
  billingModel: {
    type: String,
    required: true,
  },
  serviceProvider: {
    type: Schema.Types.ObjectId,
    ref: "ServiceProvider",
  },
  inventory: {
    type: [String],
  },
  active: {
    type: Boolean,
    default: true,
  },
  module: {
    type: Schema.Types.ObjectId,
    ref: "Module",
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
const model = new mongoose.model("billingModel", billingModel);
module.exports = model;
