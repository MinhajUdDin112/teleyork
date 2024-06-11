const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const dataCapableSchema = new Schema({
  dataCapable: {
    type: String,
    required: true,
    unique: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
const model = new mongoose.model("dataCapable", dataCapableSchema);
module.exports = model;
