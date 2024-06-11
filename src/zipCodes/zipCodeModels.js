const mongoose = require("mongoose");

const zipCodesSchema = new mongoose.Schema({
  state: {
    type: String,
  },
  abbreviation: {
    type: String,
  },
  zipCode: {
    type: String,
  },
  population: {
    type: String,
  },
  city: {
    type: String,
  },
  county: {
    type: String,
  },
});

const zipCodes = mongoose.model("zipCodes", zipCodesSchema);
module.exports = zipCodes;
