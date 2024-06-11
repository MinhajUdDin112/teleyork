const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const NetworkSchema = new Schema({
  networkType: {
    type: String,
    required: true,
    unique: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
const model = new mongoose.model("Network", NetworkSchema);
module.exports = model;
