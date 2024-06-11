const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const noteSchema = new Schema(
  {
    serviceProvider: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    noteType: {
      type: String,
    },
    priority: {
      type: String,
    },
    note: {
      type: String,
    },
    void: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    assignTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
const model = new mongoose.model("notes", noteSchema);
module.exports = model;
