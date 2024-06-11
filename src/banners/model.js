const mongoose = require("mongoose");
const imageSchema = new mongoose.Schema({
  path: String,
  isActive: {
    type: Boolean,
    default: true,
  },
});

const Image = mongoose.model("Image", imageSchema);
module.exports = Image;
