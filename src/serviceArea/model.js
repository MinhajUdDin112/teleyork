 const mongoose = require("mongoose");
// const ServiceAreaSchema = new mongoose.Schema({
//   carrier:{
//     type:mongoose.Types.ObjectId,
//     required:true,
//   },
//   state: {
//     type: String,
//     required: true,
//   },
//   abbreviation: {
//     type: String,
//     required: true,
//   },
//   zipCode: {
//     type: Number,
//     required: true,
//   },
//   population: {
//     type: Number,
//     required: true,
//   },
//   city: {
//     type: String,
//     required: true,
//   },
//   country: {
//     type: String,
//     required: true,
//   },
//   ssc: {
//     type: String,
//     default: null,
//   },
//   active: {
//     type: Boolean,
//   },
// });
// const model = mongoose.model("ServiceArea", ServiceAreaSchema);
// module.exports = model;
const ServiceAreaSchema = new mongoose.Schema({
  carrier: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  createdBy: { type: mongoose.Types.ObjectId, ref: "SuperAdminUser" },
  updatedBy: { type: mongoose.Types.ObjectId, ref: "SuperAdminUser" },
  // areas: [
  //   {
  state: {
    type: String,
    required: true,
  },
  abbreviation: {
    type: String,
    required: true,
  },
  zipCode: {
    type: Number,
    required: true,
  },
  population: {
    type: Number,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  ssc: {
    type: String,
    default: null,
  },
  active: {
    type: Boolean,
    default: false,
  },
  //   }
  // ]
});
 const model = mongoose.model("ServiceArea", ServiceAreaSchema);
 module.exports = model;
