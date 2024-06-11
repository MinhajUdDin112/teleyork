const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const SacNumberSchema = new mongoose.Schema({
  state: {
    type: String,
  },
  sac: {
    type: Number,
  },
  serviceProvider: {
    type: Schema.Types.ObjectId,
    ref: "ServiceProvider",
  },
});

const zipCodes = mongoose.model("SacNumber", SacNumberSchema);
module.exports = zipCodes;
