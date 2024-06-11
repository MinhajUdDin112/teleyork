const mongoose = require("mongoose");
const { isValidPassword } = require("mongoose-custom-validators");
const { PROSPECTED } = require("../utils/userStatus");
const Schema = mongoose.Schema;

const roleHeirarchySchema = new Schema({
  role: {
    type: String,
  },
  level: {
    type: Number,
    unique: true,
  },
});

const model = new mongoose.model("roleHeirarchy", roleHeirarchySchema);
module.exports = model;
