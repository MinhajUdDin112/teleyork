const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      lowercase: true,
    },
    route: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: "",
    },
    orderPosition: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const moduleModel = mongoose.model("Module", schema);
module.exports = moduleModel;
