const mongoose = require("mongoose");
const { isValidPassword } = require("mongoose-custom-validators");
const Schema = mongoose.Schema;
const departmentSchema = new Schema({
    company:{
        type: Schema.Types.ObjectId,
        ref: "ServiceProvider"
    },
    department:{
        type:String,
        trim: true,
    },
    status:{
        type:Boolean,
        default:false
    },
    deleted:{
        type:Boolean,
        default:false
    },
},{ timestamps: true })

const model = new mongoose.model("Department", departmentSchema);
module.exports = model;