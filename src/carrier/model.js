const mongoose=require("mongoose")
const Schema=mongoose.Schema
const carrierSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "SuperAdminUser" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "SuperAdminUser" },
    active: {
      type: Boolean,
      default: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const model = mongoose.model("Carrier", carrierSchema);
module.exports=model