const mongoose = require("mongoose");
const { isValidPassword } = require("mongoose-custom-validators");
const { DateTime } = require("luxon");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    company: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
    },
    companyName: {
      type: String,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
    },
    code: {
      type: String,
    },
    name: {
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
      validate: {
        validator: isValidPassword,
        message:
          "Password must have at least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
      },
    },
    // agentType: {
    //   type: String,
    //   enum: ["manager", "retailer", "distributer", "employee"],
    // },
    // master: {
    //   type: mongoose.Types.ObjectId,
    //   ref: "User",
    // },
    // distributer: {
    //   type: mongoose.Types.ObjectId,
    //   ref: "User",
    // },
    // retailer: {
    //   type: mongoose.Types.ObjectId,
    //   ref: "User",
    // },
    RADId: {
      type: Number,
      default: null,
    },
    contact: {
      type: String,
    },
    city: {
      type: String,
    },
    address: {
      type: String,
    },
    zip: {
      type: String,
    },
    state: {
      type: String,
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
    refreshToken: {
      type: String,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdDate: {
      type: Date,
      default: Date.now(),
    },
    disabledDate: {
      type: Date,
      default: Date.now(),
    },
    isLogin: {
      type: Boolean,
      default: false,
    },
    reportingTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    repId: {
      type: String,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    code: {
      type: String,
    },
    isOnLeave: {
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
const adminUserModel = new mongoose.model("User", schema);
module.exports = adminUserModel;
