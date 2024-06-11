const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const adminUserServices = require("./adminUserServices");
const jwtServices = require("../utils/jwtServices");
const OTP = require("../utils/OTP.js");
const passwordValidator = require("../utils/passwordValidator");
const { v4: uuidv4 } = require("uuid");
const validateMobileNo = require("../utils/validateMobileNo");
const authIdServices = require("../auth/authIdServices");
const roleModel = require("../rolePermission/roleModel");
const model = require("./adminUserModel");
const enrollmentModel = require("../user/model.js");
const heirarchyService = require("../roleHeirarchy/roleHeirarchyService");
const hierarchyModel = require("../roleHeirarchy/roleHeirarchyModel");
const departmentService = require("../departments/departmentServices.js");
const adminUserRouter = express.Router();
const nodemailer = require("nodemailer");
const adminUserModel = require("./adminUserModel");
const crypto = require("crypto");
const adminreset = require("../utils/resetlinkpas");
const depservice = require("../departments/departmentServices.js");
const bcrypt = require("bcrypt");
adminUserRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    const { company } = req.query;
    const result = await adminUserServices.get(company);
    res.status(200).send({ msg: "users", data: result });
  })
);
adminUserRouter.get(
  "/getQaAgents",
  expressAsyncHandler(async (req, res) => {
    const { company } = req.query;
    const result = await adminUserServices.getQaAgents(company);
    if (result) {
      res.status(200).send({ msg: " QA Agents Users", data: result });
    } else {
      res.status(400).send({ msg: " QA Agents Users Not Found" });
    }
  })
);
adminUserRouter.get(
  "/userDetails",
  expressAsyncHandler(async (req, res) => {
    let { userId } = req.query;
    const result = await adminUserServices.getByUserID(userId);
    if (result) {
      return res.status(200).send({ msg: "user", data: result });
    } else {
      return res.status(400).send({ msg: "User Not Found" });
    }
  })
);

//random password send to mail
const sendPasswordBymail = async (email, password) => {
  try {
    // Create a transporter, configure it with your email service provider's details
    console.log("Sending password");
    const transporter = nodemailer.createTransport({
      host: process.env.MAILHOST,
      port: process.env.MAILPORT,
      secure: false,
      auth: {
        user: process.env.MAIL,
        pass: process.env.MAILPASS,
      },
    });
    console.log("now sending mail");
    // Iterate through the processed data (emails)
    const mailOptions = {
      from: process.env.MAIL,
      to: email,
      subject: "your password for your account",
      html: `<b>Your password for the account is</b>: ${password}`,
    };
    console.log("asdf sending", mailOptions);
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
    return false;
  }
};
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

// Define a function to send the verification code via email
const sendVerificationCodeByEmail = async (email, verificationCode) => {
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
};

adminUserRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    let {
      company,
      createdBy,
      roleId,
      name,
      email,
      RADId,
      contact,
      city,
      address,
      zip,
      state,
      reportingTo,
      department,
      repId,
    } = req.body;
    if (!company) {
      // console.log(req);
      return res.status(400).send({ msg: "Fields are Missing" });
    }
    const roleType = await roleModel.findOne({ _id: roleId });
    if (roleType.role === "Super_Admin") {
      return res.status(400).send({
        msg: "You don't have permission to add user with super admin role!",
      });
    }
    let checkDep = await depservice.getDepById(department);
    console.log(checkDep);
    if (
      checkDep.department.toUpperCase() === "PROVISION MANAGER" ||
      checkDep.department.toUpperCase() === "PROVISIONING MANAGER"
    ) {
      if (!repId) {
        return res.status(400).send({
          msg: "repId required",
        });
      }
    }
    const password = generateRandomPassword();
    console.log("Random Password:", password);
    const User = await adminUserServices.isUser(company, email);
    if (!passwordValidator.schema.validate(password)) {
      return res.status(400).send({
        msg: "Password must have at least:1 uppercase letter,1 lowercase letter,1 number and 1 special character",
      });
    }

    if (User) {
      return res.status(400).send({
        msg: "This email already registered",
      });
    }

    const result = await adminUserServices.addNew(
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
    );
    if (result) {
      const uuid = uuidv4();
      const refreshToken = jwtServices.create({ uuid, type: "admin" });
      const accessToken = jwtServices.create(
        { userId: result._id, type: "admin" },
        "5m"
      );
      authIdServices.add(result._id, uuid);
      const sendemail = sendPasswordBymail(email, password);
      if (roleType.role === "QA AGENT") {
        allAgents = await adminUserModel.find({ department });
        const agentIds = allAgents.map((agent) => agent._id);
        const enrollmentsWithAgents = await enrollmentModel.find({
          assignToQa: { $in: agentIds },
        });
        console.log("enrollmentsWithAgents", enrollmentsWithAgents.length);
        await adminUserServices.divideEqually(allAgents, enrollmentsWithAgents);
      }
      return res.status(201).send({
        msg: "User Registered Successfully",
        data: result,
        refreshToken,
        accessToken,
      });
    } else {
      return res.status(400).send({ msg: "User Not Registered!" });
    }
  })
);
adminUserRouter.post(
  "/login",
  expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const user = await adminUserServices.login(email);
    console.log("user", user);
    if (user) {
      const validatePassword = await adminUserServices.validatePassword(
        password,
        user.password
      );
      if (validatePassword) {
        res.status(200).send({
          msg: "Login Successfully",
          data: user,
        });
      } else {
        res.status(401).send({
          msg: "Invalid Credentials!",
        });
      }
    } else {
      res.status(401).send({
        msg: "Invalid Credentials!",
      });
    }
  })
);
adminUserRouter.post(
  "/requestOtp",
  expressAsyncHandler(async (req, res) => {
    const { email } = req.body;
    const otp = OTP();
    console.log(otp);
    const result = await adminUserServices.updateOtp(email, 1111);
    if (result) {
      //const sendMail = await sendEmail(email, otp);
      //   if (!sendMail) {
      //     res.status(400).json({ msg: "OTP not sent" });
      //   }
      res.status(200).json({ msg: "OTP sent" });
    } else {
      res.status(400).json({ msg: "OTP not sent" });
    }
  })
);
//verify otp
adminUserRouter.post(
  "/verifyOtp",
  expressAsyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    // const validate = verifyOtp.validate(req.body);

    // if (validate.error) {
    //   return next(new ApiError(validate.error, 400));
    // }
    if (!email || !otp) {
      return res.status(400).send({ msg: "field missing" });
    }
    const verifyExpireOtp = await adminUserServices.otpExpiryValidation(email);
    console.log(verifyExpireOtp);
    if (!verifyExpireOtp) {
      res.status(400).send({
        msg: "Otp Expire please try again!",
      });
    } else {
      const verifyOtp = await adminUserServices.verifyOTP(email, otp);

      if (verifyOtp) {
        res.status(200).send({ msg: "OTP Verified" });
      } else {
        res.status(400).send({ msg: "Invalid OTP" });
      }
    }
  })
);

//reset password
adminUserRouter.post(
  "/resetPassword",
  expressAsyncHandler(async (req, res) => {
    const { email, newPassword, reEnterPassword } = req.body;
    const User = await adminUserServices.isUser(email);
    if (!User) {
      return res.status(400).send({ msg: "User doesnt exixt" });
    }
    if (newPassword !== reEnterPassword) {
      return res.status(400).send({ msg: "Passwords Don't Match" });
    }

    const user = await adminUserServices.verifyCodeAndResetPassword(
      User,
      newPassword
    );

    if (!user) {
      return res
        .status(400)
        .send({ msg: "Invalid or expired verification code" });
    }

    return res.status(200).send({ msg: "Password reset successfully" });
  })
);

//forgot password
adminUserRouter.post(
  "/forgotPassword",
  expressAsyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await adminUserServices.isUser(email);

    if (!user) {
      return res.status(400).send({ msg: "User not found" });
    }

    // Generate a unique 6-digit verification code
    const verificationCode = await adminUserServices.generateVerificationCode();

    // Set the code and expiration time in the user's document
    user.verificationCode = verificationCode;
    user.otpExpire = new Date(Date.now() + 6000000); // 20 minutes expiration

    // Store the verification code in a separate column in the database
    user.code = verificationCode; // Assuming 'token' is the name of the column
    await user.save();

    // Send the verification code email
    const sendEmailResult = await adminUserServices.sendVerificationCodeByEmail(
      email,
      verificationCode
    );

    if (sendEmailResult) {
      return res.status(200).send({ msg: "Verification code sent" });
    } else {
      return res.status(500).send({ msg: "Failed to send verification code" });
    }
  })
);

adminUserRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    let {
      company,
      userId,
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
      department,
    } = req.body;

    const result = await adminUserServices.update(
      company,
      userId,
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
    );
    if (result) {
      return res.status(200).send({ msg: "User profile reset", data: result });
    } else {
      return res.status(400).send({ msg: "Failed to reset" });
    }
  })
);
adminUserRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await adminUserServices.delete(userId);
    if (result.deletedCount == 0) {
      return res.status(400).send({ msg: "ID Not found" });
    }
    if (result) {
      return res.status(200).send({ msg: "User deleted.", data: result });
    } else {
      return res.status(400).send({ msg: "User not deleted" });
    }
  })
);
adminUserRouter.get(
  "/getByDepartments",
  expressAsyncHandler(async (req, res) => {
    const { department } = req.query;
    const result = await adminUserServices.getByDepartments(department);
    if (result) {
      res.status(200).send({ msg: "users", data: result });
    } else {
      res.status(400).send({ msg: "users not found" });
    }
  })
);
adminUserRouter.get(
  "/getReportingTo",
  expressAsyncHandler(async (req, res) => {
    const { roleId } = req.query;
    const roleName = await roleModel.findOne({ _id: roleId });
    const roleLevel = await heirarchyService.getHeirarchyName(roleName.role);
    const targetRoleLevel = roleLevel.level + 1;
    const targetRoleName = await hierarchyModel.findOne({
      level: targetRoleLevel,
    });
    const roleFind = await roleModel.findOne({ role: targetRoleName.role });
    const users = await adminUserModel.find({ role: roleFind._id });
    console.log(users);
    if (users) {
      res
        .status(200)
        .send({ msg: "users with one level higher", result: users });
    } else {
      res.status(400).send({ msg: "no user found with one level higher" });
    }
  })
);

adminUserRouter.get(
  "/getRejectUser",
  expressAsyncHandler(async (req, res) => {
    const { department, roleId } = req.query;
    let targetRole;
    let dep = await departmentService.getDepById(department);
    console.log(dep);
    const result = await adminUserServices.getByDepartments(department);
    console.log("users", result);
    const roleName = await roleModel.findOne({ _id: roleId });
    const roleLevel = await heirarchyService.getHeirarchyName(roleName.role);
    if (
      (roleLevel.level === 5 && dep.department == "RETENTION") ||
      dep.department == "retention"
    ) {
      targetRole = await hierarchyModel.find({
        level: { $gt: roleLevel.level },
      });
    } else {
      targetRole = await hierarchyModel.find({
        level: { $lt: roleLevel.level },
      });
    }
    console.log("target roles", targetRole);
    const role = targetRole.map((roles) => roles.role);
    console.log("extracted roles", role);
    const filderedRole = await roleModel.find({ role: { $in: role } });
    console.log(filderedRole);
    const userMap = filderedRole.map((roles) => roles._id);
    console.log(userMap);
    const userMapStrings = userMap.map((id) => id.toString());

    const users = result.filter((usr) => {
      const userRoleIdAsString = usr.role._id.toString();
      return userMapStrings.includes(userRoleIdAsString);
    });
    console.log(users);
    if (users) {
      res
        .status(200)
        .send({ msg: "users with one level higher", result: users });
    } else {
      res.status(400).send({ msg: "no user found with one level higher" });
    }
  })
);

adminUserRouter.put(
  "/leaveStatus",
  expressAsyncHandler(async (req, res) => {
    let { userId, isOnLeave } = req.body;
    const result = await adminUserServices.leaveStatus(userId, isOnLeave);
    if (result) {
      if (isOnLeave === true) {
        let enrollments = await enrollmentModel.find({
          assignToQa: userId,
          approvedBy: { $exists: false },
        });
        console.log(enrollments.length);

        if (enrollments.length > 0) {
          const qaAgents = await adminUserModel.find({
            role: new mongoose.Types.ObjectId("653617d72bbe16a3c99fa001"),
            isOnLeave: false,
          });
          if (qaAgents.length === 0) {
            console.log("No QA Agents found.");
            return;
          }
          let allAgents = await adminUserModel.find({
            department: result.department,
            isOnLeave: false,
          });
          console.log(allAgents.length);
          await adminUserServices.divideEqually(allAgents, enrollments);
        }
      }
      res.status(200).send({ msg: "users", data: result });
    } else {
      res.status(400).send({ msg: "users not found" });
    }
  })
);

//random password genrater with "Password must have at least:1 uppercase letter,1 lowercase letter,1 number and 1 special character"
function generateRandomPassword() {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numericChars = "0123456789";
  const specialChars = "!@#$%^&*";

  const allChars =
    uppercaseChars + lowercaseChars + numericChars + specialChars;

  const length = Math.floor(Math.random() * 3) + 8; // Random length between 8 and 10
  let password = "";

  // Ensure at least one of each required character type
  password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
  password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
  password += numericChars[Math.floor(Math.random() * numericChars.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];

  // Generate the rest of the password
  for (let i = 4; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars.charAt(randomIndex);
  }

  // Shuffle the password to randomize the character order
  password = shuffleString(password);

  return password;
}

// Shuffle the characters in a string (Fisher-Yates shuffle)
function shuffleString(string) {
  const array = string.split("");
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join("");
}

module.exports = adminUserRouter;
