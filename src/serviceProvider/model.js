const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");
const ServiceProviderSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    alias: { type: String },
    type: { type: String, default: "local" },
    url: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String },
    address2: { type: String },
    apt_suit: { type: String },
    EIN: { type: String, required: true },
    logo: { type: String },
    subDomain: { type: String, required: true, unique: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "SuperAdminUser" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "SuperAdminUser" },
    carriers: [
      {
        carrier: {
          type: Schema.Types.ObjectId,
          ref: "Carrier",
        },
        Mno: {
          type: Schema.Types.ObjectId,
          ref: "MiddlewareCompany",
        },
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },

    gateway: {
      type: String,
      enum: ["stripe", "authorize", "paypal"],
      required: true,
    },
    environment: { type: String, enum: ["test", "production"], required: true },
    keys: {
      loginKey: { type: String },
      transactionKey: { type: String },
      publishKey: { type: String },
      secretKey: { type: String },
      // Add more fields as needed for other payment gateways
    },
    apiURL: { type: String, required: true },
  },
  { timestamps: true }
);
ServiceProviderSchema.set("toJSON", {
  transform: function (doc, ret) {
    if (ret.createdAt) {
      ret.createdAt = DateTime.fromJSDate(ret.createdAt)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }

    if (ret.updatedAt) {
      ret.updatedAt = DateTime.fromJSDate(ret.updatedAt)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }
    if (ret.approvedAt) {
      ret.approvedAt = DateTime.fromJSDate(ret.approvedAt)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }
    if (ret.rejectedAt) {
      ret.rejectedAt = DateTime.fromJSDate(ret.rejectedAt)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }
    if (ret.activatedAt) {
      ret.activatedAt = DateTime.fromJSDate(ret.activatedAt)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }
    if (ret.nladEnrollmentDate) {
      ret.nladEnrollmentDate = DateTime.fromJSDate(ret.nladEnrollmentDate)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }

    return ret;
  },
});

const model = new mongoose.model("ServiceProvider", ServiceProviderSchema);
module.exports = model;
