const model = require("./model");
const mongoose = require("mongoose");
const projection = require("../config/mongoProjection");
const service = {
  get: async () => {
    const result = await model
      .find({}, projection.projection)
      .populate({
        path: "carriers",
        select: { name: 1 },
      })
      .populate({
        path: "superAdminUser",
        select: { name: 1, email: 1, contact: 1 },
      })
      .populate({
        path: "serviceProvider",
        select: { name: 1, phone: 1, cnic: 1, url: 1, email: 1, address: 1 },
      });
    return result;
  },
  isAssigned: async (carriers) => {
    const result = await model.findOne({ carriers: { $in: carriers } });
    return result;
  },
  getByID: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model
      .findById({ _id }, projection.projection)
      .populate({
        path: "carriers",
        select: { name: 1 },
      })
      .populate({
        path: "superAdminUser",
        
        select: { name: 1, email: 1, contact: 1 },
      })
      .populate({
        path: "serviceProvider",
        select: { name: 1, phone: 1, cnic: 1, url: 1, email: 1, address: 1 },
      });
    return result;
  },
  getByCarrier: async (carrier) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model
      .find({ carriers: { $in: carrier } }, projection.projection)
      .populate({
        path: "carriers",
        select: { name: 1 },
      })
      .populate({
        path: "superAdminUser",
        select: { name: 1, email: 1, contact: 1 },
      })
      .populate({
        path: "serviceProvider",
        select: { name: 1, phone: 1, cnic: 1, url: 1, email: 1, address: 1 },
      });
    return result;
  },
  getBySP: async (serviceProvider) => {
    const result = await model
      .find({ serviceProvider: serviceProvider }, projection.projection)
      .populate({
        path: "carriers",
        select: { name: 1 },
      })
      .populate({
        path: "mno",
        select: { name: 1, alias: 1, type: 1 },
      })
      .populate({
        path: "superAdminUser",
        select: { name: 1, email: 1, contact: 1 },
      })
      .populate({
        path: "serviceProvider",
        select: { name: 1, phone: 1, cnic: 1, url: 1, email: 1, address: 1 },
      });
    return result;
  },
  getByMNO: async (mno) => {
    const result = await model
      .find({ mno: mno }, projection.projection)
      .populate({
        path: "carriers",
        select: { name: 1 },
      })
      .populate({
        path: "mno",
        select: { name: 1, alias: 1, type: 1 },
      })
      .populate({
        path: "superAdminUser",
        select: { name: 1, email: 1, contact: 1 },
      })
      .populate({
        path: "serviceProvider",
        select: { name: 1, phone: 1, cnic: 1, url: 1, email: 1, address: 1 },
      });
    return result;
  },
  addNew: async (mno, carriers, serviceProvider, createdBy) => {
    const user = new model({
      mno,
      carriers,
      serviceProvider: new mongoose.Types.ObjectId(serviceProvider),
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });
    const result = await user.save();
    return result;
  },
  addNewCarrier: async (_id, mno, carrier, serviceProvider, createdBy) => {
    const result = await model.findOneAndUpdate(
      { _id, serviceProvider: serviceProvider, mno: mno },
      { $push: { carriers: carrier }, createdBy },
      { new: true }
    );
    return result;
  },
  removeCarrier: async (_id, mno, carrier, serviceProvider, updatedBy) => {
    const result = await model.findOneAndUpdate(
      { _id, serviceProvider: serviceProvider, mno: mno },
      { $pull: { carriers: carrier }, updatedBy },
      { new: true }
    );
    return result;
  },
  update: async (
    _id,
    name,
    url,
    email,
    phone,
    address,
    cnic,
    updatedBy
  ) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        name,
        url,
        email,
        phone,
        address,
        cnic,
        updatedBy: new mongoose.Types.ObjectId(updatedBy),
      },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    var _id = new mongoose.Types.ObjectId(_id);
    const result = await model.deleteOne({ _id });
    return result;
  },
};

module.exports = service;
