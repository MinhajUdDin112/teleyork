const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    serviceProvider:{
      type:Schema.Types.ObjectId,
      ref:"ServiceProvider"
    },
    permissions: [{
      subModule:{
        type: Schema.Types.ObjectId,
        ref: "SubModule",
        required: true,
      },
      actions:[{
        type:mongoose.Types.ObjectId,
        ref:"Permission"
      }]
    }
    ],
    role: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    isSuperPanelRole:{
      type:Boolean,
      default:false
    },
    active:{
      type:Boolean,
      default:true
    },
    deleted:{
      type:Boolean,
      
    }
  },
  { timestamps: true }
);

const roleModel = new mongoose.model("Role", schema);
module.exports = roleModel;
