const expressAsyncHandler = require("express-async-handler");
const authIdServices = require("../auth/authIdServices");
const service = require("./service");
const servicemodel = require("../serviceProvider/model");
const jwtService = require("../utils/jwtServices");
const {
  createNew,
  login,
  validatePassword,
  verifyOtp,
} = require("./validator");
const { v4: uuidv4 } = require("uuid");
const OTP = require("../utils/OTP");
const ApiError = require("../helpers/apiError");

// Define a function to send the verification code via email

//get all super admin panel user
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.get();
  res.status(200).send({ msg: "users", data: result });
});
exports.inActive = expressAsyncHandler(async (req, res) => {
  const result = await service.inActive();
  res.status(200).send({ msg: "users", data: result });
});
exports.userDetails = expressAsyncHandler(async (req, res) => {
  let { userId } = req.query;
  const result = await service.getByUserID(userId);
  if (result) {
    return res.status(200).send({ msg: "user", data: result });
  } else {
    return res.status(400).send({ msg: "User Not Found" });
  }
});

exports.create = expressAsyncHandler(async (req, res, next) => {
  const { role, firstName, lastName, email, password, contact } = req.body;
  const validate = createNew.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const result = await service.addNew(
    role,
    firstName,
    lastName,
    email,
    password,
    contact
  );
  if (result) {
    const uuid = uuidv4();
    const refreshToken = jwtService.create({ uuid, type: "superAdmin" });
    const accessToken = jwtService.create(
      { userId: result._id, type: "superAdmin" },
      "5m"
    );
    authIdServices.add(result._id, uuid);
    return res.status(200).send({
      msg: "User Register successfully",
      data: result,
      accessToken,
      refreshToken,
    });
  } else {
    return res.status(400).send({ msg: "User Not added" });
  }
});
//login
exports.login = expressAsyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const validate = login.validate(req.body);
  if (validate.error) {
    return next(new ApiError(validate.error, 400));
  }
  const user = await service.login(email);
  console.log(user);
  if (user) {
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
  console.log(otp);
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
exports.verifyOtp = expressAsyncHandler(async (req, res, next) => {
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
exports.resetPassword = expressAsyncHandler(async (req, res, next) => {
  const { email, newPassword, reEnterPassword } = req.body;
  const User = await service.isUser(email);
  if (!User) {
    return res.status(400).send({ msg: "User doesnt exixt" });
  }
  if (newPassword !== reEnterPassword) {
    return res.status(400).send({ msg: "Passwords Don't Match" });
  }

  const user = await service.verifyCodeAndResetPassword(User, newPassword);

  if (!user) {
    return res
      .status(400)
      .send({ msg: "Invalid or expired verification code" });
  }

  return res.status(200).send({ msg: "Password reset successfully" });
});

//forgot password
exports.forgotPassword = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await service.isUser(email);

  if (!user) {
    return res.status(400).send({ msg: "User not found" });
  }

  // Generate a unique 6-digit verification code
  const verificationCode = await service.generateVerificationCode();

  // Set the code and expiration time in the user's document
  user.verificationCode = verificationCode;
  user.otpExpire = new Date(Date.now() + 600000); // 20 minutes expiration

  // Store the verification code in a separate column in the database
  user.code = verificationCode; // Assuming 'token' is the name of the column
  await user.save();

  // Send the verification code email
  const sendEmailResult = await service.sendVerificationCodeByEmail(
    email,
    verificationCode
  );

  if (sendEmailResult) {
    return res.status(200).send({ msg: "Verification code sent" });
  } else {
    return res.status(500).send({ msg: "Failed to send verification code" });
  }
});
//update profile
exports.updateProfile = expressAsyncHandler(async (req, res) => {
  const { userId, roleId, firstName, lastName, contact } = req.body;
  const result = await service.update(
    userId,
    roleId,
    firstName,
    lastName,
    contact
  );
  if (result) {
    return res.status(200).send({ msg: "User profile reset", data: result });
  } else {
    return res.status(400).send({ msg: "Failed to reset" });
  }
});
//update status
exports.updateStatus = expressAsyncHandler(async (req, res) => {
  const { userId, status } = req.body;
  const result = await service.updateStatus(userId, status);
  if (result) {
    return res.status(200).send({ msg: "User status reset", data: result });
  } else {
    return res.status(400).send({ msg: "Failed to reset" });
  }
});
//delete user
exports.delete = expressAsyncHandler(async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  const result = await service.delete(userId);
  if (result.deletedCount == 0) {
    return res.status(400).send({ msg: "ID Not found" });
  }
  if (result) {
    return res.status(200).send({ msg: "User deleted.", data: result });
  } else {
    return res.status(400).send({ msg: "User not deleted" });
  }
});
//refresh Token
exports.refreshToken = expressAsyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const verifyToken = jwtService.authenticate(refreshToken);
  if (verifyToken) {
    const { uuid, type } = verifyToken;
    const AuthId = await authIdServices.findByUUID(uuid);
    if (AuthId) {
      const { userId } = AuthId;
      if (userId) {
        const token = jwtService.createNew({ userId, type }, "5m");
        res.status(200).send({ msg: "", data: { token } });
      } else {
        res.status(401).send({ msg: "Login please" });
      }
    } else {
      res.status(401).send({ msg: "Login please" });
    }
  } else {
    res.status(401).send({ msg: "Login please" });
  }
});
