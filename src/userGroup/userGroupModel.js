const mongoose = require("mongoose");

const userGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});
const UserGroupModel = mongoose.model("UserGroup", userGroupSchema);
module.exports = UserGroupModel;
