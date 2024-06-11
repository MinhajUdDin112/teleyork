const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");
const planSchema = new Schema({
  createdBy: { type: Schema.Types.ObjectId, ref: "SuperAdminUser" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "SuperAdminUser" },
  serviceProvider: {
    type: Schema.Types.ObjectId,
    ref: "ServiceProvider",
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  inventoryType: {
    type: String,
  },
  type: {
    type: String,
    required: true,
  },
  dataAllowance: {
    type: Number,
    required: true,
  },
  dataAllowanceUnit: {
    type: String,
    enum: ["MB", "GB", "TB"],
    default: "GB",
  },
  voiceAllowance: {
    type: Number,
    required: true,
  },
  voiceAllowanceUnit: {
    type: String,
    enum: ["minutes", "hours"],
    default: "minutes",
  },
  textAllowance: {
    type: Number,
    required: true,
  },
  textAllowanceUnit: {
    type: String,
    enum: ["SMS"],
    default: "SMS",
  },
  duration: {
    type: Number,
    required: true,
  },
  durationUnit: {
    type: String,
    enum: ["days", "hours", "month", "year"],
    default: "days",
  },
  price: {
    type: Number,
    required: true,
  },
  additionalFeatures: [
    {
      type: String,
    },
  ],
  termsAndConditions: {
    type: String,
  },
  restrictions: [
    {
      type: String,
    },
  ],
  active: {
    type: Boolean,
    default: true,
  },
  planId: {
    type: String,
    // unique: true,
  },
});
planSchema.set("toJSON", {
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

const model = mongoose.model("Plan", planSchema);

module.exports = model;
