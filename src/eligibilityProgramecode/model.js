const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eligibilityProgramecode= new Schema({

eligibilityProgramecode:{type: String,required: true},
description:{type: String,required: true}

})

const eligibilityPrograme =mongoose.model("eligibilityPrograme",eligibilityProgramecode)
module.exports= eligibilityPrograme;
