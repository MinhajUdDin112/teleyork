const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const imeiTypeSchema = new Schema({
  imeiType: {
    type: String,
    required: true,
    unique: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
const model = new mongoose.model("imeiType", imeiTypeSchema);
module.exports = model;
