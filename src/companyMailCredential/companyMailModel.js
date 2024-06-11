const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const MailSchema = new Schema(
  {
    serviceProvider: {
      type: Schema.Types.ObjectId,
      ref: "serviceProvider",
    },
    smtp: {
      type: String,
      required: true,
      unique: true,
    },
    port: {
      type: Number,
      required: true,
      unique: true,
    },
    userName: {
      type: String,
      required: true,
    },
    mail_Encryption: {
      type: String,
      required: true,
    },
    host: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const model = new mongoose.model("Mailer", MailSchema);
module.exports = model;
