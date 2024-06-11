const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const NetworkSchema = new Schema({
  simType: {
    type: String,
    required: true,
    unique: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
const model = new mongoose.model("simType", NetworkSchema);
module.exports = model;
