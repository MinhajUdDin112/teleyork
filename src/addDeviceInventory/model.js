// models/device.js

const mongoose = require("mongoose");
const addDeviceSchema = new mongoose.Schema({
  company: {
    type: mongoose.Types.ObjectId,
    ref: "ServiceProvider",
  },
  networkType: {
    type: String,
    required: true,
  },
  simType: {
    type: String,
    required: true,
  },
  price: {
    type: String,
  },
  operatingSystem: {
    type: String,
    required: true,
  },
  dataCapable: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  deviceType: {
    type: String,
    required: true,
  },
  imeiType: {
    type: String,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
  },
  make: {
    type: mongoose.Types.ObjectId,
    ref: "Make",
  },
  // Add more fields as needed
});

module.exports = mongoose.model("addDeviceInventory", addDeviceSchema);
