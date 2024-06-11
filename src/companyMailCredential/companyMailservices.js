const model = require("./companyMailModel");
const mongoose = require("mongoose");
const projection = require("../config/mongoProjection");
const bcrypt = require("bcrypt");
const jwtService = require("../utils/jwtServices");
const { v4: uuidv4 } = require("uuid");
const authIdServices = require("../auth/authIdServices");
const expressAsyncHandler = require("express-async-handler");

const service = {
  addNew: async (
    serviceProvider,
    smtp,
    port,
    userName,
    mail_Encryption,
    host,
    email,
    password
  ) => {
    const user = new model({
      serviceProvider: new mongoose.Types.ObjectId(serviceProvider),
      smtp,
      port,
      userName,
      mail_Encryption,
      host,
      email,
      password,
    });

    const result = await user.save();
    return result;
  },
  getAll: async () => {
    const users = await model.find({ deleted: false });
    return users;
  },
  getByUserID: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model.findById(_id);
    // .populate({
    //   path: "superAdminUser",
    //   select: { name: 1, email: 1, contact: 1 },
    // });
    return result;
  },
  update: async (
    _id,
    serviceProvider,
    smtp,
    port,
    userName,
    mail_Encryption,
    host,
    email,
    password
  ) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        serviceProvider: new mongoose.Types.ObjectId(serviceProvider),
        smtp,
        port,
        userName,
        mail_Encryption,
        host,
        email,
        password,
      },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model.findOneAndUpdate(
      { _id },
      { deleted: true },
      { new: true }
    );
    return result;
  },
};

module.exports = service;
