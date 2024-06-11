const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const CompanySchema = new Schema({
   createdBy: { type: Schema.Types.ObjectId, ref: "SuperAdminUser" },
   updatedBy:{ type: Schema.Types.ObjectId, ref: "SuperAdminUser" },
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
  active:{
    type:Boolean,
    default:true
  }
});
const model = new mongoose.model("MiddlewareCompany", CompanySchema);
module.exports = model;
