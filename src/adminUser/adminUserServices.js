const adminUserModel = require("./adminUserModel");
const mongoose = require("mongoose");
const roleRouter = require("../rolePermission/roleRouter");
const { projection } = require("../config/mongoProjection");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const jwtServices = require("../utils/jwtServices");
const authIdServices = require("../auth/authIdServices");
const actionModel = require("../rolePermission/permissionModel");
const enrollmentModel = require("../user/model.js");
const nodemailer = require("nodemailer");

async function getUserByEmail(email) {
  return await adminUserModel.findOne({ email });
}

async function setNewPassword(userId, newPassword) {
  return await adminUserModel.findByIdAndUpdate(userId, {
    password: newPassword,
  });
}
const adminUserServices = {
  get: async (serviceProvider) => {
    const result = await adminUserModel.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(serviceProvider),
          deleted: false,
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $unwind: {
          path: "$role",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "usergroups",
          localField: "_id",
          foreignField: "users",
          as: "group",
        },
      },
      {
        $unwind: {
          path: "$group",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          "role._id": 1,
          "role.role": 1,
          name: 1,
          address: 1,
          city: 1,
          zip: 1,
          state: 1,
          createdDate: 1,
          disabledDate: 1,
          email: 1,
          active: 1,
          RADId: 1,
          contact: 1,
          deleted: 1,
          "department.department": 1,
          reportingTo: 1,
          // "master._id": 1,
          // "master.name": 1,
          // "distributer._id": 1,
          // "distributer.name": 1,
          // "retailer._id": 1,
          // "retailer.name": 1,
          // "group._id": 1,
          // "group.name": 1,
        },
      },
    ]);
    return result;
  },
  getQaAgents: async (company) => {
    const result = await adminUserModel
      .find({
        company: company,
        role: {
          $in: [new mongoose.Types.ObjectId("653617d72bbe16a3c99fa001")],
        },
        deleted: false,
      })
      .populate("role")
      .populate("department");
    return result;
  },
  leaveStatus: async (userId, isOnLeave) => {
    const result = await adminUserModel.findOneAndUpdate(
      { _id: userId },
      {
        isOnLeave: isOnLeave,
        // leaveFrom: from,
        // leaveTo: to,
      },
      { new: true }
    );
    return result;
  },
  isUser: async (company, email) => {
    const result = await adminUserModel.findOne(
      { company, email: email },
      projection.projection
    );
    return result;
  },
  getByUserID: async (_id) => {
    const result = await adminUserModel
      .findOne({ _id, deleted: false }, projection.projection)
      .populate({
        path: "role",
        select: { _id: 1, role: 1 },
      })
      .populate({
        path: "department",
        select: { _id: 1, department: 1 },
      });

    return result;
  },
  validatePassword: async (password, realPassword) => {
    const valid = await bcrypt.compare(password, realPassword);
    return valid;
  },
  login: async (email) => {
    try {
      const user = await adminUserModel
        .findOne({ email })
        .populate({
          path: "role",
          model: "Role",
          populate: {
            path: "permissions.subModule",
            model: "SubModule",
            populate: {
              path: "actions",
              model: "Permission",
            },
          },
        })
        .populate("company", "name carrier")
        .exec();

      if (!user) {
        // Handle the case when the user is not found
        return { msg: "User not found", data: null };
      }

      const response = {
        _id: user._id,
        userName: user.name,
        password: user.password,
        company: user.company._id,
        companyName: user.company.name,
        carrier: user.company.carrier,
        role: {
          _id: user.role._id,
          role: user.role.role,
          description: user.role.description,
        },
        mobile: user.contact,
        email: user.email,
        status: user.active,
        city: user.city,
        address: user.address,
        zip: user.zip,
        state: user.state,
        createdDate: user.createdDate,
        disabledDate: user.disabledDate,
        department: user.department,
        reportingTo: user.reportingTo,
        repId: user.repId,
        permissions: [],
        token: "",
        refreshToken: "",
      };

      if (user.role && user.role.permissions) {
        const uuid = uuidv4();
        console.log("uuid", uuid);
        const refreshToken = jwtServices.create({ uuid, type: "admin" });
        const accessToken = jwtServices.create(
          { userId: user._id, type: "admin" },
          "5m"
        );

        // Update the token in the user model
        await adminUserModel.findOneAndUpdate(
          { _id: user._id },
          { token: accessToken },
          { new: true }
        );

        const nestedPopulates = user.role.permissions.map(
          async (modulePermission) => {
            const subModule = modulePermission.subModule;
            if (!subModule) {
              console.error(
                "SubModule is missing for permission:",
                modulePermission._id
              );
              return null;
            }

            // Get the actions associated with the current permission
            const actions = await Promise.all(
              modulePermission.actions.map(async (actionId) => {
                // Populate the 'name' field to get the details of the action
                const action = await actionModel.findById(actionId);

                return {
                  _id: actionId,
                  name: action ? action.name : "Unknown Action", // Use a default value if action is not found
                  // Include other properties as needed
                };
              })
            );

            // Populate the 'module' field to get the details of the module
            const mod = await adminUserModel.populate(subModule, {
              path: "module",
              select: "_id name route icon orderPosition",
            });
            console.log(mod);
            if (!mod.module) {
              console.error("Module is missing in mod:", mod);
              return null;
            }

            return {
              moduleId: mod.module._id,
              module: mod.module.name,
              route: mod.module.route,
              icon: mod.module.icon,
              orderPosition: mod.module.orderPosition,
              subModule: {
                _id: subModule._id,
                module: subModule.name,
                route: subModule.route,
                orderPosition: subModule.orderPosition,
                icon: subModule.icon,
                actions,
              },
            };
          }
        );

        // Wait for all promises to resolve
        const populatedPermissions = await Promise.all(nestedPopulates);

        // Group the permissions by module
        const groupedPermissions = {};

        populatedPermissions.forEach((permission) => {
          const { moduleId, module, route, icon, orderPosition, subModule } =
            permission;

          if (!groupedPermissions[moduleId]) {
            groupedPermissions[moduleId] = {
              moduleId,
              module,
              route,
              icon,
              orderPosition,
              subModule: [],
            };
          }

          // Find the corresponding module in the groupedPermissions
          const moduleEntry = groupedPermissions[moduleId];

          // Check if the subModule already exists
          const existingSubModule = moduleEntry.subModule.find((existingSub) =>
            existingSub._id.equals(subModule._id)
          );

          if (existingSubModule) {
            // SubModule exists, push actions to it
            existingSubModule.actions.push(...subModule.actions);
          } else {
            // SubModule doesn't exist, add it with actions
            moduleEntry.subModule.push({
              _id: subModule._id,
              name: subModule.module,
              route: subModule.route,
              orderPosition: subModule.orderPosition,
              icon: subModule.icon,
              actions: [...subModule.actions],
              // Include other properties as needed
            });
          }
        });

        // Convert the groupedPermissions object to an array
        let formattedPermissions = Object.values(groupedPermissions);

        // Sort permissions array by module order position and name
        formattedPermissions.sort((a, b) => {
          if (a.orderPosition !== b.orderPosition) {
            return a.orderPosition - b.orderPosition;
          }
          return a.module.localeCompare(b.module);
        });

        // Sort sub-modules within each module by order position and name
        formattedPermissions.forEach((permission) => {
          permission.subModule.sort((a, b) => {
            if (a.orderPosition !== b.orderPosition) {
              return a.orderPosition - b.orderPosition;
            }
            return a.name.localeCompare(b.name);
          });
        });

        // Log the formatted permissions
        console.log("Formatted Permissions:", formattedPermissions);

        // Add formatted permissions to the response
        response.permissions = formattedPermissions;
        // Update the response with tokens
        response.token = accessToken;
        response.refreshToken = refreshToken;

        // Add auth ID to your authIdServices
        authIdServices.add(user._id, uuid);
      }

      return response;
    } catch (error) {
      console.error("Error in login:", error);
      throw error;
    }
  },

  addNew: async (
    company,
    createdBy,
    roleId,
    name,
    email,
    password,
    RADId,
    contact,
    city,
    address,
    zip,
    state,
    reportingTo,
    department,
    repId
    // RADId
  ) => {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    user = new adminUserModel({
      company: new mongoose.Types.ObjectId(company),
      createdBy: new mongoose.Types.ObjectId(createdBy),
      role: new mongoose.Types.ObjectId(roleId),
      name,
      email,
      password,
      // agentType,
      // master,
      // distributer,
      // retailer,
      RADId,
      contact,
      city,
      address,
      zip,
      state,
      reportingTo,
      department,
      repId,
      // master,
      // distributer,
      // retailer,
      // RADId,
    });
    const result = await user.save();
    return result;
  },

  forgotPassword: async (email, password) => {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const result = await adminUserModel.findOneAndUpdate(
      { email },
      { password },
      { new: true }
    );
    return result;
  },
  update: async (
    company,
    _id,
    updatedBy,
    roleId,
    name,
    contact,
    city,
    address,
    zip,
    state,
    RADId,
    reportingTo,
    department
  ) => {
    const result = await adminUserModel.findOneAndUpdate(
      { _id },
      {
        company: new mongoose.Types.ObjectId(company),
        updatedBy: new mongoose.Types.ObjectId(updatedBy),
        role: new mongoose.Types.ObjectId(roleId),
        name,
        contact,
        // agentType,
        // master,
        // distributer,
        // retailer,
        city,
        address,
        zip,
        state,
        RADId,
        reportingTo,
        department,
      },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    console.log(_id);
    const result = await adminUserModel.findOneAndUpdate(
      { _id },
      { deleted: true },
      { new: true }
    );
    return result;
  },
  getUserReportingTo: async (teamLeadId) => {
    const csrUsers = await adminUserModel
      .find({ reportingTo: teamLeadId })
      .populate({
        path: "role",
        select: { _id: 1, role: 1 },
      });

    return csrUsers;
  },

  getTeamLeadByCSR: async (csrUserId) => {
    try {
      const csrUser = await adminUserModel.findById(csrUserId);

      if (!csrUser) {
        return null; // Return null if CSR user not found
      }

      // Assuming reportingTo field holds the Team Lead's ID
      const teamLead = await adminUserModel.findById(csrUser.reportingTo);

      return teamLead;
    } catch (error) {
      console.error("Error in getTeamLeadByCSR:", error);
      throw error;
    }
  },
  getByDepartments: async (department) => {
    const result = await adminUserModel.find({ department, deleted: false });
    return result;
  },
  divideEqually: async (allAgents, enrollmentsWithAgents) => {
    const enrollmentsPerAgent = Math.floor(
      enrollmentsWithAgents.length / allAgents.length
    );
    console.log("enrollmentsPerAgent", enrollmentsPerAgent);
    // Step 4: Distribute the enrollments among QA agents
    const assignments = {};
    allAgents.forEach((agent, index) => {
      const start = index * enrollmentsPerAgent;
      const end = (index + 1) * enrollmentsPerAgent;
      assignments[agent._id] = enrollmentsWithAgents.slice(start, end);
    });
    console.log("assignments", assignments);

    // Assign the remaining enrollments to the last QA agent
    const remainingEnrollments = enrollmentsWithAgents.slice(
      allAgents.length * enrollmentsPerAgent
    );
    console.log("remainingEnrollments", remainingEnrollments);
    assignments[allAgents[allAgents.length - 1]._id] =
      assignments[allAgents[allAgents.length - 1]._id].concat(
        remainingEnrollments
      );
    console.log();
    // Step 5: Update the enrollments with the new QA assignments
    for (const [agentId, assignedEnrollments] of Object.entries(assignments)) {
      await enrollmentModel.updateMany(
        {
          _id: { $in: assignedEnrollments.map((enrollment) => enrollment._id) },
        },
        { assignToQa: agentId }
      );
    }
    return 0;
  },
  verifyCodeAndResetPassword: async (user, newPassword) => {
    try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.verificationCode = undefined;
      user.otpExpire = undefined;
      await user.save();
      return user; // Return the updated user document
    } catch (error) {
      console.error("Error resetting password:", error);
      return null;
    }
  },
  generateVerificationCode: async () => {
    return Math.floor(100000 + Math.random() * 900000);
  },

  // Define a function to send the verification code via email
  sendVerificationCodeByEmail: async (email, verificationCode) => {
    try {
      // Create a transporter, configure it with your email service provider's details
      const transporter = nodemailer.createTransport({
        host: process.env.MAILHOST,
        port: process.env.MAILPORT,
        secure: false,
        auth: {
          user: process.env.MAIL,
          pass: process.env.MAILPASS,
        },
      });

      // Define the email content
      const mailOptions = {
        from: process.env.MAIL,
        to: email,
        subject: "Verification Code for Password Reset",
        text: `Your verification code is: ${verificationCode}`,
      };

      // Send the email and handle success/failure
      const result = await transporter.sendMail(mailOptions);

      if (result.accepted.length > 0) {
        // Email was sent successfully
        console.log("Email sent successfully");
      } else {
        // Email sending failed
        console.log("Email sending failed");
      }

      return true;
    } catch (error) {
      // Handle any errors that may occur during email sending
      console.error("Error sending verification code email:", error);
      return false;
    }
  },

  updateOtp: async (email, otp) => {
    var otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 3);
    const customer = await adminUserModel.findOneAndUpdate(
      { email: email },
      { otp, otpExpire: otpExpiry },
      { new: true }
    );

    return customer;
  },
  verifyOTP: async (email, otp) => {
    const verify = await adminUserModel.findOneAndUpdate(
      { email: email, code: otp },
      { code: null }
    );
    return verify;
  },
  otpExpiryValidation: async (email) => {
    const validate = await adminUserModel.findOne({
      email: email,
      otpExpire: { $gte: new Date() },
    });
    console.log("here");
    return validate;
  },
  setNewPassword: async (_id, password) => {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const result = await adminUserModel.findOneAndUpdate(
      { _id: _id },
      {
        password,
      },
      {
        new: true,
      }
    );
    return result;
  },
  isUser: async (email) => {
    const result = await adminUserModel.findOne(
      { email: email },
      projection.projection
    );
    return result;
  },
  forgotPassword: async (email, password) => {
    console.log(email, password);
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const result = await model.findOneAndUpdate(
      { email },
      { password },
      { new: true }
    );
    return result;
  },
};

module.exports = adminUserServices;
