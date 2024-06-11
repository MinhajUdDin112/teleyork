const mongoose = require("mongoose");

const termsAndConditionsSchema = new mongoose.Schema({
  content: { type: String, required: true },
});

const termsAndConditionsModel = mongoose.model(
  "TermsAndConditions",
  termsAndConditionsSchema
);
module.exports = termsAndConditionsModel;
