const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const service = require("./service");
const passwordValidator = require("../utils/passwordValidator");
const { v4: uuidv4 } = require("uuid");
const { enrollmentId, SixDigitUniqueId } = require("../utils/enrollmentId");
const UspsService = require("../pwg/UspsService");
const acpService = require("../acpPrograms/service");
const serviceAreaServices = require("../serviceArea/service");
const zipService = require("../zipCodes/zipCodeService");
const sacService = require("../sacNumber/sacService");
const depModel = require("../departments/departmentModel");
const adminUserModel = require("../adminUser/adminUserModel");
const adminService = require("../adminUser/adminUserServices");
const model = require("../user/model");

const xml2js = require("xml2js");
const {
  verifyZip,
  initialInformation,
  homeAddressValidation,
  question,
  selectProgram,
  selectPlan,
  handOver,
  termsAndConditions,
} = require("./validator");
const AppError = require("../helpers/apiError");
const expressAsyncHandler = require("express-async-handler");
exports.getAll = expressAsyncHandler(async (req, res) => {
  const { serviceProvider } = req.query;
  console.log(serviceProvider);
  const result = await service.get(serviceProvider);
  res.status(200).send({ msg: "users", data: result });
});
exports.getOne = expressAsyncHandler(async (req, res) => {
  let { userId } = req.query;
  const result = await service.getByUserID(userId);
  if (result) {
    return res.status(200).send({ msg: "user", data: result });
  } else {
    return res.status(400).send({ msg: "User Not Found" });
  }
});
exports.verifyZip = expressAsyncHandler(async (req, res, next) => {
  let { serviceProvider, carrier, zipCode, email } = req.body;

  const validate = verifyZip.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }

  let enrollment = enrollmentId();
  // const isService = await serviceAreaServices.isServiceZipCode(
  //   carrier,
  //   zipCode
  // );
  // if (!isService) {
  //   return res.status(400).send({
  //     msg: "We're sorry, but your zip code is not currently in our service area",
  //   });
  // }

  const xmlData = `
  <?xml version="1.0" encoding="utf-8"?>
							<wholeSaleApi xmlns="https://oss.vcarecorporation.com:22712/api/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
								<session>
									<clec>
										<id>1002</id>
										<agentUser>
										<username>${process.env.PWG_USERNAME}</username>
										<token>${process.env.PWG_TOKEN}</token>
										<pin>${process.env.PWG_PIN}</pin>
										</agentUser>
									</clec>
								</session>
								<request type="GetCoverage">
									<carrier>TMB</carrier>
									<zip>${zipCode}</zip>
								</request>
							</wholeSaleApi>	
`;
  console.log("here");
  // Parse the XML data
  const serverUrl = "https://oss.vcarecorporation.com:22712/api/"; // Replace with your server URL

  // Define request headers for XML content
  const headers = {
    "Content-Type": "application/xml",
  };

  // Send the XML request
  await axios
    .post(serverUrl, xmlData, { headers })
    .then(async (response) => {
      // Handle the server response here
      console.log("Server Response:", response.data);

      const responseData = await xml2js.parseStringPromise(response.data, {
        explicitArray: false,
      });
      console.log("Server Response:", response.data);
      const zipCode = responseData.wholeSaleApi.response.zip;
      const statusCode = responseData.wholeSaleApi.response.statusCode;
      console.log("zipcode: ", zipCode);
      if (statusCode === "00" && zipCode) {
        const zipdetails = await zipService.getCityAndStateByZip(zipCode);
        const city = zipdetails.city;
        const state = zipdetails.abbreviation;
        const sacnumber = await sacService.getCityByState(state);
        if (!sacnumber) {
          return res
            .status(400)
            .send({ msg: "sac code not verified for this state" });
        }
        console.log(sacnumber);
        const sac = sacnumber.sac;
        console.log(sac);
        const result = await service.addUserZip(
          serviceProvider,
          carrier,
          email,
          zipCode,
          enrollment,
          city,
          state,
          sac
        );
        if (result) {
          return res.status(200).send({
            msg: "Congratulation  you zip code exist in our service area",
            data: result,
          });
        } else {
          return res.status(400).send({ msg: "Not verify zip code!" });
        }
      } else {
        return res.status(400).send({
          msg: "We're sorry, but your zip code is not currently in our service area",
        });
      }
    })
    .catch((error) => {
      // Handle errors here
      console.error("Error:", error);
      return res.status(500).send(error);
    });
  console.log("here now");

  // const result = await service.addUserZip(
  //   serviceProvider,
  //   carrier,
  //   email,
  //   zipCode,
  //   enrollment
  // );
  // if (result) {
  //   return res.status(201).send({
  //     msg: "Congratulation  you zip code exist in our service area",
  //     data: result,
  //   });
  // } else {
  //   return res.status(400).send({ msg: "Not verify zip code!" });
  // }
});
exports.PWGverifyZip = expressAsyncHandler(async (req, res, next) => {
  let { serviceProvider, carrier, zipCode, email, accountType } = req.body;
  if (!serviceProvider || !carrier || !zipCode || !email || !accountType) {
    return res.status(400).send({
      msg: "serviceProvider or carrier or zipCode or email or accountType is missing",
    });
  }

  let enrollment = enrollmentId();
  let accountId = SixDigitUniqueId();
  const xmlData = `
  <?xml version="1.0" encoding="utf-8"?>
  <wholeSaleApi xmlns="https://oss.vcarecorporation.com:22712/api/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
      <clec>
        <id>1002</id>
        <agentUser>
          <username>${process.env.PWG_USERNAME}</username>
          <token>${process.env.PWG_TOKEN}</token>
          <pin>${process.env.PWG_PIN}</pin>
        </agentUser>
      </clec>
    </session>
    <request type="GetCoverage">
      <carrier>TMB</carrier>
      <zip>${zipCode}</zip>
    </request>
  </wholeSaleApi>`;

  console.log("here");

  const serverUrl = "https://oss.vcarecorporation.com:22712/api/";

  const headers = {
    "Content-Type": "application/xml",
  };

  await axios
    .post(serverUrl, xmlData, { headers })
    .then(async (response) => {
      console.log("Server Response:", response.data);

      const responseData = await xml2js.parseStringPromise(response.data, {
        explicitArray: false,
      });

      const zipCode = responseData.wholeSaleApi.response.zip;
      const statusCode = responseData.wholeSaleApi.response.statusCode;

      console.log("zipcode: ", zipCode);
      if (statusCode === "00" && zipCode) {
        const zipdetails = await zipService.getCityAndStateByZip(zipCode);
        const city = zipdetails.city;
        const state = zipdetails.abbreviation;
        // const sacnumber = await sacService.getCityByState(state);
        // if (!sacnumber) {
        //   return res
        //     .status(400)
        //     .send({ msg: "sac code not verified for this state" });
        // }
        // console.log(sacnumber);
        // const sac = sacnumber.sac;
        // console.log(sac);
        if (accountType === "ACP") {
          const sacnumber = await sacService.getCityByState(
            state,
            serviceProvider
          );
          if (!sacnumber) {
            return res
              .status(400)
              .send({ msg: "sac not verified for this state" });
          }
          console.log(sacnumber);
          const sac = sacnumber.sac;
          console.log(sac);

          const body = {
            serviceProvider,
            carrier,
            zipCode,
            enrollment,
            city,
            state,
            sac,
            email,
            accountId,
            accountType,
          };

          // Call the service function with sac parameter
          result = await service.addUserZipCode(body);
        } else {
          const body = {
            serviceProvider,
            carrier,
            zipCode,
            enrollment,
            city,
            state,
            email,
            accountId,
            accountType,
          };

          // Call the service function with sac parameter
          result = await service.addUserZipCode(body);
        }
        if (result) {
          return res.status(200).send({
            msg: "Congratulation  you zip code exist in our service area",
            data: result,
          });
        } else {
          return res.status(400).send({ msg: "Not verify zip code!" });
        }
      } else {
        return res.status(400).send({ msg: "Not verified zip code!" });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      return res.status(500).send(error);
    });

  console.log("here now");
});
//verify zip through DB
exports.DBverifyzip = expressAsyncHandler(async (req, res) => {
  let { serviceProvider, carrier, zipCode, email, accountType } = req.body;
  let result = await zipService.getCityAndStateByZip(zipCode);

  if (result) {
    const city = result.city;
    const state = result.abbreviation;
    let enrollment = enrollmentId();
    let accountId = SixDigitUniqueId();
    if (accountType === "ACP") {
      const sacnumber = await sacService.getCityByState(state, serviceProvider);
      if (!sacnumber) {
        return res.status(400).send({ msg: "sac not verified for this state" });
      }
      console.log(sacnumber);
      const sac = sacnumber.sac;
      console.log(sac);

      const body = {
        serviceProvider,
        carrier,
        zipCode,
        enrollment,
        //csr,
        city,
        state,
        sac,
        email,
        accountId,
        accountType,
      };

      // Call the service function with sac parameter
      result = await service.addUserZipCode(body);
    } else {
      const body = {
        serviceProvider,
        carrier,
        zipCode,
        enrollment,
        //csr,
        city,
        state,
        email,
        accountId,
        accountType,
      };

      // Call the service function with sac parameter
      result = await service.addUserZipCode(body);
    }
    return res.status(200).send({ msg: "zip code Available", data: result });
  } else {
    return res.status(400).send({ msg: "Zip Code Not Found" });
  }
});
// verify zipCode
exports.selfVerifyZip = expressAsyncHandler(async (req, res, next) => {
  let { serviceProvider, carrier, zipCode, accountType, email } = req.body;
  if (!serviceProvider || !carrier || !zipCode || !accountType || !email) {
    return res.status(400).send({
      msg: "serviceProvider or carrier or zipCode or accountType or email field missing",
    });
  }

  var result;

  // const validate = verifyZip.validate(req.body);
  // if (validate.error) {
  //   return next(new AppError(validate.error, 400));
  // }

  let enrollment = enrollmentId();
  let accountId = SixDigitUniqueId();
  const uspsApiResponse = await UspsService.uspsAccessToken();
  console.log(uspsApiResponse.data.access_token);
  const uspsStateCity = await UspsService.uspsStateCity(
    zipCode,
    uspsApiResponse.data.access_token
  );
  const city = uspsStateCity.data.city;
  const state = uspsStateCity.data.state;
  console.log(uspsStateCity.data);

  if (uspsStateCity.status === 400) {
    return res
      .status(uspsStateCity.status)
      .send({ msg: "invalid", data: uspsStateCity.data.message });
  }

  if (accountType === "ACP") {
    const sacnumber = await sacService.getCityByState(state, serviceProvider);
    if (!sacnumber) {
      return res.status(400).send({ msg: "sac not verified for this state" });
    }
    console.log(sacnumber);
    const sac = sacnumber.sac;
    console.log(sac);

    const body = {
      serviceProvider,
      carrier,
      zipCode,
      enrollment,
      //csr,
      city,
      state,
      sac,
      //department,
      accountId,
      email,
      accountType,
    };

    // Call the service function with sac parameter
    result = await service.addUserZipCode(body);
  } else {
    const body = {
      serviceProvider,
      carrier,
      zipCode,
      enrollment,
      //csr,
      city,
      state,
      //department,
      accountId,
      email,
      accountType,
    };

    // Call the service function with sac parameter
    result = await service.addUserZipCode(body);
  }

  if (result) {
    return res.status(200).send({
      msg: "Congratulations, your zip code exists in our service area",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Unable to verify zip code!" });
  }
});
exports.initialInformation = expressAsyncHandler(async (req, res, next) => {
  let {
    userId,
    firstName,
    middleName,
    lastName,
    suffix,
    SSN,
    DOB,
    contact,
    isDifferentPerson,
    BenifitFirstName,
    BenifitMiddleName,
    BenifitLastName,
    BenifitSSN,
    BenifitDOB,
  } = req.body;

  if (isDifferentPerson == true) {
    if (!BenifitFirstName || !BenifitLastName || !BenifitSSN || !BenifitDOB) {
      return res.status(400).send({ msg: "field missing" });
    }
    const birthDate = new Date(BenifitDOB);
    const currentDate = new Date();
    const age = currentDate.getFullYear() - birthDate.getFullYear();

    if (age < 18) {
      return next(
        new AppError("bqp must be at least 18 years old to proceed.", 400)
      );
    }
  } else {
    BenifitFirstName = "";
    BenifitLastName = "";
    BenifitMiddleName = "";
    BenifitSSN = "";
    BenifitDOB = "";
  }
  const validate = initialInformation.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }

  const birthDate = new Date(DOB);
  const currentDate = new Date();
  const age = currentDate.getFullYear() - birthDate.getFullYear();

  if (age < 18) {
    return next(
      new AppError("You must be at least 18 years old to proceed.", 400)
    );
  }

  const result = await service.addInitialInformation(
    userId,
    firstName,
    middleName,
    lastName,
    suffix,
    SSN,
    DOB,
    contact,
    isDifferentPerson,
    BenifitFirstName,
    BenifitMiddleName,
    BenifitLastName,
    BenifitSSN,
    BenifitDOB
  );
  if (result) {
    return res.status(201).send({
      msg: "Congratulations! Your basic information has been saved. Thank you for enrolling with us",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed to save basic information!" });
  }
});
exports.homeAddress = expressAsyncHandler(async (req, res, next) => {
  let {
    userId,
    city,
    address1,
    address2,
    state,
    zip,
    isTerribleTerritory,
    isBillAddress,
    mallingAddress1,
    mallingAddress2,
    mallingZip,
    mallingState,
    mallingCity,
  } = req.body;

  if (isBillAddress === true) {
    if (!mallingAddress1 || !mallingZip || !mallingState || !mallingCity) {
      return res.status(400).send({
        msg: "field missing: mailingaddress1 or mailingCity or mailingstate or mailingzip",
      });
    }
  } else {
    mallingAddress1 = "";
    mallingAddress2 = "";
    mallingZip = "";
    mallingState = "";
    mallingCity = "";
  }

  const validate = homeAddressValidation.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  // const isBeneficiaryAddress = await service.checkBeneficiaryAddress1(
  //   city,
  //   address1,
  //   address2,
  //   state
  // );
  // if (isBeneficiaryAddress) {
  //   return res.status(400).send({
  //     msg: "This home address already in beneficiary list!",
  //   });
  // }
  const result = await service.homeAddress(
    userId,
    city,
    address1,
    address2,
    state,
    zip,
    isTerribleTerritory,
    isBillAddress,
    mallingAddress1,
    mallingAddress2,
    mallingZip,
    mallingState,
    mallingCity
  );
  if (result) {
    return res.status(201).send({
      msg: "Home address information has been saved successfully",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed to save home information!" });
  }
});
exports.acpProgram = expressAsyncHandler(async (req, res, next) => {
  let { userId, program } = req.body;
  const validate = selectProgram.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  const acpProgram = await acpService.getOne(program);
  const userInfo = await service.getByUserID(userId);
  if (acpProgram && userInfo) {
    //const verify=await service.verifyUser(userInfo,program);
    //const illegible=verify.status==='201'?true:false
    const updateInfo = await service.acpProgram(userId, program);
    if (
      //verify.status==='201'
      updateInfo
    ) {
      return res.status(201).send({
        msg: "Success",
        data: updateInfo,
      });
    } else {
      return res.status(400).send({ msg: "Failed!" });
    }
  } else {
    return res.status(400).send({ msg: "Failed !" });
  }
});
exports.termsAndConditions = expressAsyncHandler(async (req, res, next) => {
  let { userId } = req.body;
  const validate = termsAndConditions.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  const result = await service.termsAncConditions(userId);
  if (result) {
    return res.status(201).send({
      msg: "Added",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed !" });
  }
});
exports.selectPlan = expressAsyncHandler(async (req, res, next) => {
  let { userId, plan } = req.body;
  const validate = selectPlan.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  const result = await service.plan(userId, plan);
  if (result) {
    return res.status(201).send({
      msg: "Added",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed !" });
  }
});
exports.selectInventory = expressAsyncHandler(async (req, res, next) => {
  let { userId, inventoryId } = req.body;
  if (!userId || !inventoryId) {
    return res.status(400).send({ msg: "userId or inventoryId missing" });
  }
  const result = await service.selectInventory(userId, inventoryId);
  if (result) {
    return res.status(201).send({
      msg: "Added",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed !" });
  }
});

// submit to supervision
exports.selfEnromentSubmit = expressAsyncHandler(async (req, res, next) => {
  let { userId } = req.body;
  if (!userId) {
    return res.status(400).send({ msg: "userId required" });
  }
  console.log(userId);
  const enrollment = await service.getByUserID(userId);
  const company = enrollment.serviceProvider;
  console.log(company);
  let department = await depModel.findOne({
    company,
    _id: new mongoose.Types.ObjectId("653c1e38e97d778ab7566611"),
  });
  console.log("department", department);
  const result = await service.selfEnromentSubmit(userId, department._id);
  if (result) {
    return res.status(201).send({
      msg: "Success",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed!" });
  }
});
exports.selfEnromentPrepaidSubmit = expressAsyncHandler(
  async (req, res, next) => {
    let { userId } = req.body;
    if (!userId) {
      return res.status(400).send({ msg: "userId required" });
    }
    console.log(userId);
    const enrollment = await service.getByUserID(userId);
    const result = await service.selfEnromentPrepaidSubmit(userId);
    if (result) {
      return res.status(201).send({
        msg: "Success",
        data: result,
      });
    } else {
      return res.status(400).send({ msg: "Failed!" });
    }
  }
);
exports.handOver = expressAsyncHandler(async (req, res, next) => {
  let { csr, userId } = req.body;
  const validate = handOver.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  const result = await service.handOver(csr, userId);
  if (result) {
    return res.status(201).send({
      msg: "Success",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed!" });
  }
});
exports.selfEnrollmentList = expressAsyncHandler(async (req, res) => {
  let { accountType, serviceProvider } = req.query; // The Team Lead for whom you want to show completed enrollments
  const result = await service.selfEnrollmentList(accountType, serviceProvider);
  if (result) {
    res.status(200).send({ msg: "enrollmentList", data: result });
  } else {
    res.status(400).send({ msg: "No selfEnrolment found" });
  }
});
exports.updateStatus = expressAsyncHandler(async (req, res) => {
  const { serviceProvider, id, status } = req.body;
  console.log(req.body);
  const result = await service.updateStatus(serviceProvider, id, status);
  if (result) {
    return res.status(200).send({ msg: "Success", data: result });
  } else {
    return res.status(400).send({ msg: "Failed!" });
  }
});
exports.completeEnrollmentUserList = expressAsyncHandler(async (req, res) => {
  const { userId } = req.query; // The Team Lead for whom you want to show completed enrollments
  console.log(userId);
  const User = await adminService.getByUserID(userId);
  console.log(User);
  const userRole = User.role.role; //get user role
  if (userRole.toUpperCase() === "PROVISION MANAGER") {
    const completedEnrollments = await model
      .find({
        level: { $in: [5, null, []] },
        department: User.department,
        isEnrollmentComplete: true,
        isSelfEnrollment: true,
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

    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing completed enrollments for the Team Lead's reporting CSR(s)",
        data: completedEnrollments,
      });
    } else {
      res.status(201).send({
        msg: "No completed enrollments found for PROVISIONING MANAGER with level 3 or 4 approval.",
      });
    }
  }
});
exports.rejectedEnrollmentUserList = expressAsyncHandler(async (req, res) => {
  const result = await service.rejectedEnrollmentUserList(
    req.query.serviceProvider
  );
  res.status(200).send({
    msg: "Users",
    data: result,
  });
});
exports.inCompleteEnrollmentUserList = expressAsyncHandler(async (req, res) => {
  const result = await service.inCompleteEnrollmentUserList(
    req.query.serviceProvider
  );
  res.status(200).send({
    msg: "Users",
    data: result,
  });
});
exports.proofedEnrollmentUserList = expressAsyncHandler(async (req, res) => {
  const result = await service.proofEnrollmentUserList(
    req.query.serviceProvider
  );
  res.status(200).send({
    msg: "Users",
    data: result,
  });
});
exports.withoutProofedEnrollmentUserList = expressAsyncHandler(
  async (req, res) => {
    const result = await service.withoutProofEnrollmentUserList(
      req.query.serviceProvider
    );
    res.status(200).send({
      msg: "Users",
      data: result,
    });
  }
);

exports.login = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  const user = await service.login(email);
  if (user) {
    const validatePassword = await service.validatePassword(
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
});
exports.sendOtp = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;
  // const otp = OTP();
  let otp = 1111;
  const result = await service.updateOtp(email, otp);
  if (result) {
    // const sendMail = await sendEmail(email, otp);
    // if (!sendMail) {
    //   res.status(400).json({ msg: "OTP not sent" });
    // }
    res.status(200).json({ msg: "OTP sent" });
  } else {
    res.status(400).json({ msg: "OTP not sent" });
  }
});
exports.verifyOtp = expressAsyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const verifyExpireOtp = await service.otpExpiryValidation(email);
  console.log("expire", verifyExpireOtp);
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
exports.resetPassword = expressAsyncHandler(async (req, res) => {
  const { userId, password, reEnterPassword } = req.body;
  console.log(password, reEnterPassword);
  if (password !== reEnterPassword) {
    return res.status(400).send({ msg: "Passwords Don't Match" });
  }
  if (!passwordValidator.schema.validate(password)) {
    return res.status(400).send({
      msg: "Password must have at least:1 uppercase letter,1 lowercase letter,1 number and 1 special character",

      //validator.schema.validate(password, { list: true }),
    });
  }
  const result = await service.setNewPassword(userId, password);
  if (result) {
    res.status(200).json({ msg: "Password reset!", data: result });
  } else {
    res.status(400).json({ msg: "password failed to reset" });
  }
});
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
  if (!passwordValidator.schema.validate(password)) {
    return res.status(400).send({
      msg: "Password must have at least:1 uppercase letter,1 lowercase letter,1 number and 1 special character",

      //validator.schema.validate(password, { list: true }),
    });
  }
  const result = await service.forgotPassword(email, password);
  if (result) {
    return res
      .status(200)
      .send({ msg: "Password has been changed successfully" });
  } else {
    return res.status(400).send({ msg: "Password not Updated" });
  }
});
exports.update = expressAsyncHandler(async (req, res) => {
  let {
    userId,
    firstName,
    middleName,
    lastName,
    SSN,
    suffix,
    contact,
    city,
    address1,
    address2,
    zip,
    state,
    isTemporaryAddress,
    drivingLicense,
    DOB,
    bestWayToReach,
    isSelfReceive,
    isACP,
  } = req.body;
  const result = await service.update(
    userId,
    firstName,
    middleName,
    lastName,
    SSN,
    suffix,
    contact,
    city,
    address1,
    address2,
    zip,
    state,
    isTemporaryAddress,
    drivingLicense,
    DOB,
    bestWayToReach,
    isSelfReceive,
    isACP
  );
  if (result) {
    return res.status(200).send({ msg: "User profile reset", data: result });
  } else {
    return res.status(400).send({ msg: "Failed to reset" });
  }
});
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
