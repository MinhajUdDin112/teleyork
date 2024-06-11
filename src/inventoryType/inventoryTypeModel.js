const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const NetworkSchema = new Schema({
  inventoryType: {
    type: String,
    required: true,
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
const model = new mongoose.model("inventoryType", NetworkSchema);
module.exports = model;
