const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    serviceProvider:{type: Schema.Types.ObjectId, ref: "ServiceProvider"},
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, unique: true, upperCase: true },
    code:{type:String,unique: true,required:true},
    description: { type: String },
    banner: { type: String },
    active: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const acpProgramModel = new mongoose.model("ACPPrograms", schema);
module.exports = acpProgramModel;
