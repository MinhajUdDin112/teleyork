const mongoose = require("mongoose");
const { DateTime } = require('luxon');
const Schema = mongoose.Schema;
// Define the Company schema
const searchSchema = new Schema({
    userId:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    serviceProvider:{
        type: Schema.Types.ObjectId,
        ref: "ServiceProvider"
    },
   customerId:{
    type: Schema.Types.ObjectId,
        ref: "Customer"
   }
},{ timestamps: true });
searchSchema.set('toJSON', {
    transform: function (doc, ret) {
        if (ret.createdAt) {
          ret.createdAt = DateTime.fromJSDate(ret.createdAt).setZone('America/New_York').toFormat('dd LLL yyyy, h:mm a');
        }
    
        if (ret.updatedAt) {
          ret.updatedAt = DateTime.fromJSDate(ret.updatedAt).setZone('America/New_York').toFormat('dd LLL yyyy, h:mm a');
        }
        if (ret.approvedAt) {
          ret.approvedAt = DateTime.fromJSDate(ret.approvedAt).setZone('America/New_York').toFormat('dd LLL yyyy, h:mm a');
        }
        if (ret.rejectedAt) {
          ret.rejectedAt = DateTime.fromJSDate(ret.rejectedAt).setZone('America/New_York').toFormat('dd LLL yyyy, h:mm a');
        }
        if (ret.activatedAt) {
          ret.activatedAt = DateTime.fromJSDate(ret.activatedAt).setZone('America/New_York').toFormat('dd LLL yyyy, h:mm a');
        }
        if (ret.nladEnrollmentDate) {
          ret.nladEnrollmentDate = DateTime.fromJSDate(ret.nladEnrollmentDate).setZone('America/New_York').toFormat('dd LLL yyyy, h:mm a');
        }
    
        return ret;
      }
  });
const model = new mongoose.model("Search", searchSchema);
module.exports = model;
