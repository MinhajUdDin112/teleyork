const model = require("./SMSModel");
const mongoose = require("mongoose");
const templateModel = require("./templateModel");
const service = {
  getDraftAll: async (templateId) => {
    console.log("templateId: ", templateId);
    const result = await model
      .find({ templateId: templateId, status: "Draft" })
      .populate({ path: "sentBy" })
      .populate({ path: "uploadedBy" });
    return result;
  },
  getSentAll: async (templateId, company) => {
    console.log("templateId: ", templateId);
    const result = await model
      .find({ company: company, templateId: templateId, status: "Sent" })
      .populate({ path: "sentBy" })
      .populate({ path: "uploadedBy" });
    return result;
  },
  addTemplate: async (
    company,
    createdBy,
    name,
    templateId,
    template,
    keySequence,
    type,
    notification_subject
  ) => {
    const data = new templateModel({
      company,
      createdBy,
      name,
      templateId,
      template,
      keySequence,
      type,
      notification_subject,
    });
    const result = await data.save();
    return result;
  },
  updateTemplate: async (
    templateId,
    notification_subject,
    template,
    type,
    keySequence
  ) => {
    const data = await templateModel.findOneAndUpdate(
      { _id: templateId },
      { notification_subject, template, keySequence, type },
      { new: true }
    );
    const result = await data.save();
    return result;
  },
  getDraftAllTemplate: async (companyId) => {
    const result = await templateModel.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          status: "Draft",
          deleted: false,
        },
      },
      {
        $lookup: {
          from: "sms",
          localField: "templateId",
          foreignField: "templateId",
          as: "sms",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          createdByUser: { $arrayElemAt: ["$user.name", 0] },
          sentSMSCount: {
            $sum: {
              $cond: [
                {
                  $in: ["Sent", "$sms.status"],
                },
                1,
                0,
              ],
            },
          },
          draftSMSCount: {
            $sum: {
              $cond: [
                {
                  $in: ["Draft", "$sms.status"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          sms: 0,
          user: 0,
        },
      },
      {
        $sort: {
          createdAt: -1, // Sort in descending order based on the 'createdAt' field
        },
      },
    ]);
    //.find({ status: "Draft", active: true });
    return result;
  },
  getTemplateAll: async (companyId) => {
    const result = await templateModel.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          deleted: false,
        },
      },
      {
        $lookup: {
          from: "sms",
          localField: "templateId",
          foreignField: "templateId",
          as: "sms",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          createdByUser: { $arrayElemAt: ["$user.name", 0] },
          sentSMSCount: {
            $sum: {
              $cond: [
                {
                  $in: ["Sent", "$sms.status"],
                },
                1,
                0,
              ],
            },
          },
          draftSMSCount: {
            $sum: {
              $cond: [
                {
                  $in: ["Draft", "$sms.status"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          sms: 0,
          user: 0,
        },
      },
      {
        $sort: {
          createdAt: -1, // Sort in descending order based on the 'createdAt' field
        },
      },
    ]);
    //.find({ status: "Draft", active: true });
    return result;
  },
  getSentAllTemplate: async (companyId) => {
    const result = await templateModel.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          status: "Sent",
          deleted: false,
        },
      },
      {
        $lookup: {
          from: "sms",
          localField: "templateId",
          foreignField: "templateId",
          as: "sms",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          createdByUser: { $arrayElemAt: ["$user.name", 0] },
          sentSMSCount: {
            $sum: {
              $cond: [
                {
                  $in: ["Sent", "$sms.status"],
                },
                1,
                0,
              ],
            },
          },
          draftSMSCount: {
            $sum: {
              $cond: [
                {
                  $in: ["Draft", "$sms.status"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          sms: 0,
          user: 0,
        },
      },
      {
        $sort: {
          createdAt: -1, // Sort in descending order based on the 'createdAt' field
        },
      },
    ]);
    //.find({ status: "Sent", active: true });
    return result;
  },
  getOne: async (templateId) => {
    const result = await templateModel.findOne({ templateId: templateId });
    return result;
  },
  getAllTemplate: async (company) => {
    const result = await templateModel.find({
      company: company,
      deleted: { $ne: true },
    });
    return result;
  },
  delete: async (_id) => {
    const result = await templateModel.findOneAndUpdate(
      { _id },
      { deleted: true },
      { new: true }
    );
    return result;
  },
};

module.exports = service;
