const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ServiceProviderSchema = new Schema(
  {
    mno: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "MiddlewareCompany",
      unique: true,
    },
    carriers: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Carrier",
      },
    ],
    serviceProvider: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ServiceProvider",
    },
    superAdminUser: {
      type: Schema.Types.ObjectId,
      ref: "SuperAdminUser",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "SuperAdminUser" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "SuperAdminUser" },
  },
  { timestamps: true }
);
const model = new mongoose.model("AssignedCarrier", ServiceProviderSchema);
module.exports = model;
