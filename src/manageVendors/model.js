const mongoose = require("mongoose");
const vendorSchema = mongoose.Schema(
  {
    // serverProvider: {
    //   type: Schema.Types.ObjectId,
    //   ref: "serverProvider",
    // },
    companyName: {
      type: String,
    },
    address1: {
      type: String,
    },
    address2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    companyEmail: {
      type: String,
    },
    pointOfContact: {
      type: String,
    },
    pointOfContactPhoneNo: {
      type: String,
    },
    pointOfContactEmail: {
      type: String,
    },
    NTN_EIN_Number: {
      type: String,
    },
    contractSignDate: {
      type: String,
    },
    contractExpirationDate: {
      type: String,
    },
    modeOfWork: {
      type: String,
    },
    attachmentLink: {
      type: String,
    },
    status: {
      type: String,
    },
  },
  { timestamps: true }
);

const vendorsModel = mongoose.model("manageVendor", vendorSchema);
module.exports = vendorsModel;
