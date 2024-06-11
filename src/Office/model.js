const mongoose = require("mongoose");
const { isValidPassword } = require("mongoose-custom-validators");
const Schema = mongoose.Schema;
const teamSchema = new Schema({
    company:{
        type: Schema.Types.ObjectId,
        ref: "ServiceProvider"
    },
    team:{
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

const model = new mongoose.model("Team", teamSchema);
module.exports = model;