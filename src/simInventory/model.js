// sim.js
const mongoose = require("mongoose");
// Define the SIM schema
const simSchema = new mongoose.Schema({
  serviceProvider: {
    type: mongoose.Types.ObjectId,
    ref: "ServiceProvider",
  },
  carrier: {
    type: mongoose.Types.ObjectId,
    ref: "Carrier",
  },
  SimNumber: {
    type: String,
    validate: {
      validator: function (v) {
        // Regular expression to match exactly 19 digits
        return /^\d{19}$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid SIM number. It must be a 19-digit number.`,
    },
    required: [true, "SIM number is required"],
  },
  esn: {
    type: String,
    default: null,
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
    default: "available",
  },
  AgentName: { type: mongoose.Types.ObjectId, ref: "User" },
  team: { type: String },
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
  make: { type: String },
  unitType: { type: String },
  portinReservedstatus: { type: Boolean, default: false },
  CreatedAt: { type: Date, default: Date.now },
  Uploaded_by: { type: mongoose.Types.ObjectId, ref: "User" },
  creditAmount: { type: String },
  ACP_Co_Pay_Amount: { type: String },
  ACP_Device_Reimbursement_Amount: { type: String },
  Selling_Retail_Price_for_Device: { type: String },
  billingModel: { type: String },
  deletedAt: { type: Date },
  deleted_by: { type: mongoose.Types.ObjectId, ref: "User" },
  Sim_History: [
    {
      Company_id: { type: mongoose.Types.ObjectId, ref: "serviceProvider" },
      Assigned_by: { type: mongoose.Types.ObjectId, ref: "User" },
      Assigned_to: { type: mongoose.Types.ObjectId, ref: "User" },
      Enrollment_id: { type: String },
      Assigned_at: { type: Date },
      Plan_id: { type: mongoose.Types.ObjectId, ref: "Plan" },
    },
  ],
});

// Create the SIM model
const model = mongoose.model("Sim", simSchema);
module.exports = model;
