const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// API Log model
const apiLogSchema = new Schema(
  {
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    serviceProvider: { type: Schema.Types.ObjectId, ref: "ServiceProvider" },
    // other fields as needed
  },
  { timestamps: true }
);
const model = mongoose.model("APILog", apiLogSchema);
module.exports = model;
