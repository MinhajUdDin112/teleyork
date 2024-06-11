const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema({
  state: {
    type: String,
  },
  abbreviation: {
    type: String,
  },
  capital: {
    type: String,
  },
  
});

const zipCodes = mongoose.model("state", stateSchema);
module.exports = zipCodes;
