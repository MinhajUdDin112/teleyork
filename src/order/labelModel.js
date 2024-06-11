const mongoose = require("mongoose");

const labelSchema = new mongoose.Schema(
  {
    serviceProvider: {
      type: mongoose.Types.ObjectId,
      ref: "ServiceProvider",
    },
    customer: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
    },
    carrier: {
      type: mongoose.Types.ObjectId,
      ref: "Carrier",
      default: null,
    },
    orderId: { type: Number },
    carrierCode: { type: String },
    serviceCode: { type: String },
    packageCode: { type: String },
    confirmation: { type: String },
    shipDate: { type: Date },
    weight: {
      value: { type: Number },
      units: { type: String },
      WeightUnits: { type: Number },
    },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      units: { type: String },
    },
    insuranceOptions: {},
    internationalOptions: {},
    testLabel: {
      type: Boolean,
    },
    shipmentId: { type: String },
    userId: { type: String },
    trackingNumber: { type: String },
    batchNumber: { type: String },
    carrierCode: { type: String },
    serviceCode: { type: String },
    packageCode: { type: String },
    voided: { type: Boolean },
    voidDate: { type: String },
    labelData: { type: String },
    formData: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Label", labelSchema);
