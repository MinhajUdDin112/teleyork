const model = require("./noteModel");
const mongoose = require("mongoose");

const service = {
  addNote: async (serviceProvider, noteType, note, status) => {
    const notetype = new model({serviceProvider, noteType, note, status});

    const result = await notetype.save();
    return result;
  },
  async findNoteByServiceProviderAndNoteType(serviceProvider, noteType) {
    // Query the database to find a note by serviceProvider and noteType
    try {
      const existingNote = await model.findOne({ serviceProvider, noteType });
      return existingNote;
    } catch (error) {
      // Handle any errors, such as database connection issues
      console.error("Error finding note:", error);
      throw new Error("Failed to find note");
    }
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
  update: async (_id,serviceProvider, noteType, note,) => {
    const result = await model.findOneAndUpdate(
      { _id,serviceProvider },
      {
         noteType, note,
      },
      { new: true }
    );
    return result;
  },
  statusUpdate: async (_id,status) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        status
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
