const model = require("./model");
const zipModel = require("../zipCodes/zipCodeModels");
const mongoose = require("mongoose");
const projection = require("../config/mongoProjection");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const jwtServices = require("../utils/jwtServices");
const authIdServices = require("../auth/authIdServices");
const enrollmentId = require("../utils/enrollmentId");
const userStatus = require("../utils/userStatus");
const logService = require("../logs/service");
const axios = require("axios");
const { findOne } = require("../serviceArea/model");
const adminUserModel = require("../adminUser/adminUserModel");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const xlsx = require("xlsx");
const csv = require("csv-parse");
const esnmodel = require("../EsnNumbers/Model");
const deviceStatus = require("../utils/deviceStatus");
const service = {
  addUserZip: async (body) => {
    console.log(body);
    const data = new model({
      serviceProvider: body.serviceProvider,
      carrier: body.carrier,
      csr: body.csr,
      zip: body.zipCode,
      enrollmentId: body.enrollment,
      city: body.city,
      state: body.state,
      sac: body.sac,
      createdBy: body.csr,
      department: body.department,
      accountId: body.accountId,
      level: 1,
    });
    const result = await data.save();
    return result;
  },
  generateVerificationCode: async () => {
    return Math.floor(1000 + Math.random() * 9000);
  },
  get: async (serviceProvider) => {
    const result = await model
      .find(
        { serviceProvider: { $eq: serviceProvider } },
        projection.projection
      )
      .populate("plan")
      .sort({ createdAt: -1 });
    return result;
  },
  isUser: async (email) => {
    const result = await model.findOne({ email }, projection.projection);
    return result;
  },
  getByUserID: async (_id) => {
    const result = await model
      .findById({ _id })
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
        select: "_id name role",
      })
      .populate({
        path: "approval.approvedBy",
        select: { _id: 1, name: 1 },
      })
      .populate("esnId");
    return result;
  },
  validatePassword: async (password, realPassword) => {
    const valid = await bcrypt.compare(password, realPassword);
    return valid;
  },
  passGenerate: async (_id) => {
    const pwgPassword = Math.floor(1000 + Math.random() * 9000);
    const result = await model.updateOne({ _id }, { $set: { pwgPassword } });
  },
  isUserfor: async (contact, enrollmentId, email, serviceProvider) => {
    let result;
    if (contact) {
      result = await model.findOne({
        contact, // Spread the query object here to merge it into the main query
        serviceProvider: serviceProvider,
      });
    } else if (enrollmentId) {
      result = await model.findOne({
        enrollmentId, // Spread the query object here to merge it into the main query
        serviceProvider: serviceProvider,
      });
    } else {
      result = await model.findOne({
        email, // Spread the query object here to merge it into the main query
        serviceProvider: serviceProvider,
      });
    }
    return result;
  },
  verify: async (contact, email, serviceProvider) => {
    if (contact) {
      result = await model.findOne({
        contact, // Spread the query object here to merge it into the main query
        serviceProvider: serviceProvider,
      });
    } else {
      result = await model.findOne({
        email, // Spread the query object here to merge it into the main query
        serviceProvider: serviceProvider,
      });
    }
    return result;
  },
  // Inside the login method
  login: async (email) => {
    const result = await model.findOne({ email: email });

    if (result) {
      const uuid = uuidv4();
      console.log("uuid", uuid);

      // Generate tokens
      const refreshToken = jwtServices.create({ uuid, type: "user" });
      const accessToken = jwtServices.create(
        { userId: result._id, type: "user" },
        "5m"
      );

      // Store refresh token in the database
      authIdServices.add(result._id, uuid);

      // Update user document with access token
      const updatedUser = await model.findOneAndUpdate(
        { _id: result._id },
        { token: accessToken, refreshToken: refreshToken },
        { new: true }
      );

      return updatedUser;
    }

    return result;
  },

  logins: async (contact, serviceProvider) => {
    const result = await model.findOne({
      contact: contact,
      serviceProvider: serviceProvider,
      password: { $exists: true },
    });

    if (result) {
      const uuid = uuidv4();
      console.log("uuid", uuid);

      // Generate tokens
      const refreshToken = jwtServices.create({ uuid, type: "user" });
      const accessToken = jwtServices.create(
        { userId: result._id, type: "user" },
        "15m"
      );

      // Store refresh token in the database
      authIdServices.add(result._id, uuid);

      // Update user document with access token
      const updatedUser = await model.findOneAndUpdate(
        { _id: result._id },
        { token: accessToken, refreshToken: refreshToken },
        { new: true }
      );

      return updatedUser;
    }

    return result;
  },
  updatePdfPath: async (enrollmentId, pdfPath) => {
    try {
      // Find and update the document with the new PDF path
      const result = await model.findOneAndUpdate(
        { _id: enrollmentId },
        { pdfPath: pdfPath },
        { new: true }
      );
      return result;
    } catch (error) {
      console.error("Error updating PDF path:", error);
      throw error;
    }
  },
  updateuserProfile: async ({
    userId,
    firstName,
    lastName,
    alternateContact,
    SSN,
    DOB,
    address1,
    imageUrl,
  }) => {
    const result = await model.findOneAndUpdate(
      { _id: userId },
      {
        firstName,
        lastName,
        alternateContact,
        SSN,
        DOB,
        address1,
        imageUrl,
      },
      { new: true }
    );

    return result;
  },

  addInitialInformation: async (
    csr,
    _id,
    firstName,
    middleName,
    lastName,
    suffix,
    SSN,
    DOB,
    bestWayToReach,
    drivingLicense,
    email,
    contact,
    isReadyToGetServices,
    isSelfReceive,
    isACP,
    ESim,
    BenifitFirstName,
    BenifitMiddleName,
    BenifitLastName,
    BenifitSSN,
    BenifitDOB,
    salesChannel, // Add this line to receive 'salesChannel'
    source,
    accountType,
    maidenMotherName,
    alternateContact,
    izZipVerified
  ) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        firstName,
        middleName,
        lastName,
        suffix,
        SSN,
        DOB,
        bestWayToReach,
        drivingLicense,
        email,
        contact,
        isReadyToGetServices,
        isSelfReceive,
        isACP,
        ESim,
        BenifitFirstName,
        BenifitMiddleName,
        BenifitLastName,
        BenifitSSN,
        BenifitDOB,
        step: 2,
        salesChannel, // Add this line to receive 'salesChannel'
        source,
        accountType,
        maidenMotherName,
        alternateContact,
        izZipVerified,
      },
      { new: true }
    );

    return result;
  },
  getByUnitType: async (serviceProvider, unitType) => {
    try {
      const result = await esnmodel.find({
        serviceProvider,
        unitType,
        status: deviceStatus.AVAILABLE,
      });
      return result;
    } catch (error) {
      console.error("Error during getByUnitType service:", error);
      throw new Error("Internal Server Error");
    }
  },
  homeAddress: async (
    csr,
    _id,
    address1,
    address2,
    zip,
    city,
    state,
    isSameServiceAddress,
    isNotSameServiceAddress,
    isPoBoxAddress,
    mailingAddress1,
    mailingAddress2,
    PoBoxAddress,
    mailingZip,
    mailingCity,
    mailingState,
    poBoxZip,
    poBoxCity,
    poBoxState
  ) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        address1,
        address2,
        zip,
        city,
        state,
        isSameServiceAddress,
        isNotSameServiceAddress,
        isPoBoxAddress,
        mailingAddress1,
        mailingAddress2,
        PoBoxAddress,
        mailingZip,
        mailingCity,
        mailingState,
        poBoxZip,
        poBoxCity,
        poBoxState,
        step: 3,
      },
      { new: true }
    );
    return result;
  },
  question: async (
    csr,
    _id,
    livesWithAnotherAdult,
    hasAffordableConnectivity,
    isSharesIncomeAndExpense
  ) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        livesWithAnotherAdult,
        hasAffordableConnectivity,
        isSharesIncomeAndExpense,
        step: 4,
      },
      { new: true }
    );
    return result;
  },
  q2: async (_id, hasAffordableConnectivity) => {
    const result = await model.findOneAndUpdate(
      { _id },
      { hasAffordableConnectivity },
      { new: true }
    );
    return result;
  },
  q3: async (_id, isSharesIncomeAndExpense) => {
    const result = await model.findOneAndUpdate(
      { _id },
      { isSharesIncomeAndExpense },
      { new: true }
    );
    return result;
  },
  acpProgram: async (csr, _id, acpProgram) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        acpProgram: new mongoose.Types.ObjectId(acpProgram),
        step: 5,
      },
      { new: true }
    );
    console.log(result);
    return result;
  },
  updateStatus: async (serviceProvider, _id, status) => {
    const result = await model.findOneAndUpdate(
      { _id: _id, serviceProvider: serviceProvider },
      { status: status },
      { new: true }
    );
    return result;
  },
  verifyUserInfoByNVS: async (User) => {
    const timestamp = User.DOB;
    const date = timestamp.toISOString().split("T")[0];
    console.log(date);
    if (User.BenifitDOB) {
      const timestampbqp = User.BenifitDOB;
      var dateBQP = timestampbqp.toISOString().split("T")[0];
    } else {
      var dateBQP = "";
    }
    const body = {
      firstName: User.firstName,
      middleName: User.middleName,
      lastName: User.lastName,
      address: User.address1,
      state: User.state,
      city: User.city,
      zipCode: User.zip,
      urbanizationCode: "",
      dob: date,
      ssn4: User.SSN,
      tribalId: "",
      bqpFirstName: User.BenifitFirstName,
      bqpLastName: User.BenifitLastName,
      bqpDob: dateBQP,
      bqpSsn4: User.BenifitSSN,
      bqpTribalId: "",
      eligibilityProgramCode: User.acpProgram.code,
      consentInd: "Y",
      contactPhoneNumber: User.contact,
      contactEmail: User.email,
      contactAddress: User.mailingAddress1,
      contactCity: User.mailingCity,
      contactState: User.mailingState,
      contactZipCode: User.mailingZip,
      contactUrbCode: "",
      repId: "",
      repNotAssisted: "1",
      carrierUrl: "",
    };
    let log;
    try {
      log = await logService.new("/api/web/acpProgram", body);
    } catch (err) {
      console.log(err);
    }
    const username = process.env.NLADID;
    const password = process.env.NLADKEY;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://api.universalservice.org/ebca-svc/consumer/eligibility-check`;
    console.log(url);
    console.log(JSON.stringify(body));
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
    //console.log("data",data.data);
    try {
      logService.updateResponse(log._id, data.data);
    } catch (err) {
      //console.log(err);
    }
    return data.data;
  },
  verifyUser: async (enrollment) => {
    const convertedDate = convertDateToMMDDYYY(enrollment.DOB);
    console.log(convertedDate);
    const timestamp = Date.now();
    const transactionEffectiveDate = convertDateToMMDDYYY(timestamp);
    const serviceInitializationDate = convertSIDateToMMDDYYY(timestamp);
    const convertedDatebqp = convertDateToMMDDYYY(enrollment.BenifitDOB);
    const now = new Date(); // Get the current date and time
    const formattedDate = formatDateToCustomFormat(now);
    console.log(formattedDate);
    console.log(
      "here",
      transactionEffectiveDate,
      serviceInitializationDate,
      convertedDate,
      convertedDatebqp
    );
    const updateDate = await model.findOneAndUpdate(
      { _id: enrollment },
      { transactionEffectiveDate, serviceInitializationDate }
    );
    const body = {
      applicationId: "",
      transactionType: "enroll",
      transactionEffectiveDate: transactionEffectiveDate,
      sac: enrollment.sac,
      lastName: enrollment.lastName,
      firstName: enrollment.firstName,
      middleName: enrollment.middleName,
      phoneNumber: "",
      last4ssn: enrollment.SSN,
      tribalId: "",
      dob: convertedDate,
      serviceType: "MobileBroadband",
      primaryAddress1: enrollment.address1,
      primaryAddress2: enrollment.address2,
      primaryCity: enrollment.city,
      primaryState: enrollment.state,
      primaryZipCode: enrollment.zip,
      primaryUrbanizationCode: "",
      mailingAddress1: enrollment.mailingAddress1,
      mailingAddress2: enrollment.mailingAddress2,
      mailingCity: enrollment.mailingCity,
      mailingState: enrollment.mailingState,
      mailingZipCode: enrollment.mailingZip,
      mailingUrbanizationCode: "",
      serviceInitializationDate: serviceInitializationDate,
      bqpLastName: enrollment.BenifitLastName,
      bqpFirstName: enrollment.BenifitFirstName,
      bqpMiddleName: enrollment.BenifitMiddleName,
      bqpDob: convertedDatebqp,
      bqpLast4ssn: enrollment.BenifitSSN,
      bqpTribalId: "",
      ebbpTribalBenefitFlag: "0",
      etcGeneralUse: "",
      includeSubscriberId: "1",
      repId: "",
      repNotAssisted: "1",
      deviceReimbursementDate: "",
      consumerFee: "1",
      modelNumber: "",
      marketValue: "",
      deviceCopay: "",
      deviceDeliveryMethod: "",
      avpPgrmException: "0",
      schoolLunchException: "0",
      schoolLunchCert: "",
      schoolName: "",
      consumerEmail: enrollment.email,
      contactPhoneNumber: enrollment.contact,
      amsFailureException: "1",
      latitude: "",
      longitude: "",
      dupAddressException: "1",
      eligibilityCode: enrollment.acpProgram.code,
      expectedRate: "",
      acpCertInd: "1",
      consentDateTime: formattedDate,
      consentTimeZoneId: "10",
    };

    if (enrollment.applicationId) {
      console.log("here");
      body.applicationId = enrollment.applicationId;
      body.last4ssn = "";
      body.primaryState = "";
      body.primaryCity = "";
      body.primaryZipCode = "";
      body.primaryAddress1 = "";
      body.primaryAddress2 = "";
      body.bqpDob = "";
      bqpLast4ssn = "";
    }

    // let log;
    // try {
    //   log = await logService.new("/api/web/acpProgram", body);
    // } catch (err) {
    //   console.log(err);
    // }
    const username = process.env.NLADID;
    const password = process.env.NLADKEY;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://api.universalservice.org/ebbp-svc/1/verify`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(JSON.stringify(body));
    //const data = await axios.post(url, JSON.stringify(body), { headers });
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;

    // try {
    //   logService.updateResponse(log._id, data.data);
    // } catch (err) {
    //   //console.log(err);
    // }
    //return data.data;
  },
  enrollUser: async (enrollment) => {
    const convertedDate = convertDateToMMDDYYY(enrollment.DOB);
    const timestamp = Date.now();
    let transactionEffectiveDate = convertDateToMMDDYYY(
      enrollment.transactionEffectiveDate
    );
    let serviceInitializationDate = convertDateToMMDDYYY(
      enrollment.serviceInitializationDate
    );
    if (!enrollment.transactionEffectiveDate) {
      transactionEffectiveDate = convertDateToMMDDYYY(timestamp);
    }
    if (!enrollment.serviceInitializationDate) {
      serviceInitializationDate = convertDateToMMDDYYY(timestamp);
    }
    let nladEnrollmentDate = convertDateToMMDDYYY(timestamp);
    const convertedDatebqp = convertDateToMMDDYYY(enrollment.BenifitDOB);
    const now = new Date();
    const formattedDate = formatDateToCustomFormat(now);
    console.log(formattedDate);
    console.log("here", transactionEffectiveDate, serviceInitializationDate);
    const updateDate = await model.findOneAndUpdate(
      { _id: enrollment },
      { transactionEffectiveDate, serviceInitializationDate }
    );
    const body = {
      applicationId: "",
      transactionType: "enroll",
      transactionEffectiveDate: transactionEffectiveDate,
      sac: enrollment.sac,
      lastName: enrollment.lastName,
      firstName: enrollment.firstName,
      middleName: enrollment.middleName,
      phoneNumber: "",
      last4ssn: enrollment.SSN,
      tribalId: "",
      dob: convertedDate,
      serviceType: "MobileBroadband",
      primaryAddress1: enrollment.address1,
      primaryAddress2: enrollment.address2,
      primaryCity: enrollment.city,
      primaryState: enrollment.state,
      primaryZipCode: enrollment.zip,
      primaryUrbanizationCode: "",
      mailingAddress1: enrollment.mailingAddress1,
      mailingAddress2: enrollment.mailingAddress2,
      mailingCity: enrollment.mailingCity,
      mailingState: enrollment.mailingState,
      mailingZipCode: enrollment.mailingZip,
      mailingUrbanizationCode: "",
      serviceInitializationDate: serviceInitializationDate,
      bqpLastName: enrollment.BenifitLastName,
      bqpFirstName: enrollment.BenifitFirstName,
      bqpMiddleName: enrollment.BenifitMiddleName,
      bqpDob: convertedDatebqp,
      bqpLast4ssn: enrollment.BenifitSSN,
      bqpTribalId: "",
      ebbpTribalBenefitFlag: "0",
      etcGeneralUse: "",
      includeSubscriberId: "1",
      repId: "",
      repNotAssisted: "1",
      deviceReimbursementDate: "",
      consumerFee: "1",
      modelNumber: "",
      marketValue: "",
      deviceCopay: "",
      deviceDeliveryMethod: "",
      avpPgrmException: "0",
      schoolLunchException: "0",
      schoolLunchCert: "",
      schoolName: "",
      consumerEmail: enrollment.email,
      contactPhoneNumber: enrollment.contact,
      amsFailureException: "1",
      latitude: "",
      longitude: "",
      dupAddressException: "1",
      eligibilityCode: enrollment.acpProgram.code,
      expectedRate: "",
      acpCertInd: "1",
      consentDateTime: formattedDate,
      consentTimeZoneId: "10",
    };

    if (enrollment.applicationId) {
      body.applicationId = enrollment.applicationId;
      body.last4ssn = "";
      body.primaryState = "";
      body.primaryCity = "";
      body.primaryZipCode = "";
      body.primaryAddress1 = "";
      body.primaryAddress2 = "";
      body.bqpDob = "";
      body.bqpLast4ssn = "";
    }
    if (enrollment.deviceEligibilty === true) {
      body.deviceReimbursementDate = "";
      // body.deviceReimbursementDate = nladEnrollmentDate;
      body.modelNumber = "IRIS";
      body.marketValue = "120";
      body.deviceCopay = "10.99";
      body.deviceDeliveryMethod = "Shipped";
    }
    // let log;
    // try {
    //   log = await logService.new("/api/web/acpProgram", body);
    // } catch (err) {
    //   console.log(err);
    // }
    const username = process.env.NLADID;
    const password = process.env.NLADKEY;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://api.universalservice.org/ebbp-svc/1/subscriber`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    resData = { data, nladEnrollmentDate };
    return resData;

    // try {
    //   logService.updateResponse(log._id, data.data);
    // } catch (err) {
    //   //console.log(err);
    // }
    return data.data;
  },
  updateUserNLAD: async (enrollment) => {
    const convertedDate = convertDateToMMDDYYY(enrollment.DOB);
    const transactionEffectiveDate = convertDateToMMDDYYY(
      enrollment.transactionEffectiveDate
    );
    const serviceInitializationDate = convertDateToMMDDYYY(
      enrollment.serviceInitializationDate
    );
    const convertedDatebqp = convertDateToMMDDYYY(enrollment.BenifitDOB);
    const now = new Date();
    const formattedDate = formatDateToCustomFormat(now);
    console.log(formattedDate);

    const body = {
      applicationId: "",
      transactionType: "update",
      updateInd: "1",
      subscriberId: enrollment.subscriberId,
      transactionEffectiveDate: transactionEffectiveDate,
      sac: enrollment.sac,
      lastName: enrollment.lastName,
      firstName: enrollment.firstName,
      middleName: enrollment.middleName,
      phoneNumber: enrollment.contact,
      last4ssn: enrollment.SSN,
      tribalId: "",
      dob: convertedDate,
      serviceType: "MobileBroadband",
      //phoneNumberInEbbp: enrollment.contact,
      primaryAddress1: enrollment.address1,
      primaryAddress2: enrollment.address2,
      primaryCity: enrollment.city,
      primaryState: enrollment.state,
      primaryZipCode: enrollment.zip,
      primaryUrbanizationCode: "",
      mailingAddress1: enrollment.mailingAddress1,
      mailingAddress2: enrollment.mailingAddress2,
      mailingCity: enrollment.mailingCity,
      mailingState: enrollment.mailingState,
      mailingZipCode: enrollment.mailingZip,
      mailingUrbanizationCode: "",
      serviceInitializationDate: serviceInitializationDate,
      bqpLastName: enrollment.BenifitLastName,
      bqpFirstName: enrollment.BenifitFirstName,
      bqpMiddleName: enrollment.BenifitMiddleName,
      bqpDob: convertedDatebqp,
      bqpLast4ssn: enrollment.BenifitSSN,
      bqpTribalId: "",
      ebbpTribalBenefitFlag: "0",
      etcGeneralUse: enrollment.enrollmentId,
      includeSubscriberId: "0",
      repId: "",
      repNotAssisted: "1",
      deviceReimbursementDate: "",
      consumerFee: "0",
      modelNumber: "",
      marketValue: "",
      deviceCopay: "",
      deviceDeliveryMethod: "",
      avpPgrmException: "0",
      schoolLunchException: "0",
      schoolLunchCert: "",
      schoolName: "",
      consumerEmail: enrollment.email,
      contactPhoneNumber: enrollment.contact,
      amsFailureException: "1",
      latitude: "",
      longitude: "",
      dupAddressException: "1",
      eligibilityCode: enrollment.acpProgram.code,
      expectedRate: "",
      acpCertInd: "1",
      consentDateTime: formattedDate,
      consentTimeZoneId: "10",
    };

    if (body.updateInd) {
      body.last4ssn = "";
      body.firstName = "";
      body.primaryAddress1 = "";
      body.primaryAddress2 = "";
      body.bqpDob = "";
      body.bqpLast4ssn = "";
      body.bqpTribalId = "";
      body.dob = "";
    }
    if (!body.subscriberId) {
      body.phoneNumberInEbbp = enrollment.contact;
    }
    // let log;
    // try {
    //   log = await logService.new("/api/web/acpProgram", body);
    // } catch (err) {
    //   console.log(err);
    // }
    const username = process.env.NLADID;
    const password = process.env.NLADKEY;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://api.universalservice.org/ebbp-svc/1/subscriber`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .put(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;

    // try {
    //   logService.updateResponse(log._id, data.data);
    // } catch (err) {
    //   //console.log(err);
    // }
    return data.data;
  },
  deEnrollUser: async (enrollment) => {
    const transactionEffectiveDate = convertDateToMMDDYYY(
      enrollment.transactionEffectiveDate
    );
    const serviceInitializationDate = convertDateToMMDDYYY(
      enrollment.serviceInitializationDate
    );
    const convertedDatebqp = convertDateToMMDDYYY(enrollment.BenifitDOB);
    const body = {
      transactionType: "deEnroll",
      phoneNumberInEbbp: enrollment.contact,
      subscriberId: enrollment.subscriberId,
      transactionEffectiveDate: transactionEffectiveDate,
      repId: "",
      repNotAssisted: "1",
    };
    const username = process.env.NLADID;
    const password = process.env.NLADKEY;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://api.universalservice.org/ebbp-svc/1/subscriber`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .delete(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  transferUserNlad: async (enrollment, repId, transferException) => {
    const convertedDate = convertDateToMMDDYYY(enrollment.DOB);
    console.log(convertedDate);
    const timestamp = Date.now();
    let transactionEffectiveDate = convertDateToMMDDYYY(
      enrollment.transactionEffectiveDate
    );
    let serviceInitializationDate = convertDateToMMDDYYY(
      enrollment.serviceInitializationDate
    );
    if (!enrollment.transactionEffectiveDate) {
      transactionEffectiveDate = convertDateToMMDDYYY(timestamp);
    }
    if (!enrollment.serviceInitializationDate) {
      serviceInitializationDate = convertDateToMMDDYYY(timestamp);
    }
    let nladEnrollmentDate = convertDateToMMDDYYY(timestamp);

    const convertedDatebqp = convertDateToMMDDYYY(enrollment.BenifitDOB);
    const now = new Date();
    const formattedDate = formatDateToCustomFormat(now);
    console.log(formattedDate);

    const updateDate = await model.findOneAndUpdate(
      { _id: enrollment },
      { transactionEffectiveDate, serviceInitializationDate }
    );

    const body = {
      applicationId: "",
      transactionType: "transfer",
      transactionEffectiveDate: transactionEffectiveDate,
      sac: enrollment.sac,
      lastName: enrollment.lastName,
      firstName: enrollment.firstName,
      middleName: enrollment.middleName,
      phoneNumber: enrollment.contact,
      last4ssn: enrollment.SSN,
      tribalId: "",
      dob: convertedDate,
      serviceType: "MobileBroadband",
      primaryAddress1: enrollment.address1,
      primaryAddress2: enrollment.address2,
      primaryCity: enrollment.city,
      primaryState: enrollment.state,
      primaryZipCode: enrollment.zip,
      primaryUrbanizationCode: "",
      mailingAddress1: enrollment.mailingAddress1,
      mailingAddress2: enrollment.mailingAddress2,
      mailingCity: enrollment.mailingCity,
      mailingState: enrollment.mailingState,
      mailingZipCode: enrollment.mailingZip,
      mailingUrbanizationCode: "",
      serviceInitializationDate: serviceInitializationDate,
      bqpLastName: enrollment.BenifitLastName,
      bqpFirstName: enrollment.BenifitFirstName,
      bqpMiddleName: enrollment.BenifitMiddleName,
      bqpDob: convertedDatebqp,
      bqpLast4ssn: enrollment.BenifitSSN,
      bqpTribalId: "",
      ebbpTribalBenefitFlag: "0",
      etcGeneralUse: enrollment.enrollmentId,
      includeSubscriberId: "1",
      repId: "",
      repNotAssisted: "1",
      deviceReimbursementDate: "",
      consumerFee: "1",
      modelNumber: "",
      marketValue: "",
      deviceCopay: "",
      deviceDeliveryMethod: "",
      avpPgrmException: "0",
      schoolLunchException: "0",
      schoolLunchCert: "",
      schoolName: "",
      consumerEmail: enrollment.email,
      contactPhoneNumber: enrollment.contact,
      amsFailureException: "1",
      latitude: "",
      longitude: "",
      dupAddressException: "1",
      eligibilityCode: enrollment.acpProgram.code,
      expectedRate: "",
      acpCertInd: "1",
      consentDateTime: formattedDate,
      consentTimeZoneId: "10",
      transferException: transferException,
    };

    if (enrollment.applicationId) {
      body.applicationId = enrollment.applicationId;
      body.last4ssn = "";
      body.primaryState = "";
      body.primaryCity = "";
      body.primaryZipCode = "";
      body.primaryAddress1 = "";
      body.primaryAddress2 = "";
      body.bqpDob = "";
      body.bqpLast4ssn = "";
    }

    if (enrollment.deviceEligibilty === true) {
      // body.deviceReimbursementDate = nladEnrollmentDate;
      body.deviceReimbursementDate = "";
      body.modelNumber = "IRIS";
      body.marketValue = "120";
      body.deviceCopay = "10.99";
      body.deviceDeliveryMethod = "Shipped";
    }

    // let log;
    // try {
    //   log = await logService.new("/api/web/acpProgram", body);
    // } catch (err) {
    //   console.log(err);
    // }
    const username = process.env.NLADID;
    const password = process.env.NLADKEY;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://api.universalservice.org/ebbp-svc/1/transfer`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
        //"OBBasicAuth": "fromDialog",
      },
    };
    console.log(JSON.stringify(body));
    //const data = await axios.post(url, JSON.stringify(body), { headers });
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    resData = { data, nladEnrollmentDate };
    return resData;
  },
  batchUpload: async (filePath, uploadedFileName) => {
    const username = process.env.NLADID;
    const password = process.env.NLADKEY;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://api.universalservice.org/ebbp-svc/1/batch`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "multipart/form-data",
      },
    };
    const formData = new FormData();

    // Append the file to the FormData object
    formData.append(uploadedFileName, fs.createReadStream(filePath));
    console.log(formData);
    console.log("here");
    //const data = await axios.post(url, JSON.stringify(body), { headers });
    const data = await axios
      .post(url, formData, options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        console.error("Error is:", error?.response);
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  getErroredData: async (link) => {
    const username = process.env.NLADID;
    const password = process.env.NLADKEY;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://api.universalservice.org${link}`;
    const options = {
      headers: {
        Authorization: Access_token,
      },
    };
    console.log(`url = ${url} && \n headers = ${options}`);
    const data = await axios
      .get(url, options)
      .then(async (response) => {
        console.log(response);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  deviceEligibilty: async (enrollment) => {
    console.log(enrollment.DOB);
    const convertedDate = convertDateToMMDDYYY(enrollment.DOB);
    console.log(convertedDate);
    const body = {
      lastName: enrollment.lastName,
      firstName: enrollment.firstName,
      last4ssn: enrollment.SSN,
      dob: convertedDate,
      primaryAddress1: enrollment.address1,
      primaryAddress2: enrollment.address2,
      primaryCity: enrollment.city,
      primaryState: enrollment.state,
      primaryZipCode: enrollment.zip,
    };

    const username = process.env.NLADID;
    const password = process.env.NLADKEY;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://api.universalservice.org/ebbp-svc/1/subscriber/verifyDeviceEligibility`;
    console.log(url);
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(JSON.stringify(body));
    //const data = await axios.post(url, JSON.stringify(body), { headers });
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log(response);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        console.log(error);
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  NLADTransactionReport: async (sac, startDate, endDate) => {
    const convertedStartDate = convertDateToMMDDYYY(startDate);
    const convertedEndDate = convertDateToMMDDYYY(endDate);

    console.log(convertedStartDate, convertedEndDate);
    const username = process.env.NLADID;
    const password = process.env.NLADKEY;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://api.universalservice.org/ebbp-svc/1/report/transaction?reportType=detail&sac=${sac}&startDate=${convertedStartDate}&endDate=${convertedEndDate}&type=transfer&includeSubscriberId=1&includeACPCertInd=1`;
    console.log(url);
    const options = {
      headers: {
        Authorization: Access_token,
      },
    };
    //const data = await axios.post(url, JSON.stringify(body), { headers });
    const data = await axios
      .get(url, options)
      .then(async (response) => {
        console.log(response);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        console.log(error);
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  termsAncConditions: async (csr, _id) => {
    const result = await model.findOneAndUpdate(
      { _id },
      { csr, isAgreeToTerms: true, step: 6 },
      { new: true }
    );
    return result;
  },
  plan: async (csr, _id, plan) => {
    const result = await model.findOneAndUpdate(
      { _id },
      { csr, plan: new mongoose.Types.ObjectId(plan), step: 7 },
      { new: true }
    );
    return result;
  },
  handOver: async (csr, _id, level, assignTo) => {
    const result = await model.findOneAndUpdate(
      { _id },
      { csr, isEnrollmentComplete: true, level: level, assignTo, step: 8 },
      { new: true }
    );
    return result;
  },
  prepaidHandOver: async (
    csr,
    _id,
    level,
    assignTo,
    isWithInvoice,
    isWithoutInvoice
  ) => {
    console.log("in service handover", isWithInvoice, isWithoutInvoice);
    const result = await model.findOneAndUpdate(
      { _id },
      {
        csr,
        isEnrollmentComplete: true,
        level: level,
        assignTo,
        step: 8,
        isWithInvoice,
        isWithoutInvoice,
      },
      { new: true }
    );
    return result;
  },
  completeEnrollmentUserList: async (serviceProvider) => {
    const result = await model
      .find({
        serviceProvider: serviceProvider,
        isEnrollmentComplete: { $in: true },
        $or: [
          {
            $expr: {
              $eq: [{ $arrayElemAt: ["$approval.approved", -1] }, true],
            },
          },
          { approval: { $exists: false } },
          { approval: { $size: 0 } },
        ],
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
      })
      .sort({ createdAt: -1 });
    return result;
  },
  completeEnrollmentUser: async (_id) => {
    const result = await model.findOne({
      _id: _id,
      isEnrollmentComplete: true,
    });
    return result;
  },
  rejectedEnrollmentUserList: async (serviceProvider) => {
    const result = await model
      .find({
        serviceProvider: serviceProvider,
        isApproved: { $in: false },
      })
      .sort({ createdAt: -1 });
    return result;
  },
  inCompleteEnrollmentUserList: async (
    userId,
    serviceProvider,
    accountType
  ) => {
    console.log();
    const result = await model
      .find({
        csr: userId,
        serviceProvider: serviceProvider,
        accountType: accountType,
        isEnrollmentComplete: { $in: false },
        firstName: { $exists: true, $ne: "" },
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
      })
      .sort({ createdAt: -1 })
      .populate({
        path: "rejectedBy",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "assignedToUser",
        populate: { path: "role", select: "role" },
        populate: { path: "department", select: "department" },
        select: "_id name role department",
      })
      .populate({
        path: "invoice",
        select:
          "planId stripeId invoiceNo invoiceType planCharges amountPaid additionalCharges discount invoiceCreateDate invoiceDueDate billingPeriod invoiceStatus invoicePaymentMethod invoiceOneTimeCharges lateFee",
        populate: [
          {
            path: "discount",
            select: "name amount",
          },
          {
            path: "additionalCharges", // Ensure this field is defined in your schema
            select: "name amount",
          },
        ],
      });
    return result;
  },
  checkBeneficiaryAddress: async (city, zip, address1, state) => {
    const beneficiary = await model.findOne({ city, zip, address1, state });
    return beneficiary;
  },
  proofEnrollmentUserList: async (serviceProvider) => {
    const result = await model
      .find({
        serviceProvider: serviceProvider,
        isProofed: true,
        isEnrollmentComplete: true,
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
      });
    return result;
  },
  withoutProofEnrollmentUserList: async (serviceProvider) => {
    const result = await model
      .find({
        serviceProvider: serviceProvider,
        isProofed: false,
        isEnrollmentComplete: true,
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
      });
    return result;
  },
  // updateStatus: async (_id) => {
  //   const result = await model.findOneAndUpdate(
  //     { _id },
  //     { status: userStatus.ACTIVE },
  //     { new: true }
  //   );
  //   return result;
  // },
  updateOtp: async (email, otp) => {
    var otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 3);
    const customer = await model.findOneAndUpdate(
      { email: email },
      { otp, otpExpire: otpExpiry },
      { new: true }
    );
    return customer;
  },
  verifyOTP: async (email, otp) => {
    const verify = await model.findOneAndUpdate(
      { email: email, otp: otp },
      { otp: null }
    );
    return verify;
  },
  otpExpiryValidation: async (email) => {
    const validate = await model.findOne({
      email: email,
      otpExpire: { $gte: new Date() },
    });
    return validate;
  },
  setNewPassword: async (_id, password) => {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const result = await model.findOneAndUpdate(
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
  forgotPassword: async (email, password) => {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const result = await model.findOneAndUpdate(
      { email },
      { password },
      { new: true }
    );
    return result;
  },
  update: async (
    _id,
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
  ) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
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
      },
      { new: true }
    );
    return result;
  },
  delete: async (_id) => {
    const result = await model.findOneAndUpdate({ _id }, { deleted: true });
    return result;
  },
  approval: async (
    enrolmentId,
    approvedBy,
    approved,
    level,
    isEnrolled,
    isComplete
  ) => {
    const result = await model.findOneAndUpdate(
      { _id: enrolmentId },
      {
        $push: {
          approval: {
            approvedBy: new mongoose.Types.ObjectId(approvedBy),
            approved,
            level,
            isEnrolled,
            isComplete,
          },
        },
      },
      { new: true }
    );
    return result;
  },
  rejected: async (enrolmentId, approvedBy, reason, level) => {
    const result = await model.findOneAndUpdate(
      { _id: enrolmentId },
      {
        $push: {
          approval: {
            approvedBy: new mongoose.Types.ObjectId(approvedBy),
            approved: false,
            reason,
            level,
          },
        },
      },
      { new: true }
    );
    return result;
  },
  planHistory: async (enrolmentId, orignalPlan, changePlan, updatedBy) => {
    const result = await model.findOneAndUpdate(
      { _id: enrolmentId },
      {
        $push: {
          planHistory: {
            orignalPlan,
            changePlan,
            updatedBy: new mongoose.Types.ObjectId(approvedBy),
            updatedAt: Date.now,
          },
        },
      },
      { new: true }
    );
    console.log(result);
    return result;
  },
  lastAprovalReturn: async (enrolmentId) => {
    const result = await model.findOne(
      { enrolmentId },
      { approval: { $slice: -1 } } // Get the last element of the 'approval' array
    );
    return result;
  },
  getAllEnrollment: async (checkLevel) => {
    const result = await model.find(
      {
        "approval.level": { $eq: checkLevel },
      }, // Modify the field and condition
      projection.projection
    );
    return result;
  },
  remarks: async (
    _id,
    comRemarks,
    confidenceRemarks,
    verificationRemarks,
    informationRemarks,
    disclaimerRemarks,
    DOBRemarks,
    callDropRemarks,
    callQualityRemarks,
    csrRemarks,
    remarksComment
  ) => {
    const result = await model.findOneAndUpdate(
      { _id },
      {
        comRemarks,
        confidenceRemarks,
        verificationRemarks,
        informationRemarks,
        disclaimerRemarks,
        DOBRemarks,
        callDropRemarks,
        callQualityRemarks,
        csrRemarks,
        remarksComment,
      },
      { new: true }
    );
    return result;
  },
  allQaAgents: async () => {
    try {
      // Step 1: Retrieve all users with the role "QA AGENT."
      const qaAgents = await adminUserModel.find({
        role: new mongoose.Types.ObjectId("653617d72bbe16a3c99fa001"),
        isOnLeave: false,
      });
      if (qaAgents.length === 0) {
        console.log("No QA Agents found.");
        return;
      }
      console.log("qaAgents", qaAgents);
      // Step 2: Count the number of customers for each QA agent.
      const qaAgentCustomerCounts = await Promise.all(
        qaAgents.map(async (qaAgent) => {
          const customerCount = await model.countDocuments({
            assignToQa: qaAgent._id,
          });
          return { qaAgentId: qaAgent._id, customerCount };
        })
      );
      console.log("qaAgentCustomerCounts", qaAgentCustomerCounts);

      // Step 3: Identify the QA agent with the minimum number of customers.
      const minCustomerCountAgent = qaAgentCustomerCounts.reduce(
        (min, current) =>
          current.customerCount < min.customerCount ? current : min
      );

      // Step 4: Assign the new enrollment to the QA agent with the minimum customer count.
      // Your logic to assign the enrollment goes here.

      console.log(
        "Enrollment assigned to QA Agent:",
        minCustomerCountAgent.qaAgentId
      );
      return minCustomerCountAgent.qaAgentId;
    } catch (error) {
      console.error("Error:", error);
    }
  },
  allProAgents: async () => {
    try {
      // Step 1: Retrieve all users with the role "QA AGENT."
      const qaAgents = await adminUserModel.find({
        role: new mongoose.Types.ObjectId("657c70f25fca09f9c21d46d8"),
        isOnLeave: false,
      });
      if (qaAgents.length === 0) {
        console.log("No QA Agents found.");
        return;
      }

      // Step 2: Count the number of customers for each QA agent.
      const qaAgentCustomerCounts = await Promise.all(
        qaAgents.map(async (qaAgent) => {
          const customerCount = await model.countDocuments({
            assignToQa: qaAgent._id,
          });
          return { qaAgentId: qaAgent._id, customerCount };
        })
      );
      console.log("qaAgentCustomerCounts", qaAgentCustomerCounts);

      // Step 3: Identify the QA agent with the minimum number of customers.
      const minCustomerCountAgent = qaAgentCustomerCounts.reduce(
        (min, current) =>
          current.customerCount < min.customerCount ? current : min
      );

      // Step 4: Assign the new enrollment to the QA agent with the minimum customer count.
      // Your logic to assign the enrollment goes here.

      console.log(
        "Enrollment assigned to QA Agent:",
        minCustomerCountAgent.qaAgentId
      );
      return minCustomerCountAgent.qaAgentId;
    } catch (error) {
      console.error("Error:", error);
    }
  },
  fileData: async (filePath, uploadedFileName) => {
    const csv = require("csv-parse");
    try {
      // Construct the full path to the uploaded file using path.join
      const fullPath = path.join(filePath);

      // Read file data as a string
      const fileStream = fs.createReadStream(fullPath, "utf-8");

      // Parse CSV data using the csv-parse module
      const csvDataPromise = new Promise((resolve, reject) => {
        const dataArray = [];

        // Use the csv-parser module to parse the CSV stream
        fileStream
          .pipe(
            csv.parse({
              columns: true,
              skip_empty_lines: true,
              trim: true,
              delimiter: "\t",
            })
          )
          .on("data", (data) => dataArray.push(data))
          .on("end", () => resolve(dataArray))
          .on("error", (error) => reject(error));
      });

      // Wait for the promise to resolve
      const csvData = await csvDataPromise;

      console.log("CSV Data:", csvData);

      // Check if csvData is an array
      if (!Array.isArray(csvData)) {
        throw new Error("Invalid CSV data format");
      }
      const matchedDataArray = csvData.map((csvData) => {
        const headers = Object.keys(csvData)[0].split(",");
        const values = Object.values(csvData)[0].split(",");

        const matchedData = {};
        headers.forEach((header, index) => {
          matchedData[header] = values[index];
        });

        return matchedData;
      });

      console.log("Matched Data Array:", matchedDataArray);
      return matchedDataArray;
    } catch (error) {
      console.error("Error reading CSV file:", error);
      return { status: 500, data: "Internal Server Error" };
    }
  },
  ExcelfileData: async (filePath, uploadedFileName) => {
    // Load the workbook
    const workbook = xlsx.readFile(filePath);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Get worksheet
    const worksheet = workbook.Sheets[sheetName];

    // Convert the worksheet to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: "",
    });
    //jsonData.shift();
    const headers = jsonData[0];
    const mappedData = jsonData.map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
        if (
          typeof row[index] === "string" &&
          row[index].match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)
        ) {
          obj[header] = row[index];
        }
      });
      return obj;
    });

    return mappedData;
  },
  postpaidExcelfileData: async (filePath, uploadedFileName) => {
    // Load the workbook
    const workbook = xlsx.readFile(filePath);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Get worksheet
    const worksheet = workbook.Sheets[sheetName];

    // Convert the worksheet to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: "",
    });
    //jsonData.shift();
    const headers = jsonData[0];
    const mappedData = jsonData.map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
        if (
          typeof row[index] === "string" &&
          row[index].match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)
        ) {
          obj[header] = row[index];
        }
      });
      return obj;
    });

    return mappedData;
  },
};

