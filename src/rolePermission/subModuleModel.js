const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    module: {
      type: Schema.Types.ObjectId,
      ref: "Module",
    },
    actions:[{
      type:mongoose.Types.ObjectId,
      ref:"Permission"
    }],
    name: {
      type: String,
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

const moduleModel = mongoose.model("SubModule", schema);
module.exports = moduleModel;
