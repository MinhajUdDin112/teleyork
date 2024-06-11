const mongoose = require("mongoose");
const Makeschema = new mongoose.Schema({
  company: {
    type: mongoose.Types.ObjectId,
    ref: "ServiceProvider",
  }, 
  make: {
    type: String,
    },
  device:{
    type:String
  }
},
{ timestamps: true });


const model = new mongoose.model("Make", Makeschema);
module.exports = model;