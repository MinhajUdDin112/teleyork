const mongoose = require("mongoose");
const { DateTime } = require("luxon");
//const { isValidPassword } = require("mongoose-custom-validators");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    //super admin user panel
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    code: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      required: true,
      //   validate: {
      //     validator: isValidPassword,
      //     message:
      //       "Password must have at least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
      //   },
    },
    contact: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    cnic: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: Number,
      default: null,
    },
    otpExpire: {
      type: Date,
    },
    token: {
      type: String,
      default: null,
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
schema.set("toJSON", {
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

const model = new mongoose.model("SuperAdminUser", schema);
module.exports = model;
