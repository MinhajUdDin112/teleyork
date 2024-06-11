const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    name: {
      type: String,
      enum: ["view", "create", "manage"],
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const permissionModel = new mongoose.model("Permission", schema);
module.exports = permissionModel;
