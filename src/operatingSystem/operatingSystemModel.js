const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const operatingSystemSchema = new Schema({
  operatingSystem: {
    type: String,
    required: true,
    unique: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
const model = new mongoose.model("operatingSystem", operatingSystemSchema);
module.exports = model;
