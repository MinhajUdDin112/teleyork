const customerService = require("../user/service");
const mongoose = require("mongoose");
const custModel = require("../user/model");
const searchModel = require("./searchModel");
const simInventory = require("../simInventory/model");
const adminService = require("../adminUser/adminUserServices");

const service = {
  getsearchData: async (User, query) => {
    const userRole = User.role.role; //get user role
    let userId = User._id;
    const [firstName, lastName] = query
      .split(/\s+/)
      .map((name) => name.toUpperCase());
    if (userRole.toUpperCase() === "CSR") {
      const upperenrollment = query.toUpperCase();
      const phoneNumberQuery = isNaN(upperenrollment)
        ? {}
        : { phoneNumber: parseInt(upperenrollment, 10) };
      console.log(upperenrollment, userId);
      customerResults = await custModel
        .find({
          $or: [{ createdBy: userId }, { isUploaded: true }],
          $or: [
            { enrollmentId: upperenrollment },
            { contact: upperenrollment },
            { accountId: upperenrollment },
            {
              $and: [
                { firstName: { $regex: new RegExp(firstName, "i") } },
                { lastName: { $regex: new RegExp(lastName, "i") } },
              ],
            },
            {
              $or: [
                { firstName: { $regex: new RegExp(query, "i") } },
                { lastName: { $regex: new RegExp(query, "i") } },
              ],
            },
            { esn: upperenrollment },
            //phoneNumberQuery
          ],
        })
        .populate("plan")
        .populate({
          path: "acpProgram",
          select: { _id: 1, name: 1, code: 1 },
        })
        .populate({
          path: "carrier",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        })
        .populate({
          path: "approval.approvedBy",
          select: { _id: 1, name: 1 },
        });
      return customerResults;
    } else if (userRole.toUpperCase() === "TEAM LEAD") {
      const upperenrollment = query.toUpperCase();
      const phoneNumberQuery = !isNaN(upperenrollment)
        ? { phoneNumber: upperenrollment }
        : {};
      const csrUsers = await adminService.getUserReportingTo(userId);
      if (csrUsers.length === 0) {
        return res.status(201).send({
          msg: "enrolments not found as no csr is reporting to this teamlead",
        });
      }
      const userObjectId = new mongoose.Types.ObjectId(User._id);
      const csrIds = csrUsers.map((csr) => csr._id);
      console.log(csrIds);
      customerResults = await custModel
        .find({
          //createdBy: { $in: csrIds.concat(User._id) },
          $or: [
            { createdBy: { $in: csrIds.concat(User._id) } },
            { isUploaded: true },
          ],
          $or: [
            { enrollmentId: upperenrollment },
            { contact: upperenrollment },
            { accountId: upperenrollment },
            {
              $and: [
                { firstName: { $regex: new RegExp(firstName, "i") } },
                { lastName: { $regex: new RegExp(lastName, "i") } },
              ],
            },
            {
              $or: [
                { firstName: { $regex: new RegExp(query, "i") } },
                { lastName: { $regex: new RegExp(query, "i") } },
              ],
            },
            { esn: upperenrollment },
            //{phoneNumber:upperenrollment}
          ],
        })
        .populate("plan")
        .populate({
          path: "acpProgram",
          select: { _id: 1, name: 1, code: 1 },
        })
        .populate({
          path: "carrier",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        })
        .populate({
          path: "approval.approvedBy",
          select: { _id: 1, name: 1 },
        });
      return customerResults;
    } else if (userRole.toUpperCase() === "QA AGENT") {
      const upperenrollment = query.toUpperCase();
      const phoneNumberQuery = !isNaN(upperenrollment)
        ? { phoneNumber: upperenrollment }
        : {};

      customerResults = await custModel
        .find({
          //assignToQa: userId,
          $and: [
            {
              $or: [
                { assignToQa: userId },
                { "approval.approvedBy": userId },
                { isUploaded: true },
              ],
            },
            {
              $or: [
                { enrollmentId: upperenrollment },
                { contact: upperenrollment },
                { accountId: upperenrollment },
                {
                  $and: [
                    { firstName: { $regex: new RegExp(firstName, "i") } },
                    { lastName: { $regex: new RegExp(lastName, "i") } },
                  ],
                },
                {
                  $or: [
                    { firstName: { $regex: new RegExp(query, "i") } },
                    { lastName: { $regex: new RegExp(query, "i") } },
                  ],
                },
                { esn: upperenrollment },
                // { phoneNumber: upperenrollment }  // Uncomment if needed
              ],
            },
          ],
        })
        .populate("plan")
        .populate({
          path: "acpProgram",
          select: { _id: 1, name: 1, code: 1 },
        })
        .populate({
          path: "carrier",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        })
        .populate({
          path: "approval.approvedBy",
          select: { _id: 1, name: 1 },
        });

      return customerResults;
    } else if (userRole.toUpperCase() === "QA MANAGER") {
      const upperenrollment = query.toUpperCase();
      const phoneNumberQuery = !isNaN(upperenrollment)
        ? { phoneNumber: upperenrollment }
        : {};
      const csrUsers = await adminService.getUserReportingTo(userId);
      if (csrUsers.length === 0) {
        return res.status(201).send({
          msg: "enrolments not found as no csr is reporting to this teamlead",
        });
      }
      const userObjectId = new mongoose.Types.ObjectId(User._id);
      const csrIds = csrUsers.map((csr) => csr._id);
      console.log(csrIds);
      customerResults = await custModel
        .find({
          $and: [
            {
              $or: [
                { assignToQa: userId },
                {
                  approval: {
                    $elemMatch: {
                      approved: { $in: [true, false] },
                      level: { $in: [1, 2, 3, 4] },
                    },
                  },
                },
                { approval: { $size: 0 }, level: { $in: [1, 2, 3, 4] } },
                { isUploaded: true },
              ],
            },
            {
              $or: [
                { enrollmentId: upperenrollment },
                { contact: upperenrollment },
                { accountId: upperenrollment },
                {
                  $and: [
                    { firstName: { $regex: new RegExp(firstName, "i") } },
                    { lastName: { $regex: new RegExp(lastName, "i") } },
                  ],
                },
                {
                  $or: [
                    { firstName: { $regex: new RegExp(query, "i") } },
                    { lastName: { $regex: new RegExp(query, "i") } },
                  ],
                },
                { esn: upperenrollment },
                // { phoneNumber: upperenrollment }  // Uncomment if needed
              ],
            },
          ],
        })
        .populate("plan")
        .populate({
          path: "acpProgram",
          select: { _id: 1, name: 1, code: 1 },
        })
        .populate({
          path: "carrier",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        })
        .populate({
          path: "approval.approvedBy",
          select: { _id: 1, name: 1 },
        });
      return customerResults;
    } else if (userRole.toUpperCase() === "PROVISION AGENT") {
      const upperenrollment = query.toUpperCase();
      const phoneNumberQuery = !isNaN(upperenrollment)
        ? { phoneNumber: upperenrollment }
        : {};

      customerResults = await custModel
        .find({
          //assignToQa: userId,
          $and: [
            {
              $or: [
                { assignToQa: userId },
                { "approval.approvedBy": userId },
                { isUploaded: true },
              ],
            },
            {
              $or: [
                { enrollmentId: upperenrollment },
                { contact: upperenrollment },
                { accountId: upperenrollment },
                {
                  $and: [
                    { firstName: { $regex: new RegExp(firstName, "i") } },
                    { lastName: { $regex: new RegExp(lastName, "i") } },
                  ],
                },
                {
                  $or: [
                    { firstName: { $regex: new RegExp(query, "i") } },
                    { lastName: { $regex: new RegExp(query, "i") } },
                  ],
                },
                { esn: upperenrollment },
                // { phoneNumber: upperenrollment }  // Uncomment if needed
              ],
            },
          ],
        })
        .populate("plan")
        .populate({
          path: "acpProgram",
          select: { _id: 1, name: 1, code: 1 },
        })
        .populate({
          path: "carrier",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        })
        .populate({
          path: "approval.approvedBy",
          select: { _id: 1, name: 1 },
        });

      return customerResults;
    } else if (userRole.toUpperCase() === "PROVISION MANAGER") {
      const upperenrollment = query.toUpperCase();
      const phoneNumberQuery = isNaN(upperenrollment)
        ? {}
        : { phoneNumber: parseInt(upperenrollment, 10) };
      console.log(upperenrollment, userId);

      customerResults = await custModel
        .find({
          $and: [
            {
              $or: [
                { assignToQa: userId },
                {
                  approval: {
                    $elemMatch: {
                      approved: true,
                      level: { $in: [3, 5, 6] },
                    },
                  },
                },
                { approval: { $size: 0 }, csr: userId },
                { isUploaded: true },
              ],
            },
            {
              $or: [
                { enrollmentId: upperenrollment },
                { contact: upperenrollment },
                { accountId: upperenrollment },
                {
                  $and: [
                    { firstName: { $regex: new RegExp(firstName, "i") } },
                    { lastName: { $regex: new RegExp(lastName, "i") } },
                  ],
                },
                {
                  $or: [
                    { firstName: { $regex: new RegExp(query, "i") } },
                    { lastName: { $regex: new RegExp(query, "i") } },
                  ],
                },
                { esn: upperenrollment },
                // { phoneNumber: upperenrollment }  // Uncomment if needed
              ],
            },
          ],
        })
        .populate("plan")
        .populate({
          path: "acpProgram",
          select: { _id: 1, name: 1, code: 1 },
        })
        .populate({
          path: "carrier",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        })
        .populate({
          path: "approval.approvedBy",
          select: { _id: 1, name: 1 },
        });
      return customerResults;
    } else if (userRole.toUpperCase() === "CS") {
      const upperenrollment = query.toUpperCase();
      const phoneNumberQuery = isNaN(upperenrollment)
        ? {}
        : { phoneNumber: parseInt(upperenrollment, 10) };
      console.log(upperenrollment, userId);
      customerResults = await custModel
        .find({
          // createdBy: userId,
          $or: [
            { enrollmentId: upperenrollment },
            { contact: upperenrollment },
            {
              $and: [
                { firstName: { $regex: new RegExp(firstName, "i") } },
                { lastName: { $regex: new RegExp(lastName, "i") } },
              ],
            },
            {
              $or: [
                { firstName: { $regex: new RegExp(query, "i") } },
                { lastName: { $regex: new RegExp(query, "i") } },
              ],
            },
            { esn: upperenrollment },
            //phoneNumberQuery
          ],
        })
        .populate("plan")
        .populate({
          path: "acpProgram",
          select: { _id: 1, name: 1, code: 1 },
        })
        .populate({
          path: "carrier",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        })
        .populate({
          path: "approval.approvedBy",
          select: { _id: 1, name: 1 },
        });
      return customerResults;
    } else {
      const upperenrollment = query.toUpperCase();
      const phoneNumberQuery = !isNaN(upperenrollment)
        ? { phoneNumber: upperenrollment }
        : {};

      customerResults = await custModel
        .find({
          $or: [
            { enrollmentId: upperenrollment },
            { contact: upperenrollment },
            { accountId: upperenrollment },
            {
              $and: [
                { firstName: { $regex: new RegExp(firstName, "i") } },
                { lastName: { $regex: new RegExp(lastName, "i") } },
              ],
            },
            {
              $or: [
                { firstName: { $regex: new RegExp(query, "i") } },
                { lastName: { $regex: new RegExp(query, "i") } },
              ],
            },
            { esn: upperenrollment },
            //{phoneNumber:upperenrollment}
          ],
        })
        .populate("plan")
        .populate({
          path: "acpProgram",
          select: { _id: 1, name: 1, code: 1 },
        })
        .populate({
          path: "carrier",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        })
        .populate({
          path: "approval.approvedBy",
          select: { _id: 1, name: 1 },
        });
      return customerResults;
    }
  },
  getCityAndStateByZip: async (zipCode) => {
    const result = await model.findOne({
      zipCode: zipCode,
    });
    return result;
  },
  getCityByState: async (state) => {
    const result = await model.findOne({
      state: state,
    });
    return result;
  },
};

module.exports = service;
