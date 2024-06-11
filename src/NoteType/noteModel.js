const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const noteTypeSchema = new Schema({
  serviceProvider: {
    type: Schema.Types.ObjectId,
    ref: "ServiceProvider",
  },
  noteType: {
    type: String,
  },
  status: {
    type: Boolean,
    default: true,
  },
  note: {
    type: String,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
const model = new mongoose.model("noteType", noteTypeSchema);
module.exports = model;
