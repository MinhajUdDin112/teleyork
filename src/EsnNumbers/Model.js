const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const EsnSchema = new Schema({
  Esn: {
    type: String,
    required: true,
    unique: true,
    minlength: 8,   // Minimum length of 8 characters
    maxlength: 25,  // Maximum length of 25 characters
    match: /^\d+$/  // Regular expression to match only digits
  },
  serviceProvider: {
    type: mongoose.Types.ObjectId,
    ref: "ServiceProvider",
  },
  carrier: {
    type: mongoose.Types.ObjectId,
    ref: "Carrier",
  },
  pin: {
    type: Number,
  },
  puk: {
    type: String,
  },
  puk2: {
    type: String,
  },
  box: {
    type: String,
  },
  po: {
    type: String,
  },
  status: {
    type: String,
    enum: ["available", "in_use", "deactivated"],
    default: "available",
  },
  UICCID:{
    type: String,
    unique: true,
    minlength: 19,   // Minimum length of 19 characters
    maxlength: 20,  // Maximum length of 20 characters
    match: /^\d+$/
  },
  AgentName: { type: mongoose.Types.ObjectId, ref: "User" },
  team:{type:String},
  provisionType: { type: String },
  AgentType: { type: mongoose.Types.ObjectId, ref: "Department" },
  master: { type: String },
  Model: { type: String },
  IMEI: { type: String },
  Wholesale: { type: String },
  Selling: { type: String },
  Activation_Fee: { type: String },
  Mdn: { type: String },
  zip: { type: String },
  address1: { type: String },
  address2: { type: String },
  city: { type: String },
  state: { type: String },
  MSID: { type: String },
  trackingNumber: { type: String },
  planId: { type: mongoose.Types.ObjectId, ref: "Plan" },
  tinNumber: { type: String },
  Msdn: { type: mongoose.Types.ObjectId, ref: "" },
  Status_id: { type: mongoose.Types.ObjectId, ref: "" },
  Company_id: {},
  unitType: { type: String },
  portinReservedstatus: { type: Boolean, default: false },
  BYOD: { type: Boolean, default: false },
  CreatedAt: { type: Date, default: Date.now },
  Uploaded_by: { type: mongoose.Types.ObjectId, ref: "User" },
  creditAmount: { type: String },
  ACP_Co_Pay_Amount: { type: String },
  ACP_Device_Reimbursement_Amount: { type: String },
  Selling_Retail_Price_for_Device:{ type: String },
  deletedAt: { type: Date },
  deleted_by: { type: mongoose.Types.ObjectId, ref: "User" },
  make:{type: String},
  Sim_History: [
    { Company_id: {} },
    { Assigned_by: { type: mongoose.Types.ObjectId, ref: "User" } },
    { Assigned_to: { type: mongoose.Types.ObjectId, ref: "User" } },
    { Enrollment_id: { type: mongoose.Types.ObjectId, ref: "Customer" } },
    { Assigned_at: { type: Date, default: Date.now() } },
    { Plan_id: { type: mongoose.Types.ObjectId, ref: "Plan" } },
  ],
  deleted: {
    type: Boolean,
    default: false,
  },
});
const model = new mongoose.model("EsnNumber", EsnSchema);
module.exports = model;
