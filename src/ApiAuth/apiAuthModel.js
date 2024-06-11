const mongoose = require("mongoose");
const { isValidPassword } = require("mongoose-custom-validators");
const { DateTime } = require("luxon");
const Schema = mongoose.Schema;
const authSchema = new Schema(
  {
    username: {
      type: String,
    },
    password: {
      type: String,
    },
  },
  { timestamps: true }
);
authSchema.set("toJSON", {
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
const authModel = new mongoose.model("Auth", authSchema);
module.exports = authModel;