function requestBody(enrollment) {
  return body;
}

function convertDateToMMDDYYY(date) {
  if (date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    const timestamp = date;
    const dateOnly = timestamp.toISOString().split("T")[0];
    const parts = dateOnly.split("-");
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  } else {
    return "";
  }
}

function convertSIDateToMMDDYYY(date) {
  if (date) {
    const timestamp = new Date(date);
    const dateOnly = timestamp.toISOString().split("T")[0];
    const parts = dateOnly.split("-");
    console.log(typeof parts[2], parts[2]);
    if (parts[2] === "01") {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    } else {
      return `${parts[1]}/${parts[2] - 1}/${parts[0]}`;
    }
  } else {
    return "";
  }
}

function formatDateToCustomFormat(Currdate) {
  const timeZone = "America/Chicago";

  // Create a date object for the current date and time in the specified time zone
  const currentDate = Currdate;
  const options = { timeZone: timeZone };

  // Format the date and time in "yyyy-mm-dd hh:mm:ss" format
  const formattedDateTime = currentDate.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // Use 24-hour format
    timeZone: timeZone,
  });

  const parts = formattedDateTime.split(",").map((part) => part.trim());

  // Split the date by '/', rearrange it with hyphens in YYYY-MM-DD format, and keep the time
  const [date, time] = parts;
  const [month, day, year] = date.split("/").map((part) => part.trim());
  console.log([month, day, year]);

  const newDateTime = `${year}-${month}-${day} ${time}`;
  return newDateTime;
}

module.exports = service;
