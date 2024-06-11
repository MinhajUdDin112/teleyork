const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const service = require("./service");
const authIdServices = require("../auth/authIdServices");
const jwtService = require("../utils/jwtServices");
const {   createNew,login,validatePassword,verifyOtp } = require("./validator");
const ApiError = require("../helpers/apiError");
const OTP = require("../utils/OTP");
const { v4: uuidv4 } = require("uuid");
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.get();
  res.status(200).send({ msg: "Service providers", data: result });
});
exports.inActive = expressAsyncHandler(async (req, res) => {
  const result = await service.inActive();
  res.status(200).send({ msg: "Service providers", data: result });
});
exports.getOne = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  console.log(id)
  const result = await service.getByUserID(id);
  if (result) {
    return res.status(200).send({ msg: "Service provider", data: result });
  } else {
    return res.status(400).send({ msg: "Service provider not found" });
  }
});
exports.updateStatus=expressAsyncHandler(async (req, res) => {
  const { id, updatedBy,status} = req.body;
  console.log(req.body)
  const result = await service.updateStatus(id,updatedBy,status);
  if (result) {
    return res.status(200).send({ msg: "Success", data: result });
  } else {
    return res.status(400).send({ msg: "Failed!" });
  }
});
exports.create = expressAsyncHandler(async (req, res, next) => {
  const {
    name,
    alias,
    type,
    url,
    email,
    password,
    phone,
    zipCode,
    country,
    state,
    subDomain,
    EIN,
    createdBy,
    address,
  } = req.body;
  const validate = createNew.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const result = await service.addNew(
    name,
    alias,
    type,
    url,
    email,
    password,
    phone,
    zipCode,
    country,
    state,
    subDomain,
    EIN,
    createdBy,
    address
  );
  if (result) {
    return res
      .status(201)
      .send({ msg: "Service provider added.",
       data: result,
     });
  } else {
    return res.status(400).send({ msg: "Service provider not added" });
  }
});

exports.update = expressAsyncHandler(async (req, res, next) => {
  const {
    id,
    name,
    alias,
    type,
    url,
    email,
    phone,
    zipCode,
    country,
    state,
    subDomain,
    EIN,
    updatedBy,
    address,
  } = req.body;
//   const validate = updateProvider.validate(req.body);
//   if (validate.error) {
//     return next(new ApiError(validate.error, 400));
//   }
  const result = await service.update(
    id,
    name,
    alias,
    type,
    url,
    email,
    phone,
    zipCode,
    country,
    state,
    subDomain,
    EIN,
    updatedBy,
    address
  );
  if (result) {
    return res
      .status(200)
      .send({ msg: "Service provider profile updated.", data: result });
  } else {
    return res.status(400).send({ msg: "Service provider profile not updated" });
  }
});

exports.delete = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  const result = await service.delete(id);
  if (result.deletedCount == 0) {
    return res.status(400).send({ msg: "ID Not found" });
  }
  if (result) {
    return res
      .status(200)
      .send({ msg: "Service provider deleted", data: result });
  } else {
    return res.status(400).send({ msg: "Service provider not deleted" });
  }
});
//login
exports.login = expressAsyncHandler(async (req, res,next) => {
  const { email, password } = req.body;
  const validate = login.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  // const isActive=await service.isActive(email)
  // if (!isActive) {
  //   return res
  //     .status(400)
  //     .send({ msg: "Service Provider currently not active" });
  // }
  const user = await service.login(email);
  console.log(user);
  if (user) {
    if (!user.active) {
      return res
        .status(400)
        .send({ msg: "Service Provider currently not active" });
    }
    const validatePassword = await service.validatePassword(
      password,
      user.password
    );
    if (validatePassword) {
      res.status(200).send({
        msg: "Logged in Successfully",
        data: user,
      });
    } else {
      res.status(400).send({
        msg: "Invalid Credentials!",
      });
    }
  } else {
    res.status(400).send({
      msg: "Invalid Credentials!",
    });
  }
});
//request otp
exports.requestOtp = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;
  const otp = OTP();
  console.log(otp)
  const result = await service.updateOtp(email, 1111);
  if (result) {
    //const sendMail = await sendEmail(email, otp);
    //   if (!sendMail) {
    //     res.status(400).json({ msg: "OTP not sent" });
    //   }
    res.status(200).json({ msg: "OTP sent" });
  } else {
    res.status(400).json({ msg: "OTP not sent" });
  }
});
//verify otp
exports.verifyOtp = expressAsyncHandler(async (req, res,next) => {
  const { email, otp } = req.body;
  const validate = verifyOtp.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const verifyExpireOtp = await service.otpExpiryValidation(email);
  if (!verifyExpireOtp) {
    res.status(400).send({
      msg: "Otp Expire please try again!",
    });
  } else {
    const verifyOtp = await service.verifyOTP(email, otp);
    if (verifyOtp) {
      res.status(200).send({ msg: "OTP Verified" });
    } else {
      res.status(400).send({ msg: "Invalid OTP" });
    }
  }
});
//reset password
exports.resetPassword = expressAsyncHandler(async (req, res,next) => {
  const { id, password, reEnterPassword } = req.body;
  if (password !== reEnterPassword) {
    return res.status(400).send({ msg: "Passwords Don't Match" });
  }
  const validate = validatePassword.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const result = await service.setNewPassword(userId, password);
  if (result) {
    res.status(200).json({ msg: "Password reset!", data: result });
  } else {
    res.status(400).json({ msg: "password failed to reset" });
  }
});
//forgot password
exports.forgotPassword = expressAsyncHandler(async (req, res) => {
  const { email, password, reEnterPassword } = req.body;
  if (!email || !password || !reEnterPassword) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  if (password !== reEnterPassword) {
    res.status(400).send({
      msg: "Password And reEnterPassword don't Match",
    });
  }
  const result = await service.forgotPassword(email, password);
  if (result) {
    return res.status(200).send({ msg: "Password Updated", data: result });
  } else {
    return res.status(400).send({ msg: "Password not Updated" });
  }
});
//update profile
exports.updateProfile = expressAsyncHandler(async (req, res) => {
  const { userId, roleId, name, alias, type, cnic, contact, address }=req.body;
  const result = await service.update(
    userId,
    roleId,
    name,
    alias,
    type,
    cnic,
    contact,
    address
  );
  if (result) {
    return res.status(200).send({ msg: "User profile reset", data: result });
  } else {
    return res.status(400).send({ msg: "Failed to reset" });
  }
});
// get SP detail by subDomain
exports.getSPdetailByDomain = expressAsyncHandler(async (req, res) => {
  const { subDomain } = req.query;
  const result = await service.getSPdetailByDomain(subDomain);
  if (result) {
    return res.status(200).send({ msg: "Service provider", data: result });
  } else {
    return res.status(400).send({ msg: "Service provider not found" });
  }
});
//delete user
exports.delete = expressAsyncHandler(async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  const result = await service.delete(id);
  if (result.deletedCount == 0) {
    return res.status(400).send({ msg: "ID Not found" });
  }
  if (result) {
    return res.status(200).send({ msg: "User deleted.", data: result });
  } else {
    return res.status(400).send({ msg: "User not deleted" });
  }
});
