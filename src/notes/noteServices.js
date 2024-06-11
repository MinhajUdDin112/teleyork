const model = require("./noteModel");
const mongoose = require("mongoose");

const service = {
  addNote: async (
    serviceProvider,
    user,
    customerId,
    noteType,
    note,
    priority
  ) => {
    const notetype = new model({
      serviceProvider,
      user,
      customerId,
      noteType,
      note,
      priority,
    });

    const result = await notetype.save();
    console.log(result);
    return result;
  },
  getAll: async () => {
    const users = await model
      .find({ deleted: false })
      .populate({
        path: "user",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "assignTo",
        select: { _id: 1, name: 1 },
      });
    return users;
  },
  getByUserID: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model
      .findById(_id)
      .populate({
        path: "user",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "assignTo",
        select: { _id: 1, name: 1 },
      });
    return result;
  },
  getbyCustomer: async (customerId) => {
    const result = await model
      .find({ customerId })
      .populate({
        path: "user",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "assignTo",
        select: { _id: 1, name: 1 },
      });
    return result;
  },
  update: async (
    _id,
    serviceProvider,
    customerId,
    noteType,
    note,
    priority
  ) => {
    const result = await model.findOneAndUpdate(
      { _id, serviceProvider },
      {
        customerId,
        noteType,
        note,
        priority,
      },
      { new: true }
    );
    return result;
  },
  statusUpdate: async (_id, priority) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        priority,
      },
      { new: true }
    );
    return result;
  },
  markVoid: async (_id, markVoid) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        void: markVoid,
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
