const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Company schema
const gradeSchema = new Schema({
  grade: {
    type: String,
    required: true,
    unique: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});
const model = new mongoose.model("grade", gradeSchema);
module.exports = model;
