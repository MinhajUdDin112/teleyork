const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const deviceTypeSchema = new Schema({
  deviceType: {
    type: String,
    required: true,
    unique: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
const model = new mongoose.model("deviceType", deviceTypeSchema);
module.exports = model;
