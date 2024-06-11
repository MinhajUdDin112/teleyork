const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const CompanySchema = new Schema({
  superAdminUser: {
    type: Schema.Types.ObjectId,
    ref: "SuperAdminUser",
  },
  name: {
    type: String,
    required: true,
  },
  alias: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});
const model = new mongoose.model("company", CompanySchema);
module.exports = model;
