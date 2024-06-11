// Notification Schema
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Sender ka ID
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Receiver ka ID
  message: String,
  read: { type: Boolean, default: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  timestamp: { type: Date, default: Date.now },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
  price: {
    type: String,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: { type: String, enum: ["Pending", "Resolved"], default: "Pending" },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "notes",
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
