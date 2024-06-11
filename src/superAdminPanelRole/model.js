const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    permissions: [String],
    role: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    active:{
      type:Boolean,
      default:true
    }
  },
  { timestamps: true }
);

const model = new mongoose.model("SuperAdminPanelRole", schema);
module.exports = model;
