const expressAsyncHandler = require("express-async-handler");
const service = require("./service");
const { DateTime } = require("luxon");
const adminUserModel = require("../adminUser/adminUserModel");
const adminService = require("../adminUser/adminUserServices");
const model = require("../user/model");
const mongoose = require("mongoose");
exports.states = expressAsyncHandler(async (req, res) => {
  const result = await service.states();
  res.status(200).send({ msg: "states", data: result });
});
exports.EnrollmentApprovedBySingleUser = expressAsyncHandler(
  async (req, res) => {
    const { userId } = req.query; // The Team Lead for whom you want to show completed enrollments
    console.log(userId);
    const User = await adminService.getByUserID(userId);
    console.log(User);
    const userRole = User.role.role; //get user role
    const easternTimeZoneDate = DateTime.utc()
      .setZone("America/New_York")
      .toLocaleString(DateTime.DATETIME_MED); // Adjust the format as needed

    // Assuming you have a function to retrieve all CSR users reporting to the specified Team Lead
    if (userRole.toUpperCase() === "TEAM LEAD") {
      const csrUsers = await adminService.getUserReportingTo(userId);
      console.log("csr users", csrUsers);

      if (csrUsers.length === 0) {
        return res.status(201).send({
          msg: "enrollments not found as no CSR is reporting to this Team Lead",
        });
      }

      // Extract the IDs of CSR users reporting to the Team Lead
      const csrIds = csrUsers.map((csr) => csr.department);
      console.log(csrIds);

      // Query all enrollments for the CSR users
      const allEnrollments = await model
        .find({
          department: { $in: csrIds.concat(User.department) },
        })
        .sort({ createdAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        });

      const totalEnrollments = allEnrollments.length;

      if (totalEnrollments > 0) {
        res.status(201).send({
          msg: "Showing all enrollments for the Team Lead",
          data: totalEnrollments,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "QA AGENT") {
      const allEnrollments = await model.find({
        serviceProvider: User.company,
        approval: {
          $elemMatch: {
            approvedBy: User._id,
            approved: { $in: [true, false] },
            level: 3,
          },
        },
        // $or: [
        //   { $expr: { $eq: [{ $arrayElemAt: ['$approval.approved', -1] }, true] } },
        //   { 'approval': { $exists: false } },
        //   { 'approval': { $size: 0 } }
        // ],
      });

      if (allEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing all enrollments assigned to this QA Agent",
          data: allEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(400).send({
          msg: "No enrollments found",
        });
      }
    } else if (userRole.toUpperCase() === "QA MANAGER") {
      const allEnrollments = await model.find({
        level: { $in: [2, 3] },
        serviceProvider: User.company,
        $expr: {
          $gt: [
            { $subtract: [new Date(), "$createdAt"] },
            8 * 60 * 60 * 1000, // 8 hours in milliseconds
          ],
        },
      });

      if (allEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing all enrollments reporting CSR(s)",
          data: allEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No enrollments found from QA agents",
        });
      }
    } else if (userRole.toUpperCase() === "PROVISION AGENT") {
      const allEnrollments = await model.find({
        level: { $in: [5, null, []] },
        assignToQa: User._id,
        serviceProvider: User.company,
        $or: [
          { approval: { $size: 0 } },
          {
            $expr: {
              $eq: [{ $arrayElemAt: ["$approval.isEnrolled", -1] }, false],
            },
          },
        ],
      });

      if (allEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing all enrollments assigned to this PROVISION AGENT",
          data: allEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(400).send({
          msg: "No enrollments found",
        });
      }
    } else if (userRole.toUpperCase() === "CS") {
      const allEnrollments = await model.find({
        level: { $in: [2, 3] },
        serviceProvider: User.company,
        $expr: {
          $gt: [
            { $subtract: [new Date(), "$createdAt"] },
            8 * 60 * 60 * 1000, // 8 hours in milliseconds
          ],
        },
      });

      if (allEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing all enrollments reporting CSR(s)",
          data: allEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No enrollments found from QA agents",
        });
      }
    } else if (userRole.toUpperCase() === "CS MANAGER") {
      const allEnrollments = await model.find({
        level: { $in: [2, null, []] },
        csr: User._id,
        serviceProvider: User.company,
      });

      if (allEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing all enrollments assigned to this CS MANAGER",
          data: allEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(400).send({
          msg: "No enrollments found",
        });
      }
    } else if (userRole.toUpperCase() === "RETENTION AGENT") {
      const allEnrollments = await model.find({
        $or: [
          { department: User.department },
          { department: User.department, csr: User._id },
        ],
      });

      if (allEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing all enrollments for PROVISIONING MANAGER with level 3 or 4 approval",
          data: allEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No enrollments found for PROVISIONING MANAGER with level 3 or 4 approval",
        });
      }
    } else if (userRole.toUpperCase() === "RETENTION MANAGER") {
      const retentionUser = await adminUserModel.find({
        department: User.department,
      });
      const retIds = retentionUser.map((csr) => csr._id);
      const allEnrollments = await model.find({
        csr: { $in: retIds },
        department: User.department,
      });

      if (allEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing all enrollments for PROVISIONING MANAGER with level 3 or 4 approval",
          data: allEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No enrollments found for PROVISIONING MANAGER with level 3 or 4 approval",
        });
      }
    } else if (userRole.toUpperCase() === "CSR") {
      const allEnrollments = await model.find({
        csr: userId,
        serviceProvider: User.company,
      });

      if (allEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing all enrollments for the CSR",
          data: allEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No enrollments found",
        });
      }
    } else if (userRole.toUpperCase() === "DISPATCH AGENT") {
      const allEnrollments = await model.find({ level: 7 });

      if (allEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing all enrollments",
          data: allEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No enrollments found",
        });
      }
    }
  }
);
exports.provisionedSingleEnrollmentUserList = expressAsyncHandler(
  async (req, res) => {
    const { userId } = req.query; // The Team Lead for whom you want to show completed enrollments
    console.log(userId);
    const User = await adminService.getByUserID(userId);
    console.log(User);
    const userRole = User.role.role; //get user role
    const easternTimeZoneDate = DateTime.utc()
      .setZone("America/New_York")
      .toLocaleString(DateTime.DATETIME_MED); // Adjust the format as needed

    if (userRole.toUpperCase() === "PROVISION AGENT") {
      const enrollments = await model.find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        approval: {
          $elemMatch: {
            approvedBy: User._id,
            isEnrolled: true,
            isComplete: false,
          },
        },
      });

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing enrolled enrollments of provisiong agent",
          data: enrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No enrolled enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "PROVISION MANAGER") {
      const enrollments = await model.find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        approval: {
          $elemMatch: {
            isEnrolled: true,
            isComplete: false,
          },
        },
      });

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing enrolled enrollments of Provision manager",
          data: enrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "RETENTION AGENT") {
      const enrollments = await model.find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
      });

      const filteredEnrollments = enrollments.filter((enrollment) => {
        // Check if the 'approval' array exists and is not empty
        if (enrollment.approval && enrollment.approval.length > 0) {
          // Get the last object in the 'approval' array
          const lastApproval =
            enrollment.approval[enrollment.approval.length - 1];

          // Check if the last approval meets the specified conditions
          const isLastApprovalMatching =
            lastApproval.isEnrolled === true &&
            lastApproval.isComplete === false &&
            lastApproval.approvedBy.equals(User._id);

          return isLastApprovalMatching;
        }

        // If 'approval' array is not present or empty, exclude the enrollment
        return false;
      });

      if (filteredEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing enrolled enrollments for the RETENTION AGENT",
          data: filteredEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No enrolled enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "RETENTION MANAGER") {
      const enrollments = await model.find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
      });

      const filteredEnrollments = enrollments.filter((enrollment) => {
        // Check if the 'approval' array exists and is not empty
        if (enrollment.approval && enrollment.approval.length > 0) {
          // Get the last object in the 'approval' array
          const lastApproval =
            enrollment.approval[enrollment.approval.length - 1];

          // Check if the last approval meets the specified conditions
          const isLastApprovalMatching =
            (lastApproval.level === 7 || lastApproval.level === 8) &&
            lastApproval.isEnrolled === true &&
            lastApproval.isComplete === false;

          return isLastApprovalMatching;
        }

        // If 'approval' array is not present or empty, exclude the enrollment
        return false;
      });

      if (filteredEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments for RETENTION MANAGER",
          data: filteredEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No rejected enrollments found.",
        });
      }
    }
  }
);
exports.completeSingleEnrollmentUserList = expressAsyncHandler(
  async (req, res) => {
    const { userId } = req.query; // The Team Lead for whom you want to show completed enrollments
    console.log(userId);
    const User = await adminService.getByUserID(userId);
    console.log(User);
    const userRole = User.role.role; //get user role
    const easternTimeZoneDate = DateTime.utc()
      .setZone("America/New_York")
      .toLocaleString(DateTime.DATETIME_MED); // Adjust the format as needed

    if (userRole.toUpperCase() === "PROVISION AGENT") {
      const enrollments = await model.find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        approval: {
          $elemMatch: {
            approvedBy: User._id,
            isEnrolled: true,
            isComplete: true,
          },
        },
      });

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing completed enrollments for the Provision",
          data: enrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No completed enrollments found for the Provision.",
        });
      }
    } else if (userRole.toUpperCase() === "PROVISION MANAGER") {
      const enrollments = await model.find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        approval: {
          $elemMatch: {
            level: { $in: [5, 6, 7, 8] },
            isEnrolled: true,
            isComplete: true,
          },
        },
      });

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing completed enrollments for Provision Manager",
          data: enrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No completed enrollments found for the Provision Manager.",
        });
      }
    } else if (userRole.toUpperCase() === "RETENTION AGENT") {
      const enrollments = await model.find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        approval: {
          $elemMatch: {
            approvedBy: User._id,
            isEnrolled: true,
            isComplete: true,
          },
        },
      });
      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments for the Team Lead's",
          data: enrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No completed enrollments found for the Team Lead's.",
        });
      }
    } else if (userRole.toUpperCase() === "RETENTION MANAGER") {
      const enrollments = await model.find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        approval: {
          $elemMatch: {
            level: { $in: [7, 8] },
            isEnrolled: true,
            isComplete: true,
          },
        },
      });
      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments for the Team Lead's",
          data: enrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No completed enrollments found for the Team Lead's.",
        });
      }
    } else {
      res.status(200).send({ msg: "not found" });
    }
  }
);
exports.approvedSingleEnrollmentList = expressAsyncHandler(async (req, res) => {
  const { userId } = req.query; // The Team Lead for whom you want to show completed enrollments
  console.log(userId);
  const User = await adminService.getByUserID(userId);
  console.log(User);
  const userRole = User.role.role; //get user role
  const easternTimeZoneDate = DateTime.utc()
    .setZone("America/New_York")
    .toLocaleString(DateTime.DATETIME_MED); // Adjust the format as needed

  // Assuming you have a function to retrieve all CSR users reporting to the specified Team Lead
  if (
    userRole.toUpperCase() === "TEAM LEAD" ||
    userRole.toUpperCase() === "CS MANAGER"
  ) {
    const csrUsers = await adminService.getUserReportingTo(userId);
    console.log("csr users", csrUsers);
    if (csrUsers.length === 0) {
      return res
        .status(201)
        .send({ msg: "No CSR users found reporting to this Team Lead." });
    }
    const userObjectId = new mongoose.Types.ObjectId(User._id);
    console.log(userObjectId);
    // Extract the IDs of CSR users reporting to the Team Lead
    const csrIds = csrUsers.map((csr) => csr._id);
    const enrollments = await model
      .find({
        csr: { $in: csrIds },
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        approval: {
          $elemMatch: {
            approved: true,
            level: 3,
          },
        },
      })
      .sort({ createdAt: -1 })
      .populate({
        path: "plan",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "approvedBy",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "assignedToUser",
        populate: { path: "role", select: "role" },
        populate: { path: "department", select: "department" },
        select: "_id name role department",
      });
    const filteredEnrollments = enrollments.filter((enrollment) => {
      // Check if the 'approval' array exists and is not empty
      if (enrollment.approval && enrollment.approval.length > 0) {
        // Get the last object in the 'approval' array
        const lastApproval =
          enrollment.approval[enrollment.approval.length - 1];
        // Check if the last approval meets the specified conditions
        const isLastApprovalMatching =
          lastApproval.approved === true &&
          [3, 4, 5, 6].includes(lastApproval.level);

        return isLastApprovalMatching;
      }

      // If 'approval' array is not present or empty, exclude the enrollment
      return false;
    });
    console.log(filteredEnrollments.length);
    if (filteredEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments for the Team Lead's",
        data: filteredEnrollments.length,
        easternTimeZoneDate: easternTimeZoneDate,
      });
    } else {
      res.status(201).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  } else if (userRole.toUpperCase() === "CSR") {
    const enrollments = await model.find({
      csr: User._id,
      isEnrollmentComplete: true,
      serviceProvider: User.company,
      approval: {
        $elemMatch: {
          approved: true,
          level: 3,
        },
      },
    });
    console.log(enrollments);
    const filteredEnrollments = enrollments.filter((enrollment) => {
      // Check if the 'approval' array exists and is not empty
      if (enrollment.approval && enrollment.approval.length > 0) {
        // Get the last object in the 'approval' array
        const lastApproval =
          enrollment.approval[enrollment.approval.length - 1];
        console.log(lastApproval.approved);
        // Check if the last approval meets the specified conditions
        const isLastApprovalMatching = lastApproval.approved === true;

        return isLastApprovalMatching;
      }

      // If 'approval' array is not present or empty, exclude the enrollment
      return false;
    });

    if (filteredEnrollments.length > 0) {
      res.status(201).send({
        msg: "Approved Enrollments stats",
        data: filteredEnrollments.length,
        easternTimeZoneDate: easternTimeZoneDate,
      });
    } else {
      res.status(201).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  } else if (userRole.toUpperCase() === "QA AGENT") {
    const enrollments = await model.find({
      isEnrollmentComplete: true,
      serviceProvider: User.company,
      approval: {
        $elemMatch: {
          approved: true,
          level: 3,
          approvedBy: User._id,
        },
      },
    });

    if (enrollments.length > 0) {
      res.status(201).send({
        msg: "Approved Enrollments stats",
        data: enrollments.length,
        easternTimeZoneDate: easternTimeZoneDate,
      });
    } else {
      res.status(201).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  } else if (userRole.toUpperCase() === "QA MANAGER") {
    const enrollments = await model.find({
      isEnrollmentComplete: true,
      serviceProvider: User.company,
      approval: {
        $elemMatch: {
          approved: true,
          level: { $in: [3, 4] },
        },
      },
    });

    if (enrollments.length > 0) {
      res.status(201).send({
        msg: "Approved Enrollments stats",
        data: enrollments.length,
        easternTimeZoneDate: easternTimeZoneDate,
      });
    } else {
      res.status(201).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  }
});
exports.rejectedSingleEnrollmentUserList = expressAsyncHandler(
  async (req, res) => {
    const { userId } = req.query; // The Team Lead for whom you want to show completed enrollments
    console.log(userId);
    const User = await adminService.getByUserID(userId);
    console.log(User);
    const userRole = User.role.role; //get user role
    const easternTimeZoneDate = DateTime.utc()
      .setZone("America/New_York")
      .toLocaleString(DateTime.DATETIME_MED); // Adjust the format as needed

    // Assuming you have a function to retrieve all CSR users reporting to the specified Team Lead
    if (
      userRole.toUpperCase() === "TEAM LEAD" ||
      userRole.toUpperCase() === "CS MANAGER"
    ) {
      const csrUsers = await adminService.getUserReportingTo(userId);
      console.log("csr users", csrUsers);
      if (csrUsers.length === 0) {
        return res.status(201).send({
          msg: "enrolments not found as no csr is reporting to this teamlead",
        });
      }
      const userObjectId = new mongoose.Types.ObjectId(User._id);
      console.log(userObjectId);
      // Extract the IDs of CSR users reporting to the Team Lead
      const csrIds = csrUsers.map((csr) => csr.department);
      const csr = csrUsers.map((csr) => csr._id);

      console.log("csr", csr);
      const enrollments = await model
        .find({
          createdBy: { $in: csr },
          level: { $in: [1, 2, null, []] },
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          department: { $in: csrIds.concat(User.department) },
          $expr: { $eq: [{ $arrayElemAt: ["$approval.approved", -1] }, false] },
        })
        .sort({ rejectedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "rejectedBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });
      //   const filteredEnrollments = enrollments.filter((enrollment) =>
      //   enrollment.assignTo.includes(userObjectId || [])
      // );

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments for the Team Lead's",
          totalEnrollments: enrollments.length,
          data: enrollments,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No completed enrollments found for the Team Lead's.",
        });
      }
    } else if (userRole.toUpperCase() === "QA AGENT") {
      const enrollments = await model
        .find({
          isEnrollmentComplete: true,
          serviceProvider: User.company,
        })
        .sort({ rejectedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "rejectedBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });

      const filteredEnrollments = enrollments.filter((enrollment) => {
        // Check if the 'approval' array exists and is not empty
        if (enrollment.approval && enrollment.approval.length > 0) {
          // Get the last object in the 'approval' array
          const lastApproval =
            enrollment.approval[enrollment.approval.length - 1];

          // Check if the last approval meets the specified conditions
          const isLastApprovalMatching =
            lastApproval.approved === false &&
            ((lastApproval.level === 3 &&
              lastApproval.approvedBy.equals(User._id)) ||
              [5, 6, 7, 8].includes(lastApproval.level));

          return isLastApprovalMatching;
        }

        // If 'approval' array is not present or empty, exclude the enrollment
        return false;
      });

      if (filteredEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments",
          totalEnrollments: enrollments.length,
          data: filteredEnrollments.length,
        });
      } else {
        res.status(201).send({
          msg: "No rejected enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "QA MANAGER") {
      const enrollments = await model
        .find({
          isEnrollmentComplete: true,
          serviceProvider: User.company,
        })
        .sort({ rejectedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "rejectedBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });

      const filteredEnrollments = enrollments.filter((enrollment) => {
        // Check if the 'approval' array exists and is not empty
        if (enrollment.approval && enrollment.approval.length > 0) {
          // Get the last object in the 'approval' array
          const lastApproval =
            enrollment.approval[enrollment.approval.length - 1];

          // Check if the last approval meets the specified conditions
          const isLastApprovalMatching =
            lastApproval.approved === false &&
            (lastApproval.level === 3 || lastApproval.level === 4);

          return isLastApprovalMatching;
        }

        // If 'approval' array is not present or empty, exclude the enrollment
        return false;
      });

      if (filteredEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments",
          totalEnrollments: enrollments.length,
          data: filteredEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No rejected enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "CSR") {
      const enrollments = await model
        .find({
          csr: User._id,
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          $expr: { $eq: [{ $arrayElemAt: ["$approval.approved", -1] }, false] },
        })
        .sort({ rejectedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "rejectedBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments",
          totalEnrollments: enrollments.length,
          data: enrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No rejected enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "PROVISION AGENT") {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      const enrollments = await model.find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        approval: {
          $elemMatch: {
            approvedBy: User._id,
            approved: false,
            level: 5,
          },
        },
        $expr: {
          $and: [
            {
              $eq: [
                {
                  $arrayElemAt: ["$approval", -1],
                },
                {
                  $cond: {
                    if: {
                      $eq: [{ $arrayElemAt: ["$approval.approved", -1] }, true],
                    },
                    then: [],
                    else: { $arrayElemAt: ["$approval", -1] },
                  },
                },
              ],
            },
            {
              $ne: [{ $arrayElemAt: ["$approval.level", -1] }, 3],
            },
            {
              $ne: [{ $arrayElemAt: ["$approval.level", -1] }, 4],
            },
          ],
        },
      });

      console.log("enrollments", enrollments.length);
      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments",
          totalEnrollments: enrollments.length,
          data: enrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No rejected enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "PROVISION MANAGER") {
      const enrollments = await model
        .find({
          isEnrollmentComplete: true,
          serviceProvider: User.company,
        })
        .sort({ rejectedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "rejectedBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });

      const filteredEnrollments = enrollments.filter((enrollment) => {
        // Check if the 'approval' array exists and is not empty
        if (enrollment.approval && enrollment.approval.length > 0) {
          // Get the last object in the 'approval' array
          const lastApproval =
            enrollment.approval[enrollment.approval.length - 1];

          // Check if the last approval meets the specified conditions
          const isLastApprovalMatching =
            lastApproval.approved === false &&
            (lastApproval.level === 5 || lastApproval.level === 6);

          return isLastApprovalMatching;
        }

        // If 'approval' array is not present or empty, exclude the enrollment
        return false;
      });

      if (filteredEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments",
          totalEnrollments: enrollments.length,
          data: filteredEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No rejected enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "RETENTION AGENT") {
      const completedEnrollments = await model
        .find({ department: User.department, isEnrollmentComplete: true })
        .sort({ rejectedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "rejectedBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });

      console.log(completedEnrollments.length);
      if (completedEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments",
          totalEnrollments: enrollments.length,
          data: completedEnrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No rejected enrollments found.",
        });
      }
    } else if (
      userRole.toUpperCase() === "CSR" ||
      userRole.toUpperCase() === "ADMIN"
    ) {
      const enrollments = await model
        .find({
          csr: User._id,
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          $expr: { $eq: [{ $arrayElemAt: ["$approval.approved", -1] }, false] },
        })
        .sort({ rejectedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "rejectedBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments",
          totalEnrollments: enrollments.length,
          data: enrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        res.status(201).send({
          msg: "No rejected enrollments found.",
        });
      }
    }
  }
);
exports.inCompleteSingleEnrollmentUserList = expressAsyncHandler(
  async (req, res) => {
    const { userId } = req.query;
    const user = await adminService.getByUserID(userId);
    const result = await service.inCompleteEnrollmentUserList(
      userId,
      user.company
    );
    const easternTimeZoneDate = DateTime.utc()
      .setZone("America/New_York")
      .toLocaleString(DateTime.DATETIME_MED); // Adjust the format as needed

    res.status(200).send({
      msg: "Users",
      data: result.length,
      easternTimeZoneDate: easternTimeZoneDate,
    });
  }
);
exports.showTransferOutEnrollments = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;
    console.log(userId);

    // Fetch user details by userId
    const user = await adminService.getByUserID(userId);
    console.log(user);

    const userRole = user.role.role;

    if (
      userRole.toUpperCase() === "PROVISION AGENT" ||
      userRole.toUpperCase() === "PROVISION MANAGER" ||
      userRole.toUpperCase() === "RETENTION AGENT" ||
      userRole.toUpperCase() === "RETENTION MANAGER" ||
      userRole.toUpperCase() === "QA MANAGER"
    ) {
      const enrollments = await model.find({
        isEnrollmentComplete: true,
        status: "transferout",
      });

      const easternTimeZoneDate = DateTime.utc()
        .setZone("America/New_York")
        .toLocaleString(DateTime.DATETIME_MED); // Adjust the format as needed

      if (enrollments.length > 0) {
        return res.status(201).send({
          msg: `Showing transferout enrollments for ${userRole}`,
          data: enrollments.length,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      } else {
        return res.status(201).send({
          msg: `No transferout enrollments found for ${userRole}`,
          easternTimeZoneDate: easternTimeZoneDate,
        });
      }
    } else {
      return res.status(400).send({
        msg: "Invalid user role.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      msg: "Internal server error.",
    });
  }
});
exports.getNVSuccessLength = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;

    // Fetch user details by userId
    const user = await adminService.getByUserID(userId);

    if (!user) {
      return res.status(400).send({
        msg: "Invalid user ID.",
      });
    }

    let nvSuccess = 0;

    // Check if the user is a provision manager
    if (user.role === "PROVISION MANAGER") {
      // Fetch all agents reporting to the provision manager
      const reportingAgents = await adminUserModel.find({
        reportingTo: userId,
      });

      // Fetch enrollments for each reporting agent and count NVSuccess
      for (const agent of reportingAgents) {
        const agentEnrollments = await model.find({
          nvBy: agent._id,
          isNVSuccess: true,
        });
        nvSuccess += agentEnrollments.length;
      }
    }

    // Check if the user is an agent
    if (user.role === "PROVISION AGENT") {
      // Fetch enrollments for the specific agent and count NVSuccess
      const agentEnrollments = await model.find({
        nvBy: userId,
        isNVSuccess: true,
      });
      nvSuccess = agentEnrollments.length;
    }
    const easternTimeZoneDate = DateTime.utc()
      .setZone("America/New_York")
      .toLocaleString(DateTime.DATETIME_MED); // Adjust the format as needed

    res.status(200).send({
      msg: "NVSuccess length for the user",
      data: { userName: user.name, nvSuccess },
      easternTimeZoneDate: easternTimeZoneDate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      msg: "Internal server error",
      error: error.message,
    });
  }
});
exports.getEnrollmentsForProvision = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;

    // Fetch user details by userId
    const user = await adminService.getByUserID(userId);

    // Check if the user exists and has the correct role (PROVISION MANAGER)
    if (!user || user.role.role !== "PROVISION MANAGER") {
      return res.status(400).send({
        msg: "Invalid user ID or missing reporting information.",
      });
    }

    // Fetch all agents reporting to the Provision Manager
    const allReportingToUsers = await adminUserModel.find({
      reportingTo: userId,
    });

    // Fetch enrollments for each reporting agent and include agent details
    const enrollmentsByAgent = [];

    for (const agent of allReportingToUsers) {
      const agentEnrollments = await model.find({
        $or: [{ approvedBy: agent._id }, { createdBy: agent._id }],
      });
      const User = await adminService.getByUserID(agent._id);
      console.log(User);
      const userRole = User.role.role;
      enrollmentsByAgent.push({
        agentId: agent._id,
        agentName: agent.name,
        agentRole: userRole,
        enrollmentsCount: agentEnrollments.length,
      });
    }
    const easternTimeZoneDate = DateTime.utc()
      .setZone("America/New_York")
      .toLocaleString(DateTime.DATETIME_MED); // Adjust the format as needed

    res.status(200).send({
      msg: "Enrollments for the PROVISION MANAGER and reporting agents",
      data: enrollmentsByAgent,
      easternTimeZoneDate: easternTimeZoneDate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      msg: "Internal server error",
      error: error.message,
    });
  }
});
exports.getEnrollmentsForTeamlead = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;

    // Fetch user details by userId
    const user = await adminService.getByUserID(userId);
    const userRole = user.role.role; //get user role
    console.log(userRole);
    // Check if the user exists and has the correct role (TEAM LEAD)
    if (!user || userRole !== "TEAM LEAD") {
      return res.status(400).send({
        msg: "Invalid user ID or missing reporting information.",
      });
    }

    // Fetch all agents reporting to the Team Lead
    const allReportingToUsers = await adminUserModel.find({
      reportingTo: userId,
    });

    // Fetch enrollments for each reporting agent and include agent details
    const enrollmentsByAgent = [];

    for (const agent of allReportingToUsers) {
      const agentEnrollments = await model.find({
        $or: [{ approvedBy: agent._id }, { createdBy: agent._id }],
      });
      const User = await adminService.getByUserID(agent._id);
      console.log(User);
      const userRole = User.role;
      enrollmentsByAgent.push({
        agentId: agent._id,
        agentName: agent.name,
        agentRole: userRole,
        enrollmentsCount: agentEnrollments.length,
      });
    }

    res.status(200).send({
      msg: "Enrollments for the TEAM LEAD and reporting agents",
      data: enrollmentsByAgent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      msg: "Internal server error",
      error: error.message,
    });
  }
});
exports.getEnrollmentsForUser = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;

    // Fetch user details by userId
    const user = await adminService.getByUserID(userId);

    // Check if the user exists and has the correct role (QA MANAGER)
    if (!user || user.role.role !== "QA MANAGER") {
      return res.status(400).send({
        msg: "Invalid user ID or missing reporting information.",
      });
    }
    // Fetch all agents reporting to the QA Manager
    const allReportingToUsers = await adminUserModel.find({
      reportingTo: userId,
    });

    // Fetch enrollments for each reporting agent and include agent details
    const enrollmentsByAgent = [];

    for (const agent of allReportingToUsers) {
      const agentEnrollments = await model.find({
        $or: [{ approvedBy: agent._id }, { createdBy: agent._id }],
      });
      const User = await adminService.getByUserID(agent._id);
      const userRole = User.role.role;
      enrollmentsByAgent.push({
        agentId: agent._id,
        agentName: agent.name,
        agentRole: userRole,
        enrollmentsCount: agentEnrollments.length,
      });
    }
    const easternTimeZoneDate = DateTime.utc()
      .setZone("America/New_York")
      .toLocaleString(DateTime.DATETIME_MED); // Adjust the format as needed

    res.status(200).send({
      msg: "Enrollments for the QA MANAGER and reporting agents",
      data: enrollmentsByAgent,
      easternTimeZoneDate: easternTimeZoneDate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      msg: "Internal server error",
      error: error.message,
    });
  }
});
exports.getactivesalescsr = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;
    const User = await adminService.getByUserID(userId);

    if (!User) {
      return res.status(404).json({ message: "User not found." });
    }

    const userRole = User.role.role;
    let enrollments;

    if (userRole.toUpperCase() === "TEAM LEAD") {
      // If the user is a Team Lead, fetch enrollments for the Team Lead
      enrollments = await model.find({
        createdBy: new mongoose.Types.ObjectId(userId),
        status: "active",
      });
    } else {
      // If the user is a CSR, fetch enrollments for the CSR
      enrollments = await model.find({
        createdBy: new mongoose.Types.ObjectId(userId),
        status: "active",
      });
    }

    const activeEnrollmentsCount = enrollments.length;
    const activeenrollment = enrollments;
    // Adjust the format as needed

    res.status(200).json({
      msg: "Active Enrollments Count",
      data: activeEnrollmentsCount,
      activeenrollment: activeenrollment,
    });
  } catch (error) {
    console.error("Error fetching active enrollments count:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
exports.inactiveenrollments = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;
    const User = await adminService.getByUserID(userId);
    console.log(User);
    const userRole = User.role.role; //get user role

    if (userRole.toUpperCase() === "TEAM LEAD") {
      // Assuming you have a model for enrollments

      const inactiveEnrollments = await model.find({
        createdBy: userId,
        isEnrollmentComplete: false,
      });
      // Adjust the format as needed
      return res.status(200).json({
        message: "Inactive enrollments for Team Lead",
        data: inactiveEnrollments.length,
      });
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. User is not a Team Lead." });
    }
  } catch (error) {
    console.error("Error fetching inactive enrollments:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
exports.showsalestoteamlead = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;

    const User = await adminService.getByUserID(userId);

    if (!User) {
      return res.status(404).json({ message: "User not found." });
    }

    const userRole = User.role.role;

    // Fetch count of completed enrollments for the user's role and user ID
    const completedEnrollmentsCount = await model.countDocuments({
      createdBy: userId,
      isEnrollmentComplete: true,
    });

    return res.status(200).json({
      message: `Completed enrollments count for ${userRole}`,
      data: { count: completedEnrollmentsCount },
    });
  } catch (error) {
    console.error("Error fetching completed enrollments count:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
exports.salesStatsByChannel = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await adminService.getByUserID(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const userRole = user.role.role;
    console.log("User Role:", userRole);

    if (
      userRole.toUpperCase() === "TEAM LEAD" ||
      userRole.toUpperCase() === "CSR"
    ) {
      console.log("Access granted. User is a Team Lead or CSR.");

      // Get the users based on their role
      let users;
      if (userRole.toUpperCase() === "TEAM LEAD") {
        // If the user is a Team Lead, get all CSR users reporting to them
        users = await adminService.getUserReportingTo(userId);
      } else {
        // If the user is a CSR, get only their own data
        users = [user];
      }

      if (users.length === 0) {
        return res
          .status(201)
          .send({ msg: "No users found for the given role." });
      }

      // Extract the IDs of users
      const userIds = users.map((usr) => usr._id);

      // Fetch sales stats based on sales channel for enrollments created by users
      const salesStats = await model.aggregate([
        {
          $match: {
            createdBy: { $in: userIds },
            isEnrollmentComplete: true,
          },
        },
        {
          $group: {
            _id: null, // Group all documents together
            enrollments: { $push: "$$ROOT" },
          },
        },
      ]);
      // Convert approvedAt times to Eastern Time Zone and format as "dd LLL yyyy, h:mm a"
      const transformedEnrollments = salesStats[0].enrollments.map(
        (enrollment) => {
          if (enrollment.createdAt) {
            enrollment.createdAt = DateTime.fromJSDate(enrollment.createdAt)
              .setZone("America/New_York")
              .toFormat("dd LLL yyyy, h:mm a");
          }
          if (enrollment.approvedAt) {
            enrollment.approvedAt = DateTime.fromJSDate(enrollment.approvedAt)
              .setZone("America/New_York")
              .toFormat("dd LLL yyyy, h:mm a");
          }
          return enrollment;
        }
      );

      return res.status(200).json({
        message: "Sales stats by channel",
        data: { enrollments: transformedEnrollments },
      });
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. User is not a Team Lead or CSR." });
    }
  } catch (error) {
    console.error("Error fetching sales stats by channel:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.totalEnrollments = expressAsyncHandler(async (req, res) => {
  let { accountType, startDate, endDate, serviceProvider } = req.query; // Extract start and end dates

  // Parse start and end dates into Luxon DateTime objects
  let startDateTime, endDateTime;

  // If both start and end dates are provided, use them
  if (startDate && endDate) {
    startDateTime = DateTime.fromISO(startDate).setZone("America/New_York");

    // Parse end date and set it to the end of the day in Eastern time zone
    endDateTime = DateTime.fromISO(endDate)
      .setZone("America/New_York")
      .endOf("day"); // Ensure it's set to the end of the day
    var startISOWithoutTZ = startDateTime.toJSDate();
    var endISOWithoutTZ = endDateTime.toJSDate();
  } else {
    // Default to current day's data
    const now = DateTime.now().setZone("America/New_York");
    startDateTime = now.startOf("day");
    endDateTime = now.endOf("day");

    var startISOWithoutTZ = startDateTime.toISO({
      suppressMilliseconds: true,
      includeOffset: false,
    });
    var endISOWithoutTZ = endDateTime.toISO({
      suppressMilliseconds: true,
      includeOffset: false,
    });

    console.log(startISOWithoutTZ, endISOWithoutTZ);
  }
  console.log(startDateTime, endDateTime);
  const enrollments = await model.find({
    //$or: [{ csr: { $in: csrIds } }, { csr: User._id }],
    accountType: accountType,
    isEnrollmentComplete: true,
    serviceProvider: serviceProvider,
    createdAt: {
      $gte: startISOWithoutTZ,
      $lte: endISOWithoutTZ,
    },
  });
  console.log(enrollments.length);

  if (enrollments.length > 0) {
    res.status(201).send({
      msg: `Showing Total enrollments for ${accountType}`,
      data: enrollments.length,
    });
  } else {
    res.status(400).send({
      msg: "No completed enrollments found for the Team Lead's.",
    });
  }
});

exports.enrollmentsByRoles = expressAsyncHandler(async (req, res) => {
  let { accountType, startDate, endDate, serviceProvider } = req.query; // Extract start and end dates

  const csrs = await service.userByRole("6533c0f9027ce82576113aac");
  const csrIds = csrs.map((csr) => csr._id);
  const QAUsers = await service.userByRole("653617d72bbe16a3c99fa001");
  const qaIds = QAUsers.map((csr) => csr._id);
  console.log(csrIds);
  //return 0;
  // Parse start and end dates into Luxon DateTime objects
  let startDateTime, endDateTime;

  // If both start and end dates are provided, use them
  if (startDate && endDate) {
    startDateTime = DateTime.fromISO(startDate).setZone("America/New_York");

    // Parse end date and set it to the end of the day in Eastern time zone
    endDateTime = DateTime.fromISO(endDate)
      .setZone("America/New_York")
      .endOf("day"); // Ensure it's set to the end of the day
    var startISOWithoutTZ = startDateTime.toJSDate();
    var endISOWithoutTZ = endDateTime.toJSDate();
  } else {
    // Default to current day's data
    const now = DateTime.now().setZone("America/New_York");
    startDateTime = now.startOf("day");
    endDateTime = now.endOf("day");

    var startISOWithoutTZ = startDateTime.toISO({
      suppressMilliseconds: true,
      includeOffset: false,
    });
    var endISOWithoutTZ = endDateTime.toISO({
      suppressMilliseconds: true,
      includeOffset: false,
    });

    console.log(startISOWithoutTZ, endISOWithoutTZ);
  }
  console.log(startDateTime, endDateTime);
  const CSRenrollments = await model.find({
    csr: { $in: csrIds },
    accountType: accountType,
    isEnrollmentComplete: true,
    serviceProvider: serviceProvider,
    createdAt: {
      $gte: startISOWithoutTZ,
      $lte: endISOWithoutTZ,
    },
  });
  const QAenrollmentsApproved = await model.find({
    approvedBy: { $in: qaIds },
    accountType: accountType,
    isEnrollmentComplete: true,
    serviceProvider: serviceProvider,
    approvedAt: {
      $gte: startISOWithoutTZ,
      $lte: endISOWithoutTZ,
    },
  });
  const QAenrollmentsRejected = await model.find({
    rejectedBy: { $in: qaIds },
    accountType: accountType,
    isEnrollmentComplete: true,
    serviceProvider: serviceProvider,
    rejectedAt: {
      $gte: startISOWithoutTZ,
      $lte: endISOWithoutTZ,
    },
  });
  console.log(CSRenrollments.length);

  if (
    CSRenrollments.length > 0 ||
    QAenrollmentsApproved.length ||
    QAenrollmentsRejected.length
  ) {
    res.status(201).send({
      msg: `Showing Total enrollments for ${accountType}`,
      csrs: CSRenrollments.length,
      qaApproved: QAenrollmentsApproved.length,
      qaRejected: QAenrollmentsRejected.length,
    });
  } else {
    res.status(400).send({
      msg: "No completed enrollments found for the Team Lead's.",
    });
  }
});
