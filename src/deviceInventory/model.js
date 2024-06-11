// models/device.js
const { string } = require("joi");
const mongoose = require("mongoose");
const deviceSchema = new mongoose.Schema({
  serviceProvider:{
    type:mongoose.Types.ObjectId,
    ref:"ServiceProvider"
  },
  carrier:{
    type:mongoose.Types.ObjectId,
    ref:"Carrier"
  },
  name: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  mdn: {
    type: String,
    required: true,
    unique:true
  },
  srn: {
    type: String,
    required: true,
    unique:true
  },
  isNetworkRouter: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['available', 'in_use', 'deactivated'],
    default: 'available',
  },
  // Add more fields as needed
});

module.exports = mongoose.model("Device", deviceSchema);
