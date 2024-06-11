const express = require("express");
const axios = require("axios");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs").promises;
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const pdf = require("pdf-parse");
const model = require("./model");
const path = require("path");
const featureAmount = require("../additionalFeatures/model");
const zipService = require("../zipCodes/zipCodeService");
const service = require("./service");
const simInventoryService = require("../simInventory/service");
const simServices = require("../EsnNumbers/Services");
const sacService = require("../sacNumber/sacService");
const depModel = require("../departments/departmentModel");
const passwordValidator = require("../utils/passwordValidator");
const { v4: uuidv4 } = require("uuid");
const adminUserModel = require("../adminUser/adminUserModel");
const adminService = require("../adminUser/adminUserServices");
const heirarchyService = require("../roleHeirarchy/roleHeirarchyService");
const { enrollmentId, SixDigitUniqueId } = require("../utils/enrollmentId");
const acpService = require("../acpPrograms/service");
const serviceAreaServices = require("../serviceArea/service");
const carrierServices = require("../carrier/service");
const PWGServices = require("../pwg/service");
const xml2js = require("xml2js");
const csv = require("csv-parse");
const UspsService = require("../pwg/UspsService");
const billing = require("../billing/billingModel");
const billingServices = require("../billing/billingServices");
const { DateTime } = require("luxon");
const nodemailer = require("nodemailer");
const randomize = require("randomatic");
const bcrypt = require("bcrypt");
const multer = require("multer");
const cron = require("node-cron");
const filefs = require("fs");
const Transaction = require("../plan/transactionModel");
const GatewayCredential = require("../paymentMethod/model");
const Notification = require("../notification/model");
const { RestClient } = require("@signalwire/compatibility-api");
const sp = require("../serviceProvider/model");
const signalwireClient = new RestClient(
  process.env.SW_PROJECT_ID,
  process.env.SW_AUTH_TOKEN,
  { signalwireSpaceUrl: process.env.SPACE_URL }
);
const {
  ACTIVE,
  INACTIVE,
  REJECTED,
  PROSPECTED,
  ENROLLED,
  LABELCREATED,
} = require("../utils/userStatus");
const planservice = require("../plan/service");
const planModel = require("../plan/model");
const invoiceModel = require("../invoices/invoicemodel");
const {
  verifyZip,
  PWGverifyZip,
  initialInformation,
  homeAddressValidation,
  question,
  selectProgram,
  selectPlan,
  handOver,
  prepaidhandOver,
  termsAndConditions,
  remarks,
  NLADTransactionReport,
  validateSignup,
  validateEmailOtp,
  validateContactOtp,
  validatePasswordUpdate,
  validateEmailOtpResend,
  validateContactOtpResend,
  validatePasswordUpdateReset,
  userProfile,
} = require("./validator");
const AppError = require("../helpers/apiError");
const expressAsyncHandler = require("express-async-handler");
const adminUserServices = require("../adminUser/adminUserServices");
const billingModel = require("../billing/billingModel");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // Define the directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname +
        "-" +
        uniqueSuffix +
        "." +
        file.originalname.split(".").pop()
    );
  },
});

const upload = multer({ storage: storage });

exports.getAll = expressAsyncHandler(async (req, res) => {
  const { serviceProvider } = req.query;
  const result = await service.get(serviceProvider);
  res.status(200).send({ msg: "users", data: result });
});
exports.getServiceProvider = expressAsyncHandler(async (req, res) => {
  const { serviceProvider } = req.query;
  const result = await sp.findOne({ _id: serviceProvider });
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
//pwg verify zip
exports.PWGverifyZip = expressAsyncHandler(async (req, res, next) => {
  let { serviceProvider, carrier, csr, zipCode, department, accountType } =
    req.body;

  const User = await adminService.getByUserID(csr);
  console.log(User);
  const userRole = User.role.role;
  if (userRole !== "Admin" || userRole.toUpperCase() !== "ADMIN") {
    if (
      !serviceProvider ||
      !carrier ||
      !csr ||
      !zipCode ||
      !department ||
      !accountType
    ) {
      return res.status(400).send({
        msg: "serviceProvider or carrier or csr or zipCode or department  or accountType field missing",
      });
    }
  } else {
    if (!serviceProvider || !carrier || !csr || !zipCode || !accountType) {
      return res.status(400).send({
        msg: "serviceProvider or carrier or csr or zipCode or accountType field missing",
      });
    }
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
            csr,
            city,
            state,
            sac,
            department,
            accountId,
          };

          // Call the service function with sac parameter
          result = await service.addUserZip(body);
        } else {
          const body = {
            serviceProvider,
            carrier,
            zipCode,
            enrollment,
            csr,
            city,
            state,
            department,
            accountId,
          };

          // Call the service function with sac parameter
          result = await service.addUserZip(body);
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
  let { serviceProvider, carrier, csr, zipCode, department, accountType } =
    req.body;
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
        csr,
        city,
        state,
        sac,
        department,
        accountId,
      };

      // Call the service function with sac parameter
      result = await service.addUserZip(body);
    } else {
      const body = {
        serviceProvider,
        carrier,
        zipCode,
        enrollment,
        csr,
        city,
        state,
        department,
        accountId,
      };

      // Call the service function with sac parameter
      result = await service.addUserZip(body);
    }
    return res.status(200).send({ msg: "zip code Available", data: result });
  } else {
    return res.status(400).send({ msg: "Zip Code Not Found" });
  }
});
// verify zipCode
exports.verifyZip = expressAsyncHandler(async (req, res, next) => {
  let { serviceProvider, carrier, csr, zipCode, department, accountType } =
    req.body;
  console.log(req.body);

  const User = await adminService.getByUserID(csr);
  console.log(User);
  const userRole = User.role.role;
  if (userRole !== "Admin" || userRole.toUpperCase() !== "ADMIN") {
    if (
      !serviceProvider ||
      !carrier ||
      !csr ||
      !zipCode ||
      !department ||
      !accountType
    ) {
      return res.status(400).send({
        msg: "serviceProvider or carrier or csr or zipCode or department or accountType  field missing",
      });
    }
  } else {
    if (!serviceProvider || !carrier || !csr || !zipCode || !accountType) {
      return res.status(400).send({
        msg: "serviceProvider or carrier or csr or zipCode or accountType  field missing",
      });
    }
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
      csr,
      city,
      state,
      sac,
      department,
      accountId,
    };

    // Call the service function with sac parameter
    result = await service.addUserZip(body);
  } else {
    const body = {
      serviceProvider,
      carrier,
      zipCode,
      enrollment,
      csr,
      city,
      state,
      department,
      accountId,
    };

    // Call the service function with sac parameter
    result = await service.addUserZip(body);
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
//Change Account Type
exports.changeAccountStatus = expressAsyncHandler(async (req, res) => {
  try {
    const { accountType } = req.body;
    const { userId } = req.query;
    let amountPaid = "0";
    console.log(userId);
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let user = await service.getByUserID(userId);
    if (!user) {
      return res.status(400).send({ msg: "customer not found" });
    }

    let currPlan = await planservice.getOne(user.plan);
    const billingConfig = await billingModel
      .findOne({
        billingmodel: "PREPAID",
        inventoryType: "SIM",
      })
      .populate({
        path: "selectdiscount",
        select: "discountname amount",
      })
      .populate({
        path: "additionalFeature",
        select: "featureName featureAmount",
      });

    //console.log(billingConfig);
    if (!billingConfig) {
      return res.status(400).send({
        msg: "BillingConfig for Prepaid, SIM not found. Please add billingConfig First",
      });
    }

    const plansWithMatchingMonthlyCharges = await planModel.find({
      monthlycharges: billingConfig.monthlycharges,
    });

    // Filter the plans based on the criteria and get the first matching plan
    const matchingPlan = plansWithMatchingMonthlyCharges.find(
      (plan) =>
        plan.inventoryType === currPlan.inventoryType &&
        plan.type === "PREPAID" &&
        plan.planId === currPlan.planId
    );
    console.log("matchingPlan", billingConfig);
    if (!matchingPlan) {
      return res.status(400).send({
        msg: `Prepaid Billing Configuration doest'nt contain plan with planId:${currPlan.planId} and inventoryType:${currPlan.inventoryType}. First add plan in billing configuration`,
      });
    }
    let totalAdditionalCharges = 0;
    billingConfig?.additionalFeature?.forEach((charge) => {
      totalAdditionalCharges += parseFloat(charge.featureAmount);
    });
    // Calculate total discount
    let totalDiscount = 0;
    billingConfig?.selectdiscount?.forEach((discount) => {
      totalDiscount += parseFloat(discount.amount);
    });
    console.log("totalDiscount", totalDiscount);
    console.log("totalAdditionalCharges", totalAdditionalCharges);
    let netAmount = totalAdditionalCharges + parseFloat(matchingPlan.price);
    let recurringCharges = netAmount - totalDiscount;
    console.log("recurringCharges", recurringCharges);
    netAmount = recurringCharges + parseFloat(billingConfig.oneTimeCharge);
    netAmount -= parseFloat(amountPaid);
    const currentDate = DateTime.now().setZone("America/New_York");
    const currentYear = currentDate.toFormat("yyyy");
    const currentMonth = currentDate.toFormat("LL");
    const invoiceNo = `${currentYear}-${currentMonth}-${user.accountId}`;
    const billingPeriodFrom = currentDate.toFormat("MM-dd-yyyy");
    const billingPeriodTo = currentDate
      .plus({ days: 30 })
      .toFormat("MM-dd-yyyy");

    let dueDate;
    let dueDates = currentDate.plus({
      days: billingConfig.dueDate,
    });
    dueDate = dueDates.toJSDate();
    // Format the dueDate as MM-DD-YYYY
    const formattedDueDate = `${(dueDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${dueDate
      .getDate()
      .toString()
      .padStart(2, "0")}-${dueDate.getFullYear()}`;
    let custCurrentPlan = {
      planId: matchingPlan._id,
      planCharges: matchingPlan.price,
      additionalCharges: [],
      discount: billingConfig?.selectdiscount?.map((discount) => ({
        name: discount.discountname, // Storing the discounted name in 'name' property
        amount: discount.amount,
      })),
      additionalCharges: billingConfig?.additionalFeature?.map((charge) => ({
        name: charge.featureName, // Storing the discounted name in 'name' property
        amount: charge.featureAmount,
      })),
      planName: matchingPlan.name,
      billingPeriod: {
        from: billingPeriodFrom,
        to: billingPeriodTo,
      },
      chargingType: "Monthly",
      printSetting: "Both",
      dueAmount: netAmount.toFixed(2),
    };
    console.log(custCurrentPlan);
    const newInvoice = new invoiceModel({
      invoiceNo,
      invoiceType: "Monthly Bill",
      planCharges: matchingPlan.price,
      discount: billingConfig?.selectdiscount?.map((discount) => ({
        name: discount.discountname, // Storing the discounted name in 'name' property
        amount: discount.amount,
      })),
      additionalCharges: billingConfig?.additionalFeature?.map((charge) => ({
        name: charge.featureName, // Storing the discounted name in 'name' property
        amount: charge.featureAmount,
      })),
      invoiceOneTimeCharges: billingConfig.oneTimeCharge,
      totalAmount: netAmount.toFixed(2),
      amountPaid: "0.00",
      invoiceDueDate: formattedDueDate,
      billingPeriod: {
        from: billingPeriodFrom,
        to: billingPeriodTo,
      },
      invoiceStatus: "Unpaid",
      invoicePaymentMethod: "Credit/Debit Card",
      lateFee: billingConfig.lateFee,
      planId: matchingPlan._id,
      //stripeId,
      customerId: user._id,
      accountId: user.accountId,
      chargingType: "Monthly",
      printSetting: "Both",
      planName: matchingPlan.name,
      recurringCharges: recurringCharges,
      netPrice: netAmount.toFixed(2),
      dueAmount: netAmount.toFixed(2),
      transId: user?.invoiceTransId,
      //paymentChannel,
      //autopayChargeDate: updatedAutopayChargeDate,
    });

    // Save the new invoice to the database
    savedInvoice = await newInvoice.save();
    console.log(savedInvoice);

    const currentDateEST = DateTime.now().setZone("America/New_York");
    const formattedDate = currentDateEST.toFormat("LLLL dd, yyyy, hh:mm a");

    // Update the account type and convertToPrepaidDate based on the user ID
    const updatedUser = await model.findOneAndUpdate(
      { _id: userId },
      {
        $push: { invoice: savedInvoice?._id },
        plan: matchingPlan._id,
        currentPlan: custCurrentPlan,
        totalAmount: netAmount.toFixed(2),
        selectProduct: billingConfig?.inventoryType,
        dueAmount: netAmount.toFixed(2),
        billId: billingConfig._id,
        activeBillingConfiguration: {
          oneTimeCharge: billingConfig?.oneTimeCharge,
          monthlyCharge: billingConfig?.monthlyCharge,
          dueDate: billingConfig?.dueDate,
          paymentMethod: billingConfig?.paymentMethod,
          BillCreationDate: billingConfig?.BillCreationDate,
          ServiceProvider: billingConfig?.ServiceProvider,
          selectdiscount: billingConfig?.selectdiscount?.map((discount) => ({
            name: discount.discountname, // Storing the discounted name in 'name' property
            amount: discount.amount,
          })),
          additionalFeature: billingConfig?.additionalFeature?.map(
            (charge) => ({
              name: charge.featureName, // Storing the discounted name in 'name' property
              amount: charge.featureAmount,
            })
          ),
          applyLateFee: billingConfig?.applyLateFee,
          latefeeCharge: billingConfig?.lateFee,
          subsequentBillCreateDate: billingConfig?.subsequentBillCreateDate,
          applyToCustomer: "newCustomer",
        },
        accountType,
        AcptoPrepaid: true,
        convertToPrepaidDate: formattedDate,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // If accountType is "Prepaid", update the PDF file
    if (accountType === "Prepaid") {
      // Load the PDF template
      const pdfFilePath = path.resolve("pdf-templates", "Prepaid_Consent.pdf");
      // const timestamp = new Date().toISOString().replace(/:/g, "-"); // Replace colons to make filename compatible
      // const newFilename = `${updatedUser._id}_${timestamp}.pdf`; // Assuming userId is unique and available
      // const newFilePath = path.relative("uploads", newFilename);
      const outputDirectory = "uploads";

      // Create the output directory if it doesn't exist
      if (!filefs.existsSync(outputDirectory)) {
        filefs.mkdirSync(outputDirectory);
      }

      // Generate a unique filename for the PDF
      const fileName = `prepaid_${userId}_${Date.now()}.pdf`;

      // Specify the path to save the PDF
      const outputPath = `${outputDirectory}/${fileName}`;
      // Read the PDF file
      const pdfBytes = await fs.readFile(pdfFilePath);

      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Update fields with user data
      const form = pdfDoc.getForm();

      form.getTextField("text_6pbou").setText(`${updatedUser.firstName}`);
      form
        .getTextField("text_7kbc")
        .setText(`${updatedUser.firstName} ${updatedUser.lastName}`);
      const currentDate = new Date();
      form.getTextField("text_8tos").setText(currentDate.toLocaleDateString());

      // Flatten form fields to make them uneditable
      form.flatten();

      // Save the modified PDF to a new file
      const modifiedPdfBytes = await pdfDoc.save();

      // Write the modified PDF to the new file
      await fs.writeFile(outputPath, modifiedPdfBytes);

      // Update the files array in the user model
      const updatedFiles = [
        ...updatedUser.files,
        {
          filetype: "Prepaid Consent Form",
          filepath: outputPath,
          audioLink: "",
          uploadedBy: userId,
        },
      ];
      await model.findOneAndUpdate(
        { _id: userId },
        { files: updatedFiles },
        { new: true }
      );

      console.log("PDF file updated successfully");
    }

    // Respond with success message
    return res.status(200).json({
      message: "Account type updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Initial infos
exports.initialInformation = expressAsyncHandler(async (req, res, next) => {
  let {
    csr,
    userId,
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
    salesChannel,
    accountType,
    maidenMotherName,
    alternateContact,
    izZipVerified,
  } = req.body;
  console.log(req.body);
  if (isSelfReceive === false) {
    if (!BenifitFirstName || !BenifitLastName || !BenifitSSN || !BenifitDOB) {
      return res.status(400).send({
        msg: "field missing: BenifitFirstName or BenifitLastName or BenifitSSN or BenifitDOB",
      });
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

  firstName = firstName.toUpperCase();
  middleName = middleName.toUpperCase();
  lastName = lastName.toUpperCase();

  const birthDate = new Date(DOB);
  const currentDate = new Date();
  const age = currentDate.getFullYear() - birthDate.getFullYear();

  if (age < 18) {
    return next(
      new AppError("You must be at least 18 years old to proceed.", 400)
    );
  }

  let source;
  let User;

  try {
    User = await adminService.getByUserID(csr);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).send({ msg: "Internal Server Error" });
  }

  if (!User || !User.role || !User.role.role) {
    console.error("Invalid user object:", User);
    return res.status(400).send({ msg: "User role is undefined or invalid." });
  }

  const userRole = User.role.role;
  console.log("User Role:", userRole);

  // Check user's role based on the value of userRole
  if (
    [
      "QA MANAGER",
      "TEAM LEAD",
      "PROVISION AGENT",
      "PROVISION MANAGER",
      "CSR",
      "DISPATCH AGENT",
    ].includes(userRole.toUpperCase())
  ) {
    source = userRole;
  } else {
    source = "vendor";
  }

  const result = await service.addInitialInformation(
    csr,
    userId,
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
    salesChannel,
    source,
    accountType,
    maidenMotherName,
    alternateContact,
    izZipVerified
  );

  console.log("Result:", result);
  if (result) {
    await service.passGenerate(userId);
    return res.status(201).send({
      msg: "Congratulations! Your basic information has been saved. Thank you for enrolling with us",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed to save basic information!" });
  }
});

// Address API
exports.homeAddress = expressAsyncHandler(async (req, res, next) => {
  let {
    csr,
    userId,
    city,
    zip,
    address1,
    address2,
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
  } = req.body;
  if (isNotSameServiceAddress === true) {
    if (!mailingAddress1 || !mailingZip || !mailingCity || !mailingState) {
      return res.status(400).send({ msg: "field missing" });
    }
  } else {
    mailingAddress1 = "";
    mailingZip = "";
    mailingCity = "";
    mailingState = "";
  }
  if (isPoBoxAddress === true) {
    if (!PoBoxAddress || !poBoxZip || !poBoxCity || !poBoxState) {
      return res.status(400).send({ msg: "field missing" });
    }
  } else {
    PoBoxAddress = "";
    poBoxZip = "";
    poBoxCity = "";
    poBoxState = "";
  }
  const validate = homeAddressValidation.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  // const isBeneficiaryAddress = await service.checkBeneficiaryAddress(
  //   city,
  //   zip,
  //   address1,
  //   state
  // );
  // if (isBeneficiaryAddress) {
  //   return res.status(400).send({
  //     msg: "This home address already in beneficiary list!",
  //   });
  // }

  const result = await service.homeAddress(
    csr,
    userId,
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
exports.question = expressAsyncHandler(async (req, res, next) => {
  let {
    csr,
    userId,
    livesWithAnotherAdult,
    hasAffordableConnectivity,
    isSharesIncomeAndExpense,
  } = req.body;
  const validate = question.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  const result = await service.question(
    csr,
    userId,
    livesWithAnotherAdult,
    hasAffordableConnectivity,
    isSharesIncomeAndExpense
  );
  if (result) {
    return res.status(201).send({
      msg: "Noted",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed !" });
  }
});
// exports.q2 = expressAsyncHandler(async (req, res, next) => {
//   let { userId, hasAffordableConnectivity } = req.body;
//   const validate = q2.validate(req.body);
//   if (validate.error) {
//     return next(new AppError(validate.error, 400));
//   }
//   const result = await service.q2(userId, hasAffordableConnectivity);
//   if (result) {
//     return res.status(201).send({
//       msg: "Noted",
//       data: result,
//     });
//   } else {
//     return res.status(400).send({ msg: "Failed !" });
//   }
// });
// exports.q3 = expressAsyncHandler(async (req, res, next) => {
//   let { userId, isSharesIncomeAndExpense } = req.body;
//   const validate = q3.validate(req.body);
//   if (validate.error) {
//     return next(new AppError(validate.error, 400));
//   }
//   const result = await service.q3(userId, isSharesIncomeAndExpense);
//   if (result) {
//     return res.status(201).send({
//       msg: "Noted",
//       data: result,
//     });
//   } else {
//     return res.status(400).send({ msg: "Failed !" });
//   }
// });
exports.acpProgram = expressAsyncHandler(async (req, res, next) => {
  let { csr, userId, program } = req.body;
  const validate = selectProgram.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  const acpProgram = await acpService.getOne(program);
  const userInfo = await service.getByUserID(userId);
  if (acpProgram && userInfo) {
    //const verify=await service.verifyUser(userInfo,program);
    //const illegible=verify.status==='201'?true:false
    const updateInfo = await service.acpProgram(csr, userId, program);
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
exports.postpaidpaymentDetails = expressAsyncHandler(async (req, res, next) => {
  try {
    // Extract required data from the request
    const {
      customerId,
      planId,
      invoiceType,
      productName,
      selectProduct,
      planCharges,
      additionalCharges,
      discount,
      totalAmount,
      amountPaid,
      invoiceDueDate,
      billingPeriod,
      invoiceStatus,
      paymentMethod,
      invoiceOneTimeCharges,
      lateFee,
      chargingType,
      printSetting,
      planName,
      billingModel,
      paymentChannel,
      paymentId,
    } = req.body;

    const plandetail = await planservice.getOne(planId);
    console.log(plandetail);
    let Product = await billingServices.getById(selectProduct);
    const charges = await featureAmount.find({
      _id: { $in: additionalCharges },
    });

    // Extract name and amount and format according to schema
    const formattedCharges = charges?.map((charge) => ({
      name: charge.featureName,
      amount: charge.featureAmount,
    }));

    const currentPlan = {
      planId: planId,
      productName: plandetail.name,
      planCharges: plandetail.price,
      additionalCharges: formattedCharges,
      invoiceDueDate: Product.dueDate,
      discount: Product?.selectdiscount.map((discount) => ({
        name: discount.discountname, // Storing the discounted name in 'name' property
        amount: discount.amount,
      })),
      planName: plandetail.name,
      billingPeriod: {
        from: billingPeriod.from,
        to: billingPeriod.to,
      },
      chargingType: chargingType,
      printSetting: printSetting,
    };

    //Find the user by userId
    const customer = await model.findOneAndUpdate(
      { _id: customerId },
      {
        plan: planId,
        currentPlan: currentPlan,
        invoiceType,
        selectProduct: Product.inventoryType,
        totalAmount,
        amountPaid: amountPaid,
        invoiceStatus,
        paymentMethod,
        invoiceOneTimeCharges: Product.oneTimeCharge,
        lateFee: Product.latefeeCharge,
        billId: selectProduct,
        activeBillingConfiguration: {
          oneTimeCharge: Product.oneTimeCharge,
          monthlyCharge: Product.monthlyCharge,
          dueDate: Product.dueDate,
          paymentMethod: Product.paymentMethod,
          BillCreationDate: Product.BillCreationDate,
          ServiceProvider: Product.ServiceProvider,
          selectdiscount: Product?.selectdiscount.map((discount) => ({
            name: discount.discountname, // Storing the discounted name in 'name' property
            amount: discount.amount,
          })),
          additionalFeature: Product?.additionalFeature.map((charge) => ({
            name: charge.featureName, // Storing the discounted name in 'name' property
            amount: charge.featureAmount,
          })),
          applyLateFee: Product.applyLateFee,
          latefeeCharge: Product.latefeeCharge,
          subsequentBillCreateDate: Product.subsequentBillCreateDate,
          applyToCustomer: "newCustomer",
        },
        paymentChannel,
        paymentId,
      },
      { new: true }
    );
    if (!customer) {
      return res.status(400).json({ message: "customer not found" });
    }
    res.status(200).json({
      message: "Payment details stored successfully.",
      data: customer,
    });
  } catch (error) {
    console.error("Error in handling payment details:", error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});
exports.getpostpaidpayment = expressAsyncHandler(async (req, res, next) => {
  try {
    // Extract customer ID from the request parameters
    const { customerId } = req.query;

    // Find the customer by ID
    const customer = await model.findById(customerId);

    // Check if the customer exists
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Extract and send the relevant payment details
    const paymentDetails = {
      invoiceType: customer.invoiceType,
      selectProduct: customer.selectProduct,
      planCharges: customer.currentPlan.planCharges,
      additionalCharges: customer.currentPlan.additionalCharges,
      discount: customer.currentPlan.discount,
      totalAmount: customer.totalAmount,
      amountPaid: customer.amountPaid,
      invoiceDueDate: customer.invoiceDueDate,
      billingPeriod: customer.currentPlan.billingPeriod,
      invoiceStatus: customer.invoiceStatus,
      paymentMethod: customer.paymentMethod,
      invoiceOneTimeCharges: customer.invoiceOneTimeCharges,
      lateFee: customer.lateFee,
      chargingType: customer.currentPlan.chargingType,
      printSetting: customer.currentPlan.printSetting,
      planName: customer.currentPlan.planName,
      planId: customer.currentPlan.planId,
      invoiceDueDate: customer.currentPlan.invoiceDueDate,
      planId: customer.currentPlan.planId,
      invoiceDueDate: customer.currentPlan.invoiceDueDate,
      productName: customer.currentPlan.productName,
      paymentId: customer.paymentId,
      paymentChannel: customer.paymentChannel,
    };

    // Send the payment details in the response
    res.status(200).json({ paymentDetails });
  } catch (error) {
    console.error("Error in handling payment details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
exports.statusnonelectronically = expressAsyncHandler(
  async (req, res, next) => {
    try {
      const { customerId, status } = req.body;
      if (status === ACTIVE) {
        let cust = await service.getByUserID(customerId);
        console.log(cust.csr);
        const User = await adminService.getByUserID(cust.csr);
        console.log(User);
        const userRole = cust.createdBy;
        const userRoleLevel = await heirarchyService.getHeirarchyName(
          User.role.role
        );
        if (
          status !== cust.statusElectronically ||
          !cust.statusElectronically
        ) {
          return res.status(400).send({
            msg: "You cannot activate this account internally because it has not been activated by PWG",
          });
        } else {
          await service.approval(
            customerId,
            User._id,
            true,
            userRoleLevel.level,
            true,
            true
          );
          await model.findOneAndUpdate(
            { _id: customerId },
            {
              internallyactivationDate: Date.now(),
            },
            { new: true }
          );
        }
      }
      const updated = await model.findOneAndUpdate(
        { _id: customerId },
        {
          status: status,
        },
        { new: true }
      );
      if (!updated) {
        return res.status(400).send({ msg: "Status Not Updated" });
      }
      return res
        .status(200)
        .send({ msg: "Status Updated Successfully", data: updated });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send({ msg: "Internal Server Error", error: error.message });
    }
  }
);

exports.termsAndConditions = expressAsyncHandler(async (req, res, next) => {
  let { csr, userId } = req.body;
  const validate = termsAndConditions.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  const result = await service.termsAncConditions(csr, userId);
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
  let { csr, userId, plan } = req.body;
  const validate = selectPlan.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  const result = await service.plan(csr, userId, plan);
  if (result) {
    return res.status(201).send({
      msg: "Added",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed !" });
  }
});
exports.handOver = expressAsyncHandler(async (req, res, next) => {
  let { csr, userId } = req.body;
  let userlevel = [];
  const validate = handOver.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  let User = await adminService.getByUserID(csr);
  let assignToArr = [];
  let assignedToUser = [];
  console.log("user", User);
  const userRole = User.role.role;
  const userRoleLevel = await heirarchyService.getHeirarchyName(User.role.role);
  console.log(userRoleLevel);
  userlevel.push(userRoleLevel.level);
  const enrollment = await service.getByUserID(userId);
  if (
    userRole.toUpperCase() === "TEAM LEAD" ||
    userRole.toUpperCase() === "CSR" ||
    userRole.toUpperCase() === "CS"
  ) {
    const existingAssignment = await model.findOne({
      _id: userId,
      assignToQa: null, // Directly check for null, as it covers both cases
    });
    console.log("Existing Assignment:", existingAssignment);
    if (existingAssignment) {
      let QaToAssignedCust = await service.allQaAgents();
      const assignTo = QaToAssignedCust;

      assignedToUser.push(assignTo);
      console.log("assignedToUser", assignedToUser);
      // Update the document only if assignToQa is not already assigned
      await model.findOneAndUpdate(
        { _id: userId },
        {
          assignToQa: new mongoose.Types.ObjectId(QaToAssignedCust),
          assignedToUser,
        }
      );
    } else {
      await model.findOneAndUpdate(
        { _id: userId },
        { assignedToUser: enrollment.assignToQa }
      );
    }
  } else if (
    userRole.toUpperCase() === "QA AGENT" ||
    userRole.toUpperCase() === "QA MANAGER"
  ) {
    const existingAssignment = await model.findOne({
      _id: userId,
      assignToQa: { $exists: true },
    });

    if (!existingAssignment) {
      let QaToAssignedCust = User._id;

      const assignTo = QaToAssignedCust;
      assignedToUser.push(assignTo);
      await model.findOneAndUpdate(
        { _id: userId },
        { assignToQa: User._id, assignedToUser }
      );
    }
  } else if (userRole.toUpperCase() === "PROVISION AGENT") {
    const existingAssignment = await model.findOne({
      _id: userId,
      assignToQa: { $exists: true },
    });

    if (!existingAssignment) {
      let QaToAssignedCust = User._id;
      const assignTo = QaToAssignedCust;
      assignedToUser.push(assignTo);
      await model.findOneAndUpdate(
        { _id: userId },
        { assignToQa: User._id, assignedToUser }
      );
    }
  } else {
    assignedToUser.push(User._id);
    await model.findOneAndUpdate({ _id: userId }, { assignedToUser });
  }
  let currentUserReportingTo = User.reportingTo;
  if (userRoleLevel.level === 1) {
    if (enrollment.approval.length !== 0) {
      await service.approval(userId, csr, true, userRoleLevel.level);
    }

    const assignTo = User.reportingTo;
    assignToArr.push(assignTo);
    console.log(assignTo);
    if (
      enrollment.level.length == 0 ||
      (enrollment.level.length === 1 && enrollment.level[0] === 1)
    ) {
      console.log("here");
      enrollment.level = [2];
    } else {
      console.log("here here here");
      enrollment.level = enrollment.level.filter(
        (level) => level > userRoleLevel.level
      );
      console.log("enrollment.assignTo", enrollment.assignTo);
      // assignToArr = enrollment.assignTo.filter((reportingTo) => assignToArr.includes(reportingTo));
      if (enrollment.level.length == 0) {
        enrollment.level = [userRoleLevel.level + 1];
      }
    }
    if (enrollment.QualityRemarks) {
      await model.findOneAndUpdate({ _id: userId }, { QualityRemarks: "" });
    }
    if (enrollment.callQualityRemarks) {
      await model.findOneAndUpdate({ _id: userId }, { callQualityRemarks: "" });
    }
    await model.findOneAndUpdate({ _id: userId }, { status: PROSPECTED });
    console.log("enrollment.level", enrollment.level);
    var result = await service.handOver(
      enrollment.csr,
      userId,
      enrollment.level,
      assignToArr
    );
  } else {
    console.log("here is pro agent");
    const assignTo = User._id;
    assignToArr.push(assignTo);
    console.log(assignTo);
    console.log("here noww");
    enrollment.level = enrollment.level.filter(
      (level) => level > userRoleLevel.level
    );
    if (enrollment.level.length == 0) {
      enrollment.level = [userRoleLevel.level];
    }
    if (enrollment.QualityRemarks) {
      await model.findOneAndUpdate({ _id: userId }, { QualityRemarks: "" });
    }
    if (enrollment.status === REJECTED) {
      await model.findOneAndUpdate({ _id: userId }, { status: PROSPECTED });
    }
    var result = await service.handOver(
      enrollment.csr,
      userId,
      enrollment.level,
      assignToArr
    );
    console.log(enrollment.csr, User._id);
    if (enrollment.csr.equals(User._id)) {
      console.log("nnnknknknkn");
      await service.approval(userId, csr, true, userRoleLevel.level);
    }
  }
  if (result) {
    if (enrollment.accountType === "ACP") {
      await listFormFieldNames("pdf-templates/new.pdf");

      try {
        const templateBytes = await fs.readFile("pdf-templates/new.pdf");
        const pdfDoc = await PDFDocument.load(templateBytes, {
          ignoreEncryption: true,
        });
        const form = pdfDoc.getForm();
        const enrollmentData = result;

        const formattedDate = enrollmentData.createdAt.toLocaleString();
        const formattedDOB = enrollmentData.DOB.toLocaleDateString();

        // Update each field with corresponding data
        form.getTextField("id").setText(enrollmentData.enrollmentId);
        form.getTextField("date").setText(formattedDate);
        form.getTextField("signed").setText(formattedDate);
        form.getTextField("dob").setText(formattedDOB);
        form.getTextField("last").setText(enrollmentData.lastName);
        form.getTextField("first").setText(enrollmentData.firstName);
        form.getTextField("contact").setText(enrollmentData.contact);
        form.getTextField("email").setText(enrollmentData.email);
        form.getTextField("ssn").setText(enrollmentData.SSN);
        form.getTextField("signature").setText(enrollmentData.firstName);

        const checkboxFieldMap = {
          "Federal Pell Grant": "fpg",
          "Supplemental Assistance Nutrition Program (SNAP)": "sna",
          Medicaid: "medi",
          "Federal Public Housing Assistance": "fph",
          "Food Distribution Program on Indian Reservations": "fdpir",
          "Tribal Head Start": "tribal",
          "Bureau Of Indian Affairs General Assistance": "bia",
          "Supplemental Security": "ssi",
          "Tribal TANF": "tanf",
          "School Launch Or Breakfast Programme": "free",
          "Special Supplemental Nutrition Program For Women,Infants,Children (WIC)":
            "wic",
          // Add more mappings as needed
        };

        if (Array.isArray(enrollmentData.acpProgram)) {
          enrollmentData.acpProgram.forEach(async (programId) => {
            try {
              const program = await acpService.getOne(programId);
              if (program) {
                const programName = program.name.trim();
                const checkboxField = Object.keys(checkboxFieldMap).find(
                  (key) =>
                    key.trim().toLowerCase() === programName.toLowerCase()
                );

                if (checkboxField) {
                  const checkbox = form.getCheckBox(
                    checkboxFieldMap[checkboxField]
                  );
                  if (checkbox) {
                    checkbox.check("Yes");
                  } else {
                    console.error(
                      "Checkbox not found for field:",
                      checkboxFieldMap[checkboxField]
                    );
                    // Handle the case where the checkbox is not found
                  }
                } else {
                  console.error(
                    "No mapping found for program name:",
                    programName
                  );
                  // Handle the case where no mapping is found
                }
              }
            } catch (error) {
              console.error(
                `Error fetching ACP program with ID ${programId}:`,
                error
              );
            }
          });
        } else {
          // If it's not an array, assume it's a single value (ObjectId)
          const singleProgramId = enrollmentData.acpProgram.toString();
          try {
            const program = await acpService.getOne(singleProgramId);
            if (program) {
              const programName = program.name.trim();
              const checkboxField = Object.keys(checkboxFieldMap).find(
                (key) => key.trim().toLowerCase() === programName.toLowerCase()
              );

              if (checkboxField) {
                const checkbox = form.getCheckBox(
                  checkboxFieldMap[checkboxField]
                );
                if (checkbox) {
                  checkbox.check("Yes");
                } else {
                  console.error(
                    "Checkbox not found for field:",
                    checkboxFieldMap[checkboxField]
                  );
                  // Handle the case where the checkbox is not found
                }
              } else {
                console.error(
                  "No mapping found for program name:",
                  programName
                );
                // Handle the case where no mapping is found
              }
            } else {
              console.error(
                "No matching program found for ID:",
                singleProgramId
              );
              // Handle the case where no matching program is found
            }
          } catch (error) {
            console.error(
              `Error fetching ACP program with ID ${singleProgramId}:`,
              error
            );
          }
        }

        // Save the modified PDF to a file
        const outputPath = `uploads/SP_${enrollmentData.enrollmentId}.pdf`;
        const modifiedBytes = await pdfDoc.save();
        await fs.writeFile(outputPath, modifiedBytes);
        await service.updatePdfPath(enrollmentData._id, outputPath);
        res.download(outputPath, "downloaded-file.pdf");
        return res.status(200).send({ msg: "Successful", data: result });
      } catch (error) {
        console.error("PDF generation error:", error);
        return res.status(500).send({ msg: "Internal Server Error" });
      }
    } else {
      return res.status(200).send({ msg: "Successful", data: result });
    }
  } else {
    return res.status(400).send({ msg: "error occured" });
  }
});
exports.esnAssingment = expressAsyncHandler(async (req, res, next) => {
  const { csr, userId } = req.body;

  // Get user details
  const user = await adminService.getByUserID(csr);
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  const userRole = user.role.role;

  // Get user role level
  const userRoleLevel = await heirarchyService.getHeirarchyName(userRole);

  // Get enrollment details
  const enrollment = await service.getByUserID(userId);
  if (!enrollment) {
    return next(new AppError("Enrollment not found", 404));
  }

  // Get free ESN
  const esn = await simServices.getFreeWirelessDevices(
    enrollment.serviceProvider,
    enrollment.selectProduct,
    enrollment.accountType
  );

  if (!esn) {
    return res
      .status(400)
      .send({ msg: "No free ESN. Please upload ESN first to proceed" });
  }

  const result = await model.findOneAndUpdate(
    { _id: enrollment._id },
    { esn: esn?.SimNumber, esnId: esn?._id },
    { new: true }
  );
  await simInventoryService.statusUpdate(esn?.SimNumber);
  res.status(200).send({ msg: "ESN assigned successfully", data: result });
});
exports.prepaidhandOver = expressAsyncHandler(async (req, res, next) => {
  let { csr, userId, isWithoutInvoice, isWithInvoice } = req.body;
  console.log(isWithoutInvoice, isWithInvoice);
  let userlevel = [];
  const validate = prepaidhandOver.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  let User = await adminService.getByUserID(csr);
  let assignToArr = [];
  let assignedToUser = [];
  console.log("user", User);
  const userRole = User.role.role;
  const userRoleLevel = await heirarchyService.getHeirarchyName(User.role.role);
  console.log(userRoleLevel);
  userlevel.push(userRoleLevel.level);
  const enrollment = await service.getByUserID(userId);
  // var esn = await simServices.getFreeWirelessDevices(
  //   enrollment.serviceProvider,
  //   enrollment.selectProduct
  // );
  // console.log("esnnnn", esn);
  // if (!esn) {
  //   return res
  //     .status(400)
  //     .send({ msg: "No free Esn please upload Esn first to proceed" });
  // }
  let currentUserReportingTo = User.reportingTo;
  if (userRoleLevel.level === 1) {
    if (enrollment.approval.length !== 0) {
      await service.approval(userId, csr, true, userRoleLevel.level);
    }

    const assignTo = User.reportingTo;
    assignToArr.push(assignTo);
    console.log(assignTo);
    if (
      enrollment.level.length == 0 ||
      (enrollment.level.length === 1 && enrollment.level[0] === 1)
    ) {
      console.log("here");
      enrollment.level = [2];
    } else {
      console.log("here here here");
      enrollment.level = enrollment.level.filter(
        (level) => level > userRoleLevel.level
      );
      console.log("enrollment.assignTo", enrollment.assignTo);
      // assignToArr = enrollment.assignTo.filter((reportingTo) => assignToArr.includes(reportingTo));
      if (enrollment.level.length == 0) {
        enrollment.level = [userRoleLevel.level + 1];
      }
    }
    if (enrollment.QualityRemarks) {
      await model.findOneAndUpdate({ _id: userId }, { QualityRemarks: "" });
    }
    if (enrollment.callQualityRemarks) {
      await model.findOneAndUpdate({ _id: userId }, { callQualityRemarks: "" });
    }
    await model.findOneAndUpdate({ _id: userId }, { status: PROSPECTED });
    console.log("enrollment.level", enrollment.level);
    var result = await service.prepaidHandOver(
      enrollment.csr,
      userId,
      enrollment.level,
      assignToArr,
      isWithInvoice,
      isWithoutInvoice
    );
  } else {
    console.log("here is pro agent");
    const assignTo = User._id;
    assignToArr.push(assignTo);
    console.log(assignTo);
    console.log("here noww");
    enrollment.level = enrollment.level.filter(
      (level) => level > userRoleLevel.level
    );
    if (enrollment.level.length == 0) {
      enrollment.level = [userRoleLevel.level];
    }
    if (enrollment.QualityRemarks) {
      await model.findOneAndUpdate({ _id: userId }, { QualityRemarks: "" });
    }
    if (enrollment.status === REJECTED) {
      await model.findOneAndUpdate({ _id: userId }, { status: PROSPECTED });
    }
    var result = await service.prepaidHandOver(
      enrollment.csr,
      userId,
      enrollment.level,
      assignToArr,
      isWithInvoice,
      isWithoutInvoice
    );
    console.log(enrollment.csr, User._id);
    if (enrollment.csr.equals(User._id)) {
      console.log("nnnknknknkn");
      await service.approval(userId, csr, true, userRoleLevel.level);
    }
  }
  if (result) {
    await model.findOneAndUpdate(
      { _id: enrollment._id },
      { isWithInvoice, isWithoutInvoice },
      { new: true }
    );
    // await simInventoryService.statusUpdate(esn?.SimNumber);
    return res.status(200).send({ msg: "Success", data: result });
  } else {
    return res.status(400).send({ msg: "Failed to submit" });
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
exports.provisionedEnrollmentUserList = expressAsyncHandler(
  async (req, res) => {
    const { userId, accountType } = req.query; // The Team Lead for whom you want to show completed enrollments
    console.log(userId);
    const User = await adminService.getByUserID(userId);
    console.log(User);
    const userRole = User.role.role; //get user role
    if (userRole.toUpperCase() === "PROVISION AGENT") {
      const enrollments = await model
        .find({
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          accountType: accountType,
        })
        .sort({ nladEnrollmentDate: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "EnrolledBy",
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
          msg: "Showing enrolled enrollments",
          data: filteredEnrollments,
        });
      } else {
        res.status(201).send({
          msg: "No enrolled enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "PROVISION MANAGER") {
      const enrollments = await model
        .find({
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          accountType: accountType,
        })
        .sort({ nladEnrollmentDate: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "EnrolledBy",
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
            (lastApproval.level === 5 ||
              lastApproval.level === 6 ||
              lastApproval.level === 7 ||
              lastApproval.level === 8) &&
            lastApproval.isEnrolled === true &&
            lastApproval.isComplete === false;

          return isLastApprovalMatching;
        }

        // If 'approval' array is not present or empty, exclude the enrollment
        return false;
      });

      if (filteredEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments for the Team Lead's",
          data: filteredEnrollments,
        });
      } else {
        res.status(201).send({
          msg: "No rejected enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "RETENTION AGENT") {
      const enrollments = await model
        .find({
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          accountType: accountType,
        })
        .sort({ nladEnrollmentDate: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "EnrolledBy",
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
          msg: "Showing enrolled enrollments for the Team Lead's",
          data: filteredEnrollments,
        });
      } else {
        res.status(201).send({
          msg: "No enrolled enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "RETENTION MANAGER") {
      const enrollments = await model
        .find({
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          accountType: accountType,
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
          path: "EnrolledBy",
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
          msg: "Showing rejected enrollments for the Team Lead's",
          data: filteredEnrollments,
        });
      } else {
        res.status(201).send({
          msg: "No rejected enrollments found.",
        });
      }
    } else if (userRole.toUpperCase() === "Admin" || userRole === "Admin") {
      const enrollments = await model
        .find({
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          accountType: accountType,
        })
        .sort({ nladEnrollmentDate: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "EnrolledBy",
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
            (lastApproval.level === 5 ||
              lastApproval.level === 6 ||
              lastApproval.level === 7 ||
              lastApproval.level === 8) &&
            lastApproval.isEnrolled === true &&
            lastApproval.isComplete === false;

          return isLastApprovalMatching;
        }

        // If 'approval' array is not present or empty, exclude the enrollment
        return false;
      });

      if (filteredEnrollments.length > 0) {
        res.status(201).send({
          msg: "Showing provisioned enrollments",
          data: filteredEnrollments,
        });
      } else {
        res.status(201).send({
          msg: "No provisioned enrollments found.",
        });
      }
    } else {
      res.status(200).send({
        msg: "No enrollments found.",
      });
    }
  }
);
exports.completeEnrollmentUserList = expressAsyncHandler(async (req, res) => {
  const { userId, accountType } = req.query; // The Team Lead for whom you want to show completed enrollments
  console.log(userId);
  const User = await adminService.getByUserID(userId);
  console.log(User);
  const userRole = User.role.role; //get user role
  if (userRole.toUpperCase() === "PROVISION AGENT") {
    const enrollments = await model
      .find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        accountType: accountType,
        approval: {
          $elemMatch: {
            approvedBy: User._id,
            isEnrolled: true,
            isComplete: true,
          },
        },
      })
      .sort({ activatedAt: -1 })
      .populate({
        path: "plan",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "activatedBy",
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

    if (enrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments for the Team Lead's",
        data: enrollments,
      });
    } else {
      res.status(400).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  } else if (userRole.toUpperCase() === "PROVISION MANAGER") {
    const enrollments = await model
      .find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        accountType: accountType,
        approval: {
          $elemMatch: {
            level: { $in: [5, 6, 7, 8] },
            isEnrolled: true,
            isComplete: true,
          },
        },
      })
      .sort({ activatedAt: -1 })
      .populate({
        path: "plan",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "activatedBy",
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

    if (enrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments for the Team Lead's",
        data: enrollments,
      });
    } else {
      res.status(400).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  } else if (userRole.toUpperCase() === "RETENTION AGENT") {
    const enrollments = await model
      .find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        accountType: accountType,
        approval: {
          $elemMatch: {
            approvedBy: User._id,
            isEnrolled: true,
            isComplete: true,
          },
        },
      })
      .sort({ activatedAt: -1 })
      .populate({
        path: "plan",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "activatedBy",
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

    if (enrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments for the Team Lead's",
        data: enrollments,
      });
    } else {
      res.status(400).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  } else if (userRole.toUpperCase() === "RETENTION MANAGER") {
    const enrollments = await model
      .find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        accountType: accountType,
        approval: {
          $elemMatch: {
            level: { $in: [7, 8] },
            isEnrolled: true,
            isComplete: true,
          },
        },
      })
      .sort({ activatedAt: -1 })
      .populate({
        path: "plan",
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

    if (enrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments for the Team Lead's",
        data: enrollments,
      });
    } else {
      res
        .status(400)
        .send({
          msg: "No completed enrollments found for the Team Lead's.",
        })
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          select: "_id name role",
        });
    }
  } else if (userRole.toUpperCase() === "Admin" || userRole === "Admin") {
    const enrollments = await model
      .find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        accountType: accountType,
        approval: {
          $elemMatch: {
            //level: { $in: [5, 6, 7, 8] },
            isEnrolled: true,
            isComplete: true,
          },
        },
      })
      .sort({ activatedAt: -1 })
      .populate({
        path: "plan",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "activatedBy",
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

    if (enrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments for the Team Lead's",
        data: enrollments,
      });
    } else {
      res.status(400).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  } else {
    res.status(400).send({ msg: "not found" });
  }
});
exports.approvedEnrollmentList = expressAsyncHandler(async (req, res) => {
  const { userId, accountType } = req.query; // The Team Lead for whom you want to show completed enrollments
  console.log(userId);
  const User = await adminService.getByUserID(userId);
  console.log(User);
  const userRole = User.role.role; //get user role
  let enrollments = [];
  // Assuming you have a function to retrieve all CSR users reporting to the specified Team Lead
  if (
    userRole.toUpperCase() === "TEAM LEAD" ||
    userRole.toUpperCase() === "CS MANAGER"
  ) {
    const csrUsers = await adminService.getUserReportingTo(userId);
    console.log("csr users", csrUsers);
    // if (csrUsers.length === 0) {
    //   return res
    //     .status(201)
    //     .send({ msg: "No CSR users found reporting to this Team Lead." });
    // }
    const userObjectId = new mongoose.Types.ObjectId(User._id);
    console.log(userObjectId);
    // Extract the IDs of CSR users reporting to the Team Lead
    const csrIds = csrUsers.map((csr) => csr._id);
    if (accountType === accountType || accountType === accountType) {
      enrollments = await model
        .find({
          $or: [{ csr: { $in: csrIds } }, { csr: User._id }],
          accountType: accountType,
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          approval: { $elemMatch: { approved: true, level: { $in: [2, 3] } } },
          status: { $nin: ["active", "evaluation"] }, // Exclude enrollments with statuses Active and Evaluation
        })
        .sort({ approvedAt: -1 })
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
    } else {
      enrollments = await model
        .find({
          $or: [{ csr: { $in: csrIds } }, { csr: User._id }],
          accountType: accountType,
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          approval: { $elemMatch: { approved: true, level: 3 } },
        })
        .sort({ approvedAt: -1 })
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
    }

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
        data: filteredEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  } else if (
    userRole.toUpperCase() === "CSR" ||
    userRole.toUpperCase() === "CS"
  ) {
    if (accountType === accountType || accountType === accountType) {
      enrollments = await model
        .find({
          csr: User._id,
          isEnrollmentComplete: true,
          accountType: accountType,
          serviceProvider: User.company,
          status: { $nin: ["active", "evaluation"] },
          approval: {
            $elemMatch: {
              approved: true,
              level: { $in: [0, 1, 2, 3] },
            },
          },
        })
        .sort({ approvedAt: -1 })
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
    } else {
      enrollments = await model
        .find({
          csr: User._id,
          isEnrollmentComplete: true,
          accountType: accountType,
          serviceProvider: User.company,
          approval: {
            $elemMatch: {
              approved: true,
              level: 3,
            },
          },
        })
        .sort({ approvedAt: -1 })
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
    }
    console.log(enrollments);
    const filteredEnrollments = enrollments.filter((enrollment) => {
      // Check if the 'approval' array exists and is not empty
      if (enrollment.approval && enrollment.approval.length > 0) {
        // Get the last object in the 'approval' array
        const lastApproval =
          enrollment.approval[enrollment.approval.length - 1];
        console.log(lastApproval.approved);
        // Check if the last approval meets the specified conditions
        const isLastApprovalMatching =
          lastApproval.approved === true &&
          [0, 3, 4, 5, 6].includes(lastApproval.level);

        return isLastApprovalMatching;
      }

      // If 'approval' array is not present or empty, exclude the enrollment
      return false;
    });

    if (filteredEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments for the Team Lead's",
        data: filteredEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  } else if (userRole.toUpperCase() === "QA AGENT") {
    if (accountType === accountType || accountType === accountType) {
      enrollments = await model
        .find({
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          accountType: accountType,
          status: { $nin: ["active", "evaluation"] },
          approval: {
            $elemMatch: {
              approved: true,
              level: 3,
              approvedBy: User._id,
            },
          },
        })
        .sort({ approvedAt: -1 })
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
    } else {
      enrollments = await model
        .find({
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          accountType: accountType,
          approval: {
            $elemMatch: {
              approved: true,
              level: 3,
              approvedBy: User._id,
            },
          },
        })
        .sort({ approvedAt: -1 })
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
    }
    const filteredEnrollments = enrollments.filter((enrollment) => {
      // Check if the 'approval' array exists and is not empty
      if (enrollment.approval && enrollment.approval.length > 0) {
        // Get the last object in the 'approval' array
        const lastApproval =
          enrollment.approval[enrollment.approval.length - 1];
        console.log(lastApproval.approved);
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
        data: filteredEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  } else if (userRole.toUpperCase() === "QA MANAGER") {
    const enrollments = await model
      .find({
        isEnrollmentComplete: true,
        accountType: accountType,
        serviceProvider: User.company,
        // approval: {
        //   $elemMatch: {
        //     approved: true,
        //     level: {$in :[3,4]}
        //   },
        // },
      })
      .sort({ approvedAt: -1 })
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
    const filteredEnrollments = enrollments.filter((enrollment) => {
      // Check if the 'approval' array exists and is not empty
      if (enrollment.approval && enrollment.approval.length > 0) {
        const lastApproval =
          enrollment.approval[enrollment.approval.length - 1];
        // Check if the last approval meets the specified conditions
        const isLastApprovalMatching =
          lastApproval.approved === true &&
          (lastApproval.level === 3 || lastApproval.level === 4);

        return isLastApprovalMatching;
      }

      // If 'approval' array is not present or empty, exclude the enrollment
      return false;
    });

    if (filteredEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments for the Team Lead's",
        data: filteredEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  } else if (userRole.toUpperCase() === "ADMIN" || userRole === "Admin") {
    const completedEnrollments = await model
      .find({
        isEnrollmentComplete: true,
        accountType: accountType,
        approvedBy: { $exists: true },
        //createdBy: userId,
      })
      .sort({ approvedAt: -1 })
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
    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Enrollments List",
        data: completedEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No Enrolments added",
      });
    }
  } else {
    res.status(400).send({
      msg: "No enrollments found",
    });
  }
});
exports.rejectedEnrollmentUserList = expressAsyncHandler(async (req, res) => {
  const { userId, accountType } = req.query; // The Team Lead for whom you want to show completed enrollments
  console.log(userId);
  const User = await adminService.getByUserID(userId);
  console.log(User);
  const userRole = User.role.role; //get user role

  // Assuming you have a function to retrieve all CSR users reporting to the specified Team Lead
  if (
    userRole.toUpperCase() === "TEAM LEAD" ||
    userRole.toUpperCase() === "CS MANAGER"
  ) {
    const csrUsers = await adminService.getUserReportingTo(userId);
    console.log("csr users", csrUsers);
    // if (csrUsers.length === 0) {
    //   return res.status(201).send({
    //     msg: "enrolments not found as no csr is reporting to this teamlead",
    //   });
    // }
    const userObjectId = new mongoose.Types.ObjectId(User._id);
    console.log(userObjectId);
    // Extract the IDs of CSR users reporting to the Team Lead
    const csrIds = csrUsers.map((csr) => csr.department);
    const csr = csrUsers.map((csr) => csr._id);

    console.log("csr", csr);
    const enrollments = await model
      .find({
        $or: [{ createdBy: { $in: csr } }, { createdBy: User._id }],
        //createdBy:{ $in: csr },
        level: { $in: [1, 2, null, []] },
        isEnrollmentComplete: true,
        accountType: accountType,
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
        select: { _id: 1, name: 1, department: 1 },
        populate: { path: "department", select: "department" },
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
    //   const filteredEnrollments = enrollments.filter((enrollment) =>
    //   enrollment.assignTo.includes(userObjectId || [])
    // );

    if (enrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments for the Team Lead's",
        data: enrollments,
      });
    } else {
      res.status(400).send({
        msg: "No rejected enrolments found",
      });
    }
  } else if (userRole.toUpperCase() === "QA AGENT") {
    const enrollments = await model
      .find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        accountType: accountType,
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
    const filteredEnrollments = enrollments.filter((enrollment) => {
      // Check if the 'approval' array exists and is not empty
      if (enrollment.approval && enrollment.approval.length > 0) {
        // Get the last object in the 'approval' array
        const lastApproval =
          enrollment.approval[enrollment.approval.length - 1];
        const lastApprovalLevel3 = enrollment.approval
          .filter((approval) => approval.level === 3)
          .pop();
        // Check if the last approval meets the specified conditions
        const isLastApprovalMatching =
          lastApproval.approved === false &&
          ((lastApproval.level === 3 &&
            lastApproval.approvedBy.equals(User._id)) ||
            ([5, 6, 7, 8].includes(lastApproval.level) &&
              lastApprovalLevel3 &&
              lastApprovalLevel3.approved === true &&
              lastApprovalLevel3.approvedBy.equals(User._id)));

        return isLastApprovalMatching;
      }

      // If 'approval' array is not present or empty, exclude the enrollment
      return false;
    });

    if (filteredEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments",
        data: filteredEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No rejected enrollments found.",
      });
    }
  } else if (userRole.toUpperCase() === "QA MANAGER") {
    const enrollments = await model
      .find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        accountType: accountType,
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
    const filteredEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Check if the 'approval' array exists and is not empty
        if (enrollment.approval && enrollment.approval.length > 0) {
          // Get the last object in the 'approval' array
          const lastApproval =
            enrollment.approval[enrollment.approval.length - 1];

          // Fetch the user role asynchronously
          try {
            const proRole = await adminService.getByUserID(enrollment.csr);

            // Check if createdBy is not null or undefined before accessing its _id property
            const createdById = proRole ? proRole._id : null;

            // Check if createdBy is a PROVISION AGENT
            const createdByProvisionAgent =
              proRole &&
              proRole.role &&
              (proRole.role.role.toUpperCase() === "PROVISION AGENT" ||
                proRole.role.role.toUpperCase() === "PROVISION MANAGER");
            console.log(createdById);
            // Check if the creator of the enrollment is not the same as the one who rejected it
            const rejectedBySameAgent =
              lastApproval.approvedBy.equals(createdById);

            // Check if the last approval meets the specified conditions
            const isLastApprovalMatching =
              lastApproval.approved === false &&
              [3, 4, 5, 6].includes(lastApproval.level);

            return (
              isLastApprovalMatching &&
              !(createdByProvisionAgent && rejectedBySameAgent)
            );
          } catch (error) {
            // Handle the error when fetching the user role
            console.error(
              `Error fetching user role for enrollment ${enrollment._id}:`,
              error
            );
            return false;
          }
        }

        // If 'approval' array is not present or empty, exclude the enrollment
        return false;
      })
    );
    const trueIndices = filteredEnrollments.reduce((acc, value, index) => {
      if (value) {
        acc.push(index);
      }
      return acc;
    }, []);

    const trueEnrollments = trueIndices.map((index) => enrollments[index]);

    if (trueEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments",
        data: trueEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No rejected enrollments found.",
      });
    }
  } else if (userRole.toUpperCase() === "PROVISION AGENT") {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const enrollments = await model
      .find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        accountType: accountType,
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
        path: "rejectedBy", // Assuming 'rejectedBy' is a field in your schema
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

    if (enrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments",
        data: enrollments,
      });
    } else {
      res.status(400).send({
        msg: "No rejected enrollments found.",
      });
    }
  } else if (userRole.toUpperCase() === "PROVISION MANAGER") {
    const enrollments = await model
      .find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        accountType: accountType,
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
        data: filteredEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No rejected enrollments found.",
      });
    }
  } else if (userRole.toUpperCase() === "RETENTION AGENT") {
    const completedEnrollments = await model
      .find({
        department: User.department,
        isEnrollmentComplete: true,
        accountType: accountType,
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
    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments",
        data: completedEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No rejected enrollments found.",
      });
    }
  } else if (
    userRole.toUpperCase() === "CSR" ||
    userRole.toUpperCase() === "CS"
  ) {
    const enrollments = await model
      .find({
        csr: User._id,
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        accountType: accountType,
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
        path: "assignedToUser",
        populate: { path: "role", select: "role" },
        populate: { path: "department", select: "department" },
        select: "_id name role department",
      })
      .populate({
        path: "rejectedBy",
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

    if (enrollments.length > 0) {
      res.status(201).send({
        msg: "Showing rejected enrollments",
        data: enrollments,
      });
    } else {
      res.status(400).send({
        msg: "No rejected enrollments found.",
      });
    }
  } else if (userRole.toUpperCase() === "ADMIN" || userRole === "Admin") {
    const completedEnrollments = await model
      .find({
        isEnrollmentComplete: true,
        accountType: accountType,
        rejectedBy: { $exists: true },
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
        path: "assignedToUser",
        populate: { path: "role", select: "role" },
        populate: { path: "department", select: "department" },
        select: "_id name role department",
      })
      .populate({
        path: "rejectedBy",
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
    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Enrollments List",
        data: completedEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No Enrolments added",
      });
    }
  } else {
    res.status(400).send({
      msg: "No enrollments found",
    });
  }
});
exports.inCompleteEnrollmentUserList = expressAsyncHandler(async (req, res) => {
  const { userId, accountType } = req.query;
  let IncompleteEnrollmentUserList;
  const user = await adminService.getByUserID(userId);
  console.log(user);
  const userRole = user.role.role; //get user role
  if (userRole.toUpperCase() === "ADMIN" || userRole === "Admin") {
    IncompleteEnrollmentUserList = await model
      .find({
        //csr: userId,
        serviceProvider: user.company,
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
  } else {
    IncompleteEnrollmentUserList = await service.inCompleteEnrollmentUserList(
      userId,
      user.company,
      accountType
    );
  }
  if (IncompleteEnrollmentUserList) {
    return res.status(200).send({
      msg: "incomplete enrollments",
      data: IncompleteEnrollmentUserList,
    });
  } else {
    return res.status(400).send({
      msg: "no Incomplete Enrollments Found",
    });
  }
});
exports.dispatchInsight = expressAsyncHandler(async (req, res) => {
  const { userId, accountType, startDate, endDate } = req.query; // Extract start and end dates
  console.log(startDate, endDate);
  const User = await adminService.getByUserID(userId);
  //console.log(User);
  const userRole = User.role.role; // Get user role

  if (
    userRole.toUpperCase() === "TEAM LEAD" ||
    userRole.toUpperCase() === "CS MANAGER"
  ) {
    const csrUsers = await adminService.getUserReportingTo(userId);
    //console.log("csr users", csrUsers);
    // if (csrUsers.length === 0) {
    //   return res
    //     .status(201)
    //     .send({ msg: "No CSR users found reporting to this Team Lead." });
    // }
    const userObjectId = new mongoose.Types.ObjectId(User._id);
    //console.log(userObjectId);
    const csrIds = csrUsers.map((csr) => csr._id);
    console.log(csrIds);
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
    const enrollments = await model
      .find({
        $or: [{ csr: { $in: csrIds } }, { csr: User._id }],
        accountType: accountType,
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        status: {
          $in: [
            "labelCreated",
            "labelPrinted",
            "preShipment",
            "inTransit",
            "delivered",
            "evaluation", // Including evaluation status
          ],
        },
        approval: {
          $elemMatch: {
            approved: true,
            level: 3,
          },
        },
        approvedAt: {
          $gte: startISOWithoutTZ,
          $lte: endISOWithoutTZ,
        },
      })
      .sort({ approvedAt: -1 })
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
    // .populate({
    //   path: "invoice",
    //   select:
    //     "plan stripeId additionalFeature totalAmount status billingPeriod discount invoiceNumber",
    //   populate: [
    //     {
    //       path: "discount",
    //       select: "discountname amount",
    //     },
    //     {
    //       path: "additionalFeature",
    //       select: "featureName featureAmount",
    //     },
    //     {
    //       path: "plan",
    //       select: "_id name description price",
    //     },
    //     {
    //       path: "billId",
    //       select: "inventoryType",
    //     },
    //   ],
    // });
    console.log(enrollments.length);
    const enrollmentsByStatus = {};
    enrollments.forEach((enrollment) => {
      const status = enrollment.status;
      if (!enrollmentsByStatus[status]) {
        enrollmentsByStatus[status] = [];
      }
      enrollmentsByStatus[status].push(enrollment);
    });

    // Include evaluation enrollments in delivered stats
    enrollmentsByStatus["delivered"] = (
      enrollmentsByStatus["delivered"] || []
    ).concat(enrollmentsByStatus["evaluation"] || []);

    const totalCount = enrollments.length;

    const responseData = {
      totalCount: totalCount,
      enrollments: enrollments,
      statusCounts: Object.keys(enrollmentsByStatus).reduce((acc, status) => {
        acc[status] = enrollmentsByStatus[status].length;
        return acc;
      }, {}),
      enrollmentsByStatus: enrollmentsByStatus,
    };

    if (totalCount > 0) {
      res.status(201).send({
        msg: "Showing enrollments for the Team Lead",
        data: responseData,
      });
    } else {
      res.status(400).send({
        msg: "No completed enrollments found for the Team Lead's.",
      });
    }
  } else {
    return res.status(400).send({ msg: "No user found" });
  }
});
exports.prePostCompletedEnrollmentsList = expressAsyncHandler(
  async (req, res) => {
    const { userId, accountType } = req.query; // The Team Lead for whom you want to show completed enrollments
    console.log(userId);
    const User = await adminService.getByUserID(userId);
    console.log(User);
    const userRole = User.role.role; //get user role
    if (userRole.toUpperCase() === "QA AGENT") {
      const enrollments = await model
        .find({
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          accountType: accountType,
          approval: {
            $elemMatch: {
              approvedBy: User._id,
              isEnrolled: true,
              isComplete: true,
            },
          },
        })
        .sort({ activatedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "activatedBy",
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

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments for the Team Lead's",
          data: enrollments,
        });
      } else {
        res.status(400).send({
          msg: "No active sales found in completed enrolments.",
        });
      }
    } else if (
      userRole.toUpperCase() === "TEAM LEAD" ||
      userRole.toUpperCase() === "CS MANAGER"
    ) {
      const csrUsers = await adminService.getUserReportingTo(userId);
      console.log("csr users", csrUsers);
      // if (csrUsers.length === 0) {
      //   return res
      //     .status(201)
      //     .send({ msg: "No CSR users found reporting to this Team Lead." });
      // }
      const userObjectId = new mongoose.Types.ObjectId(User._id);
      console.log(userObjectId);
      // Extract the IDs of CSR users reporting to the Team Lead
      const csrIds = csrUsers.map((csr) => csr._id);
      const enrollments = await model
        .find({
          $or: [{ csr: { $in: csrIds } }, { csr: User._id }],
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          accountType: accountType,
          status: ACTIVE,
        })
        .sort({ activatedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "activatedBy",
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

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments for the Team Lead's",
          data: enrollments,
        });
      } else {
        res.status(400).send({
          msg: "No active sales found in completed enrolments.",
        });
      }
    } else if (
      userRole.toUpperCase() === "CSR" ||
      userRole.toUpperCase() === "CS"
    ) {
      const enrollments = await model
        .find({
          createdBy: User._id,
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          accountType: accountType,
          status: ACTIVE,
        })
        .sort({ activatedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "activatedBy",
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

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments for the Team Lead's",
          data: enrollments,
        });
      } else {
        res.status(400).send({
          msg: "No active sales found in completed enrolments",
        });
      }
    } else if (userRole.toUpperCase() === "ADMIN" || userRole === "Admin") {
      const enrollments = await model
        .find({
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          accountType: accountType,
          approval: {
            $elemMatch: {
              //approvedBy: User._id,
              isEnrolled: true,
              isComplete: true,
            },
          },
        })
        .sort({ activatedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "activatedBy",
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

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing rejected enrollments for the Team Lead's",
          data: enrollments,
        });
      } else {
        res.status(400).send({
          msg: "No active sales found in completed enrolments.",
        });
      }
    } else {
      res.status(400).send({ msg: "Activated Enrollments Not Found" });
    }
  }
);
exports.prePostEvaluatedEnrollmentsList = expressAsyncHandler(
  async (req, res) => {
    const { userId, accountType } = req.query; // The Team Lead for whom you want to show completed enrollments
    console.log(userId);
    const User = await adminService.getByUserID(userId);
    console.log(User);
    const userRole = User.role.role; //get user role
    if (userRole.toUpperCase() === "CSR" || userRole.toUpperCase() === "CS") {
      const enrollments = await model
        .find({
          //createdBy: User._id,
          status: "evaluation",
          serviceProvider: User.company,
          isEnrollmentComplete: true,
          accountType: accountType,
        })
        .sort({ activatedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "activatedBy",
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

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing evaluation enrollments",
          data: enrollments,
        });
      } else {
        res.status(400).send({
          msg: "No enrolments under evaluation found",
        });
      }
    } else if (
      userRole.toUpperCase() === "TEAM LEAD" ||
      userRole.toUpperCase() === "CS MANAGER"
    ) {
      console.log("asdasdasdasdasdasd");
      const csrUsers = await adminService.getUserReportingTo(userId);
      console.log("csr users", csrUsers);
      // if (csrUsers.length === 0) {
      //   return res
      //     .status(201)
      //     .send({ msg: "No CSR users found reporting to this Team Lead." });
      // }
      const userObjectId = new mongoose.Types.ObjectId(User._id);
      // Extract the IDs of CSR users reporting to the Team Lead
      const csrIds = csrUsers.map((csr) => csr._id);
      console.log(csrIds);
      const enrollments = await model
        .find({
          $or: [{ csr: { $in: csrIds } }, { csr: User._id }],
          accountType: accountType,
          isEnrollmentComplete: true,
          serviceProvider: User.company,
          status: "evaluation",
        })
        .sort({ approvedAt: -1 })
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
      // const filteredEnrollments = enrollments.filter((enrollment) => {
      //   // Check if the 'approval' array exists and is not empty
      //   if (enrollment.approval && enrollment.approval.length > 0) {
      //     // Get the last object in the 'approval' array
      //     const lastApproval =
      //       enrollment.approval[enrollment.approval.length - 1];
      //     // Check if the last approval meets the specified conditions
      //     const isLastApprovalMatching =
      //       lastApproval.approved === true &&
      //       [1, 2, 3, 4, 5, 6].includes(lastApproval.level);

      //     return isLastApprovalMatching;
      //   }

      //   // If 'approval' array is not present or empty, exclude the enrollment
      //   return false;
      // });
      console.log(enrollments);
      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing evaluated enrollments for the Team Lead's",
          data: enrollments,
        });
      } else {
        res.status(400).send({
          msg: "No enrolments under evaluation found",
        });
      }
    } else if (userRole.toUpperCase() === "ADMIN" || userRole === "Admin") {
      const enrollments = await model
        .find({
          //createdBy: User._id,
          status: "evaluation",
          serviceProvider: User.company,
          isEnrollmentComplete: true,
          accountType: accountType,
        })
        .sort({ activatedAt: -1 })
        .populate({
          path: "plan",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "createdBy",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "activatedBy",
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

      if (enrollments.length > 0) {
        res.status(201).send({
          msg: "Showing evaluation enrollments",
          data: enrollments,
        });
      } else {
        res.status(400).send({
          msg: "No enrolments under evaluation found",
        });
      }
    } else {
      res.status(400).send({ msg: "not found" });
    }
  }
);
exports.disconnectionList = expressAsyncHandler(async (req, res) => {
  const { userId, accountType } = req.query; // The Team Lead for whom you want to show completed enrollments
  console.log(userId);
  const User = await adminService.getByUserID(userId);
  console.log(User);
  const userRole = User.role.role; //get user role
  if (userRole.toUpperCase() === "CSR" || userRole.toUpperCase() === "CS") {
    const enrollments = await model
      .find({
        createdBy: User._id,
        status: "disconnected",
        serviceProvider: User.company,
        isEnrollmentComplete: true,
        accountType: accountType,
      })
      .sort({ activatedAt: -1 })
      .populate({
        path: "plan",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "activatedBy",
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

    if (enrollments.length > 0) {
      res.status(201).send({
        msg: "Showing evaluation enrollments",
        data: enrollments,
      });
    } else {
      res.status(400).send({
        msg: "No enrolments under evaluation found",
      });
    }
  } else if (
    userRole.toUpperCase() === "TEAM LEAD" ||
    userRole.toUpperCase() === "CS MANAGER"
  ) {
    console.log("asdasdasdasdasdasd");
    const csrUsers = await adminService.getUserReportingTo(userId);
    console.log("csr users", csrUsers);
    // if (csrUsers.length === 0) {
    //   return res
    //     .status(201)
    //     .send({ msg: "No CSR users found reporting to this Team Lead." });
    // }
    const userObjectId = new mongoose.Types.ObjectId(User._id);
    // Extract the IDs of CSR users reporting to the Team Lead
    const csrIds = csrUsers.map((csr) => csr._id);
    console.log(csrIds);
    const enrollments = await model
      .find({
        $or: [{ csr: { $in: csrIds } }, { csr: User._id }],
        accountType: accountType,
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        status: "disconnected",
      })
      .sort({ approvedAt: -1 })
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
    // const filteredEnrollments = enrollments.filter((enrollment) => {
    //   // Check if the 'approval' array exists and is not empty
    //   if (enrollment.approval && enrollment.approval.length > 0) {
    //     // Get the last object in the 'approval' array
    //     const lastApproval =
    //       enrollment.approval[enrollment.approval.length - 1];
    //     // Check if the last approval meets the specified conditions
    //     const isLastApprovalMatching =
    //       lastApproval.approved === true &&
    //       [1, 2, 3, 4, 5, 6].includes(lastApproval.level);

    //     return isLastApprovalMatching;
    //   }

    //   // If 'approval' array is not present or empty, exclude the enrollment
    //   return false;
    // });
    console.log(enrollments);
    if (enrollments.length > 0) {
      res.status(201).send({
        msg: "Showing evaluated enrollments for the Team Lead's",
        data: enrollments,
      });
    } else {
      res.status(400).send({
        msg: "No enrolments under evaluation found",
      });
    }
  } else {
    res.status(400).send({ msg: "not found" });
  }
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
exports.signup = expressAsyncHandler(async (req, res, next) => {
  const {
    fullName,
    contact,
    alternateContact,
    email,
    address,
    SSN,
    DOB,
    serviceProvider,
  } = req.body;

  const [firstName, ...lastNameArray] = fullName.split(" ");
  const lastName = lastNameArray.join(" ");
  let imageUrl = null;
  let enrollment = enrollmentId();
  let accountId = SixDigitUniqueId();
  // Check if file was uploaded
  if (req.file) {
    imageUrl = req.file.path; // Store the image path securely
    console.log("Image uploaded successfully:", imageUrl);
  }

  // Validate input
  const validate = validateSignup.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }

  try {
    // Check if both email and contact are already registered
    const existingUser = await model.findOne({ email, contact });
    // Check if password field is available
    if (existingUser && existingUser.password) {
      // User exists with password field - account already registered
      return res.status(400).send({
        msg: "Account is already registered.",
      });
    }
    if (existingUser) {
      // User already exists

      if (!existingUser.otpVerified) {
        // User exists but OTPs not verified - resend OTPs
        const otpEmail = generateOtp();
        const otpContact = generateOtp();

        await model.findByIdAndUpdate(
          existingUser._id,
          { otpEmail, otpContact },
          { new: true }
        );

        console.log("Sending OTPs for existing user");
        // Send OTPs as in the original code

        return res.status(200).send({
          msg: "User already exists. Please check your email and contact number for OTPs to update password.",
        });
      }

      // User exists with verified OTPs - allow password update
      return res.status(200).send({
        msg: "User already exists. Please proceed to emailotpverification or verifyContactOtp to update password.",
      });
    } else {
      // Create a new user
      const user = new model({
        firstName: firstName.toUpperCase(),
        lastName: lastName.toUpperCase(),
        contact,
        email,
        address1: address,
        serviceProvider,
        SSN,
        DOB,
        alternateContact,
        imageUrl,
        enrollmentId: enrollment,
        accountId,
      });

      // Save user data to the database
      await user.save();

      // Generate and store secure OTPs
      const otpEmail = generateOtp();
      const otpContact = generateOtp();
      user.otpEmail = otpEmail;
      user.otpContact = otpContact;
      user.otpCreatedAt = Date.now(); // Track OTP creation time for validation

      await user.save(); // Save updated user with OTPs

      console.log("Sending OTPs for new user");
      var accessToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
        expiresIn: "15m",
      });

      // Generate refresh token
      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.SECRET_KEY
      );

      // Store tokens in the database
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      await user.save();

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

      // Send OTP to email
      const mailOptions = {
        from: process.env.MAIL,
        to: email,
        subject: "your otp for your email",
        html: `Your otp for the email is: ${otpEmail}`,
      };
      await transporter.sendMail(mailOptions);

      // Send OTP to contact number
      await signalwireClient.messages.create({
        from: "+18334358883",
        to: `+1${contact}`,
        body: `Your OTP for contact number verification is: ${otpContact}`,
      });

      return res.status(200).send({
        accessToken: accessToken,
        msg: "Please check your email and contact number for OTPs.",
      });
    }
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
});

exports.emailotpverification = expressAsyncHandler(async (req, res) => {
  const { email, otpEmail, serviceProvider } = req.body;

  const validate = validateEmailOtp.validate(req.body);
  if (validate.error) {
    return res.status(400).send({ error: validate.error.details[0].message });
  }

  try {
    const user = await model.findOne({
      email,
      otpEmail,
      serviceProvider,
      otpVerified: false, // Verify user hasn't already verified email OTP
    });

    if (!user || isOtpExpired(user.otpCreatedAt)) {
      return res
        .status(400)
        .send({ error: "Invalid or expired OTP or user not found." });
    }

    // Update email verification status (optional, might be handled differently in your app)
    // Assuming verification is done here
    await user.save();

    res.status(200).send({ msg: "Email verified successfully." });
  } catch (error) {
    console.error("Error verifying email OTP:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

exports.verifyContactOtp = expressAsyncHandler(async (req, res) => {
  const { contact, otpContact, serviceProvider } = req.body;

  const validate = validateContactOtp.validate(req.body);
  if (validate.error) {
    return res.status(400).send({ error: validate.error.details[0].message });
  }

  try {
    const user = await model.findOne({
      contact,
      otpContact,
      serviceProvider,
      otpVerified: false, // Verify user hasn't already verified contact OTP
    });
    console.log(user);
    if (!user || isOtpExpired(user.otpCreatedAt)) {
      return res
        .status(400)
        .send({ error: "Invalid or expired OTP or user not found." });
    }

    // Update contact verification status
    user.otpVerified = true;
    await user.save();

    res.status(200).send({ msg: "Contact number verified successfully." });
  } catch (error) {
    console.error("Error verifying contact OTP:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});
exports.updatePassword = expressAsyncHandler(async (req, res) => {
  const { email, contact, password, confirmPassword, serviceProvider } =
    req.body;

  // Validate password and confirmPassword
  const validate = validatePasswordUpdate.validate(req.body);
  if (validate.error) {
    return res.status(400).send({ error: validate.error.details[0].message });
  }

  // Check if password and confirmPassword match
  if (password !== confirmPassword) {
    return res
      .status(400)
      .send({ error: "Password and confirm password do not match." });
  }

  try {
    const user = await model.findOne({ email, contact, serviceProvider });

    if (!user) {
      return res.status(400).send({ error: "User not found." });
    }

    // Hash the password securely (using a strong algorithm like bcrypt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).send({ msg: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});
exports.mobilelogin = expressAsyncHandler(async (req, res) => {
  const { contact, password, serviceProvider } = req.body;
  if (!contact || !password) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  const user = await service.logins(contact, serviceProvider);
  console.log(user);
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
    res.status(400).send({
      msg: "Invalid Credentials!",
    });
  }
});
exports.resendEmailOtp = expressAsyncHandler(async (req, res, next) => {
  const { email, serviceProvider } = req.body;

  // Validate input
  const validate = validateEmailOtpResend.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }

  try {
    // Check if email is already registered
    const user = await model.findOne({ email, serviceProvider });
    if (!user) {
      return res.status(400).send({ error: "Email is not registered." });
    }

    // Generate a new email OTP
    const newOtpEmail = generateOtp();

    // Update the user's email OTP in the database
    user.otpEmail = newOtpEmail;
    await user.save();

    // Send the new email OTP
    const transporter = nodemailer.createTransport({
      host: process.env.MAILHOST,
      port: process.env.MAILPORT,
      secure: false,
      auth: {
        user: process.env.MAIL,
        pass: process.env.MAILPASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL,
      to: email,
      subject: "Resend OTP for Email Verification",
      html: `Your new OTP for email verification is: ${newOtpEmail}`,
    };
    await transporter.sendMail(mailOptions);

    res.status(200).send({ msg: "New OTP sent to your email." });
  } catch (error) {
    console.error("Error during OTP resend:", error);
    res.status(500).send({ error: "Internal Server Error", error: error });
  }
});
exports.resendContactOtp = expressAsyncHandler(async (req, res, next) => {
  const { contact, serviceProvider } = req.body;

  // Validate input
  const validate = validateContactOtpResend.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }

  try {
    // Check if contact number is already registered
    const user = await model.findOne({ contact, serviceProvider });
    if (!user) {
      return res
        .status(400)
        .send({ error: "Contact number is not registered." });
    }

    // Generate a new contact number OTP
    const newOtpContact = generateOtp();

    // Update the user's contact number OTP in the database
    user.otpContact = newOtpContact;
    console.log(user.otpContact);
    await user.save();
    // Send the new contact number OTP
    await signalwireClient.messages.create({
      from: "+18334358883",
      to: `+1${contact}`,
      body: `Your new OTP for contact number verification is: ${newOtpContact}`,
    });

    res.status(200).send({ msg: "New OTP sent to your contact number." });
  } catch (error) {
    console.error("Error during OTP resend:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

exports.mobileforgetPassword = expressAsyncHandler(async (req, res) => {
  const { contact, email, enrollmentId, serviceProvider } = req.body;
  console.log(req.body);
  let user;

  // Determine which identifier the user has provided
  if (email) {
    console.log(email);
    user = await service.isUserfor(null, null, email, serviceProvider);
  } else if (contact) {
    user = await service.isUserfor(contact, null, null, serviceProvider);
  } else if (enrollmentId) {
    user = await service.isUserfor(null, enrollmentId, null, serviceProvider);
  } else {
    return res.status(400).send({
      msg: "Please provide a valid email, contact number, or enrollment ID",
    });
  }
  if (!user) {
    return res.status(400).send({ msg: "User not found" });
  }

  // Generate a unique 6-digit verification code
  const verificationCode = await service.generateVerificationCode();

  // Set the code and expiration time in the user's document
  user.resetToken = verificationCode;
  user.otpExpire = new Date(Date.now() + 5 * 60 * 1000); // Set expiration to 5 minutes
  await user.save();

  try {
    // Determine how to notify the user based on the provided identifier
    if (email) {
      // Assuming the user object has the resetToken field
      const resetToken = user.resetToken;

      // Send the email with reset token
      const transporter = nodemailer.createTransport({
        host: process.env.MAILHOST,
        port: process.env.MAILPORT,
        secure: false,
        auth: {
          user: process.env.MAIL,
          pass: process.env.MAILPASS,
        },
      });
      const mailOptions = {
        from: process.env.MAIL,
        to: email,
        subject: "Reset Password Verification",
        html: `Your reset token is: ${resetToken}`,
      };
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email} with reset token: ${resetToken}`);
    } else if (contact) {
      // Send SMS with reset token
      const resetToken = user.resetToken;

      try {
        await signalwireClient.messages.create({
          from: "+18334358883", // Update with your SignalWire phone number
          to: `+1${contact}`,
          body: `Your reset token is: ${resetToken}`,
        });
        console.log(
          `SMS sent to ${contact} successfully with reset token: ${resetToken}`
        );
      } catch (smsError) {
        console.error("Error sending SMS:", smsError);
        throw smsError; // Rethrow the error to be caught by the main catch block
      }
    } else if (enrollmentId) {
      let userEmail = user.email;

      const resetToken = user.resetToken; // Get the reset token from the user object

      const newOtpEmail = generateOtp();
      // Update the user's email OTP in the database
      user.otpEmail = newOtpEmail;
      await user.save();

      // Send the new email OTP to the user's email associated with the enrollment ID
      const transporter = nodemailer.createTransport({
        host: process.env.MAILHOST,
        port: process.env.MAILPORT,
        secure: false,
        auth: {
          user: process.env.MAIL,
          pass: process.env.MAILPASS,
        },
      });
      const mailOptions = {
        from: process.env.MAIL,
        to: userEmail,
        subject: "OTP for Forgot Password Verification",
        html: `Your new OTP for verification is: ${newOtpEmail}. Your reset token is: ${resetToken}`, // Include reset token in the email content
      };
      await transporter.sendMail(mailOptions);
      console.log(
        `Email sent to ${userEmail} with verification code: ${verificationCode}`
      );
    }

    res.status(200).send({ msg: "Verification code sent successfully" });
  } catch (error) {
    console.error("Error sending verification code:", error);
    res.status(500).send({ msg: "Failed to send verification code" });
  }
});

exports.verifyToken = expressAsyncHandler(async (req, res) => {
  const { contact, email, verificationCode, serviceProvider } = req.body;

  if (!email && !contact) {
    return res.status(400).send({
      msg: "Please provide a valid email or contact number",
    });
  }

  let user;
  if (email) {
    user = await service.isUserfor(null, null, email, serviceProvider);
  } else if (contact) {
    user = await service.isUserfor(contact, null, null, serviceProvider);
  }

  if (!user) {
    return res.status(400).send({ msg: "User not found" });
  }

  const verifiedUser = await service.verify(contact, email, serviceProvider);

  if (
    !verifiedUser ||
    (email && verifiedUser.resetToken !== verificationCode) ||
    (contact && verifiedUser.resetToken !== verificationCode) ||
    isTokenExpired(user.otpExpire)
  ) {
    return res
      .status(400)
      .send({ msg: "Invalid or expired verification code" });
  }

  res.status(200).send({ msg: "Verification code verified successfully" });
});

// Function to check if the token has expired
function isTokenExpired(expirationDate) {
  return new Date() > new Date(expirationDate);
}

exports.resetPassword = expressAsyncHandler(async (req, res) => {
  const { contact, email, password, confirmPassword, serviceProvider } =
    req.body;

  // Validate password and confirmPassword
  const validate = validatePasswordUpdateReset.validate({
    email,
    contact,
    password,
    confirmPassword,
    serviceProvider,
  });

  if (validate.error) {
    return res.status(400).send({ error: validate.error.details[0].message });
  }

  // Find the user by email or contact
  const user = await service.verify(contact, email, serviceProvider);

  if (!user) {
    return res.status(400).send({ error: "User not found." });
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update the user's password
  user.password = hashedPassword;
  await user.save();

  res.status(200).send({ msg: "Password reset successfully." });
});
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
// exports.resetPassword = expressAsyncHandler(async (req, res) => {
//   const { userId, password, reEnterPassword } = req.body;
//   console.log(password, reEnterPassword);
//   if (password !== reEnterPassword) {
//     return res.status(400).send({ msg: "Passwords Don't Match" });
//   }
//   if (!passwordValidator.schema.validate(password)) {
//     return res.status(400).send({
//       msg: "Password must have at least:1 uppercase letter,1 lowercase letter,1 number and 1 special character",

//       //validator.schema.validate(password, { list: true }),
//     });
//   }
//   const result = await service.setNewPassword(userId, password);
//   if (result) {
//     res.status(200).json({ msg: "Password reset!", data: result });
//   } else {
//     res.status(400).json({ msg: "password failed to reset" });
//   }
// });

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

// Approval Api
exports.approval = expressAsyncHandler(async (req, res) => {
  const { enrolmentId, approvedBy, approved } = req.body;
  if (!enrolmentId || !approvedBy || !approved) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  let incLevel;
  const User = await adminService.getByUserID(approvedBy);
  console.log("user", User);
  const enrolmentLevel = await service.getByUserID(enrolmentId);
  const userRoleLevel = await heirarchyService.getHeirarchyName(User.role.role);
  console.log(userRoleLevel.level);
  const enrolmentLevelCheck = await model.findOne({ _id: enrolmentId });
  console.log(enrolmentLevelCheck);
  let assignToArr = [];
  let assignedToUser = [];
  let assignTo = User.reportingTo;
  assignToArr.push(assignTo);
  if (
    enrolmentLevelCheck.level === null ||
    enrolmentLevelCheck.level.length == 0
  ) {
    if (userRoleLevel.level === 3) {
    }
    console.log("here");
    incLevel = [userRoleLevel.level + 1];
    await model.findOneAndUpdate(
      { _id: enrolmentId },
      {
        level: incLevel,
        department: User.department,
        assignTo: assignToArr,
        assignToQa: null,
        status: PROSPECTED,
        approvedBy: User._id,
        approvedAt: Date.now(),
      },
      { new: true } // Ensures you get the updated document
    );
  } else {
    if (userRoleLevel.level === 5) {
      incLevel = [enrolmentLevel.level + 2];
      console.log("here here");
      await model.findOneAndUpdate(
        { _id: enrolmentId },
        {
          level: incLevel,
          department: User.department,
          assignTo: [],
          status: PROSPECTED,
          approvedBy: User._id,
          approvedAt: Date.now(),
        },
        { new: true } // Ensures you get the updated document
      );
    } else if (userRoleLevel.level === 3) {
      console.log("here");
      const proAgent = await service.allProAgents();

      // // Check if there is a rejected approval with level 5
      const lastRejectedApproval = await model.findOne(
        { _id: enrolmentId, "approval.level": 5 },
        { "approval.$": 1 }
      );
      console.log("lastRejectedApproval", lastRejectedApproval);
      let assignToQa = lastRejectedApproval
        ? lastRejectedApproval.approval[0].approvedBy
        : proAgent;
      incLevel = [userRoleLevel.level + 2];
      await model.findOneAndUpdate(
        { _id: enrolmentId },
        {
          level: incLevel,
          department: User.department,
          assignTo: assignToArr,
          assignToQa,
          assignedToUser: proAgent,
          status: PROSPECTED,
          approvedBy: User._id,
          approvedAt: Date.now(),
        },
        { new: true } // Ensures you get the updated document
      );
    } else {
      if (enrolmentLevelCheck.level.length == 1) {
        console.log("here");
        incLevel = [userRoleLevel.level + 1];
      } else {
        incLevel = enrolmentLevelCheck.level.filter(
          (level) => level > userRoleLevel.level
        );
        if (incLevel.length == 0) {
          incLevel = [userRoleLevel.level + 1];
        }
      }
      //const incLevel = [userRoleLevel.level + 1];
      console.log("here here");
      await model.findOneAndUpdate(
        { _id: enrolmentId },
        {
          level: incLevel,
          department: User.department,
          assignTo: assignToArr,
          status: PROSPECTED,
          approvedBy: User._id,
          approvedAt: Date.now(),
        },
        { new: true } // Ensures you get the updated document
      );
    }
  }

  //const userRoleLevel = await heirarchyService.getHeirarchyName(User.role.role);
  console.log(userRoleLevel.level);
  const result = await service.approval(
    enrolmentId,
    approvedBy,
    approved,
    userRoleLevel.level,
    false,
    false
  );
  if (result) {
    return res.status(200).send({ msg: "approved", data: result });
  } else {
    return res.status(400).send({ msg: "not approved" });
  }
});
exports.prePostapproval = expressAsyncHandler(async (req, res) => {
  const { enrolmentId, approvedBy, approved } = req.body;
  if (!enrolmentId || !approvedBy || !approved) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  let incLevel;
  let reportingTo;
  const User = await adminService.getByUserID(approvedBy);
  console.log("user", User);
  const enrolmentLevel = await service.getByUserID(enrolmentId);
  const userRoleLevel = await heirarchyService.getHeirarchyName(User.role.role);
  console.log(userRoleLevel.level);
  const enrolmentLevelCheck = await model.findOne({ _id: enrolmentId });
  console.log(enrolmentLevelCheck);
  const createdBy = await adminService.getByUserID(enrolmentLevel.createdBy);
  console.log("createdBy", createdBy.role.role);
  if (createdBy.role.role.toUpperCase() === "CSR") {
    reportingTo = createdBy.reportingTo;
    console.log("reportinTo", reportingTo);
  } else {
    reportingTo = createdBy._id;
  }
  let assignToArr = [];
  let assignedToUser = [];
  let assignTo = User.reportingTo;
  assignToArr.push(reportingTo);
  var esn = await simServices.getFreeWirelessDevices(
    enrolmentLevel.serviceProvider,
    enrolmentLevel.selectProduct,
    enrolmentLevel.accountType
  );
  if (!esn) {
    return res
      .status(400)
      .send({ msg: "No free Esn please upload Esn first to proceed" });
  }
  if (
    enrolmentLevelCheck.level === null ||
    enrolmentLevelCheck.level.length == 0
  ) {
    if (userRoleLevel.level === 3) {
    }
    console.log("here");
    incLevel = [userRoleLevel.level + 1];
    await model.findOneAndUpdate(
      { _id: enrolmentId },
      {
        level: incLevel,
        department: User.department,
        assignTo: assignToArr,
        assignToQa: null,
        status: PROSPECTED,
        approvedBy: User._id,
        approvedAt: Date.now(),
      },
      { new: true } // Ensures you get the updated document
    );
  } else {
    if (userRoleLevel.level === 5) {
      incLevel = [enrolmentLevel.level + 2];
      console.log("here here");
      await model.findOneAndUpdate(
        { _id: enrolmentId },
        {
          level: incLevel,
          department: User.department,
          assignTo: [],
          status: PROSPECTED,
          approvedBy: User._id,
          approvedAt: Date.now(),
        },
        { new: true } // Ensures you get the updated document
      );
    } else if (userRoleLevel.level === 3) {
      console.log("here nowwww");
      // const proAgent = await service.allProAgents();

      // // Check if there is a rejected approval with level 5
      const lastRejectedApproval = await model.findOne(
        { _id: enrolmentId, "approval.level": 5 },
        { "approval.$": 1 }
      );
      console.log("lastRejectedApproval", lastRejectedApproval);
      // let assignToQa = lastRejectedApproval
      //   ? lastRejectedApproval.approval[0].approvedBy
      //   : proAgent;
      incLevel = [userRoleLevel.level - 1];
      const appResult = await model.findOneAndUpdate(
        { _id: enrolmentId },
        {
          level: incLevel,
          department: User.department,
          assignTo: assignToArr,
          assignedToUser: assignToArr,
          status: "labelCreated",
          approvedBy: User._id,
          approvedAt: Date.now(),
        },
        { new: true } // Ensures you get the updated document
      );
      if (appResult) {
        await model.findOneAndUpdate(
          { _id: enrolmentLevel._id },
          { esn: esn?.SimNumber, esnId: esn?._id },
          { new: true }
        );
        await simInventoryService.statusUpdate(esn?.SimNumber);
      }
    } else {
      if (enrolmentLevelCheck.level.length == 1) {
        console.log("here");
        incLevel = [userRoleLevel.level + 1];
      } else {
        incLevel = enrolmentLevelCheck.level.filter(
          (level) => level > userRoleLevel.level
        );
        if (incLevel.length == 0) {
          incLevel = [userRoleLevel.level + 1];
        }
      }
      //const incLevel = [userRoleLevel.level + 1];
      console.log("here here");
      await model.findOneAndUpdate(
        { _id: enrolmentId },
        {
          level: incLevel,
          department: User.department,
          assignTo: assignToArr,
          status: PROSPECTED,
          approvedBy: User._id,
          approvedAt: Date.now(),
        },
        { new: true } // Ensures you get the updated document
      );
    }
  }

  //const userRoleLevel = await heirarchyService.getHeirarchyName(User.role.role);
  console.log(userRoleLevel.level);
  const result = await service.approval(
    enrolmentId,
    approvedBy,
    approved,
    userRoleLevel.level,
    false,
    false
  );
  if (!esn) {
    return res
      .status(400)
      .send({ msg: "approved but no available esn found", data: result });
  }
  if (result) {
    return res.status(200).send({ msg: "approved", data: result });
  } else {
    return res.status(400).send({ msg: "not approved" });
  }
});

// BatchApprovalApi
exports.batchApproval = expressAsyncHandler(async (req, res) => {
  const { enrolmentIds, approvedBy, approved } = req.body;

  const resultArray = [];

  for (const enrolmentId of enrolmentIds) {
    // Your existing approval logic for a single user goes here
    // Make sure to modify the logic accordingly

    // Example:
    const User = await adminService.getByUserID(approvedBy);
    const enrolmentLevel = await service.getByUserID(enrolmentId);
    const userRoleLevel = await heirarchyService.getHeirarchyName(
      User.role.role
    );

    // Modify the existing approval logic based on the user and enrolment information
    const enrolmentLevelCheck = await model.findOne({ _id: enrolmentId });
    console.log(enrolmentLevelCheck);
    let assignToArr = [];
    let assignTo = User.reportingTo;
    assignToArr.push(assignTo);
    if (
      enrolmentLevelCheck.level === null ||
      enrolmentLevelCheck.level.length == 0
    ) {
      console.log("here");
      incLevel = [userRoleLevel.level + 1];
      await model.findOneAndUpdate(
        { _id: enrolmentId },
        { level: incLevel, department: User.department, assignTo: assignToArr },
        { new: true } // Ensures you get the updated document
      );
    } else {
      if (userRoleLevel.level === 5) {
        incLevel = [enrolmentLevel.level + 2];
        console.log("here here");
        await model.findOneAndUpdate(
          { _id: enrolmentId },
          { level: incLevel, department: User.department, assignTo: [] },
          { new: true } // Ensures you get the updated document
        );
      } else {
        if (enrolmentLevelCheck.level.length == 1) {
          console.log("here");
          incLevel = [userRoleLevel.level + 1];
        } else {
          incLevel = enrolmentLevelCheck.level.filter(
            (level) => level > userRoleLevel.level
          );
          if (incLevel.length == 0) {
            incLevel = [userRoleLevel.level + 1];
          }
        }
        //const incLevel = [userRoleLevel.level + 1];
        console.log("here here");
        await model.findOneAndUpdate(
          { _id: enrolmentId },
          {
            level: incLevel,
            department: User.department,
            assignTo: assignToArr,
          },
          { new: true } // Ensures you get the updated document
        );
      }
    }

    const result = await service.approval(
      enrolmentId,
      approvedBy,
      approved,
      userRoleLevel.level
    );
    resultArray.push({ enrolmentId, result });
  }

  return res.status(200).send({ msg: "Batch approved", data: resultArray });
});

// Reject Enrollment Api
exports.rejected = expressAsyncHandler(async (req, res) => {
  let { enrolmentId, approvedBy, reason, assignees, department } = req.body;
  if (!enrolmentId || !approvedBy || !reason) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  const User = await adminService.getByUserID(approvedBy);
  if (!User) {
    return res.status(400).send({ msg: "user not found" });
  }
  let assignTo = assignees;
  let assignedToUser = assignees;
  console.log("assignTo", assignTo);
  const userRoleLevel = await heirarchyService.getHeirarchyName(User.role.role);
  console.log("role", userRoleLevel.level);
  if (department && assignees.length == 0) {
    console.log("here");
    const departmentUser = await adminUserModel.find({
      department: department,
    });
    const depUsers = departmentUser.map((user) => user._id);
    await model.findOneAndUpdate(
      { _id: enrolmentId },
      {
        level: [],
        department: department,
        reajectedReason: reason,
        assignedToUser: depUsers,
        assignTo: depUsers,
        status: REJECTED,
        rejectedBy: User._id,
        rejectedAt: Date.now(),
      }
    );
    if (userRoleLevel.level === 5) {
      await model.findOneAndUpdate({ _id: enrolmentId }, { assignToQa: null });
    }
  } else if (department && assignees.length > 0) {
    console.log("here now");
    var assigneeLevels = [];
    for (const assignee of assignees) {
      console.log("assignee", assignee);
      var assigneeUser = await adminService.getByUserID(assignee);
      if (!assigneeUser) {
        return res
          .status(400)
          .send({ msg: `assignee not found for ${assignee}` });
      }

      const assigneeUserLevel = await heirarchyService.getHeirarchyName(
        assigneeUser.role.role
      );
      assigneeLevels.push(assigneeUserLevel.level);
      console.log(assigneeLevels);
    }
    await model.findOneAndUpdate(
      { _id: enrolmentId },
      {
        level: assigneeLevels,
        department: assigneeUser.department._id,
        reajectedReason: reason,
        assignTo,
        assignedToUser,
        status: REJECTED,
        rejectedBy: User._id,
        rejectedAt: Date.now(),
      }
    );
    if (userRoleLevel.level === 5 || userRoleLevel.level === 6) {
      await model.findOneAndUpdate({ _id: enrolmentId }, { assignToQa: null });
    }
  } else if (!department && assignees.length == 0) {
    console.log("retention department");
    const enrollment = await model.findOne({ _id: enrolmentId });
    const company = enrollment.serviceProvider;
    const retentionDep = await depModel.findOne({
      company: company,
      department: "retention",
    });
    console.log(retentionDep._id);
    await model.findOneAndUpdate(
      { _id: enrolmentId },
      {
        level: null,
        department: retentionDep._id,
        reajectedReason: reason,
        assignToQa: null,
        status: REJECTED,
        rejectedBy: User._id,
        rejectedAt: Date.now(),
      }
    );
  } else {
    console.log("assigne");
    var assigneeLevels = [];
    const assigneeUser = await adminService.getByUserID(assignees[0]);
    if (!assigneeUser) {
      return res.status(400).send({ msg: "assignee not found" });
    }
    console.log("assigneeUser", assigneeUser);
    const assigneeUserLevel = await heirarchyService.getHeirarchyName(
      assigneeUser.role.role
    );
    console.log("assigneeUser role", assigneeUserLevel.level);
    console.log("assignee department", assigneeUser.department._id);
    assigneeLevels.push(assigneeUserLevel.level);
    console.log(assigneeLevels);
    await model.findOneAndUpdate(
      { _id: enrolmentId },
      {
        level: assigneeLevels,
        department: assigneeUser.department._id,
        reajectedReason: reason,
        assignTo,
        assignedToUser,
        status: REJECTED,
        rejectedBy: User._id,
        rejectedAt: Date.now(),
      }
    );
    if (userRoleLevel.level === 5 || userRoleLevel.level === 6) {
      const lastApprovalLevel3 = await model.findOne(
        { _id: enrolmentId, "approval.level": 3 },
        { "approval.$": 1 }
      );
      console.log("lastApprovalLevel3", lastApprovalLevel3);
      const approvedByLevel3 =
        lastApprovalLevel3 && lastApprovalLevel3.approval.length > 0
          ? lastApprovalLevel3.approval[0].approvedBy
          : User._id;
      console.log("approvedByLevel3", approvedByLevel3);
      await model.findOneAndUpdate(
        { _id: enrolmentId },
        { assignToQa: approvedByLevel3 }
      );
    }
  }
  const result = await service.rejected(
    enrolmentId,
    approvedBy,
    reason,
    userRoleLevel.level
  );
  if (result) {
    return res.status(200).send({ msg: "pushed success", data: result });
  } else {
    return res.status(400).send({ msg: "not pushed" });
  }
});

//show enrollments to roles user
exports.EnrollmentApprovedByUser = expressAsyncHandler(async (req, res) => {
  const { userId, accountType } = req.query; // The Team Lead for whom you want to show completed enrollments
  console.log(userId);
  const User = await adminService.getByUserID(userId);
  console.log(User);
  const userRole = User.role.role; //get user role

  // Assuming you have a function to retrieve all CSR users reporting to the specified Team Lead
  if (
    userRole.toUpperCase() === "TEAM LEAD" ||
    userRole.toUpperCase() === "CS MANAGER"
  ) {
    const csrUsers = await adminService.getUserReportingTo(userId);
    console.log("csr users", csrUsers);

    const userObjectId = new mongoose.Types.ObjectId(User._id);

    // Extract the IDs of CSR users reporting to the Team Lead
    const csrIds = csrUsers.map((csr) => csr.department);

    let statusFilter;

    if (accountType === "Prepaid") {
      console.log("prepaid");
      statusFilter = {
        $not: {
          $in: ["active"],
        },
      };
    } else {
      statusFilter = {
        $not: {
          $in: [
            "labelCreated",
            "labelPrinted",
            "preShipment",
            "inTransit",
            "delivered",
            "evaluation",
            "printed",
          ],
        },
      };
    }
    // Query completed enrollments for the CSR users
    const completedEnrollments = await model
      .find({
        level: { $in: [1, 2] },
        accountType: accountType,
        isEnrollmentComplete: true,
        department: { $in: csrIds.concat(User.department) },
        status: statusFilter,
        $or: [
          { approval: { $size: 0 } }, // Check if the approval array is empty
          {
            $expr: {
              $eq: [{ $arrayElemAt: ["$approval.approved", -1] }, true],
            },
          },
        ],
        // approval: {
        //   $not: {
        //     $elemMatch: {
        //       level: 3,
        //       approvedBy: User._id,
        //     },
        //   },
        // },
      })
      .sort({ updatedAt: -1 })
      .populate({
        path: "plan",
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
    const filteredEnrollments = completedEnrollments.filter((enrollment) =>
      enrollment.assignTo.includes(userObjectId || [])
    );
    console.log(filteredEnrollments.length);
    if (filteredEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing completed enrollments for the Team Lead",
        data: filteredEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No Enrolments added by CSRs or Team Lead",
      });
    }
  } else if (userRole.toUpperCase() === "QA AGENT") {
    const eightHoursAgo = new Date();
    eightHoursAgo.setHours(eightHoursAgo.getHours() - 8);

    const completedEnrollments = await model
      .find({
        level: { $in: [1, 2, 3] },
        accountType: accountType,
        assignToQa: User._id,
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        //createdAt: { $gte: eightHoursAgo },
        status: {
          $not: {
            $in: [
              "labelCreated",
              "labelPrinted",
              "preShipment",
              "inTransit",
              "delivered",
              "evaluation",
              "active",
              "printed",
            ],
          },
        },
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
      .sort({ updatedAt: -1 })
      .populate({
        path: "plan",
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

    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing completed enrollments assigned to this QA Agent",
        data: completedEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No Enrolments added by CSRs or Team Lead",
      });
    }
  } else if (userRole.toUpperCase() === "QA MANAGER") {
    const completedEnrollments = await model
      .find({
        level: { $in: [2, 3] },
        accountType: accountType,
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        // $expr: {
        //   $gt: [
        //     { $subtract: [new Date(), "$createdAt"] },
        //     8 * 60 * 60 * 1000, // 8 hours in milliseconds
        //   ],
        // },
      })
      .sort({ updatedAt: -1 })
      .populate({
        path: "plan",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "assignToQa",
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

    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing completed enrollments reporting CSR(s)",
        data: completedEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No pending enrollments found from qa agents",
      });
    }
  } else if (userRole.toUpperCase() === "PROVISION AGENT") {
    const completedEnrollments = await model
      .find({
        level: { $in: [5, null, []] },
        assignToQa: User._id,
        accountType: accountType,
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        $and: [
          {
            $or: [
              {
                $and: [
                  {
                    $expr: {
                      $eq: [
                        { $arrayElemAt: ["$approval.isComplete", -1] },
                        false,
                      ],
                    },
                  },
                  {
                    $expr: {
                      $eq: [
                        { $arrayElemAt: ["$approval.isEnrolled", -1] },
                        false,
                      ],
                    },
                  },
                ],
              },
              { "approval.isComplete": { $exists: false } },
              { "approval.isEnrolled": { $exists: false } },
            ],
          },
          {
            $expr: {
              $eq: [{ $arrayElemAt: ["$approval.approved", -1] }, true],
            },
          },
        ],
      })
      .sort({ updatedAt: -1 })
      .populate({
        path: "plan",
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

    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing completed enrollments assigned to this QA Agent",
        data: completedEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No Enrolments Approved From QA DEPARTMENT",
      });
    }
  } else if (userRole.toUpperCase() === "PROVISION MANAGER") {
    const completedEnrollments = await model
      .find({
        isEnrollmentComplete: true,
        serviceProvider: User.company,
        accountType: accountType,
        level: { $in: [5, 6, null, []] },
        $or: [
          {
            $and: [
              { csr: User._id },
              {
                $expr: {
                  $eq: [{ $arrayElemAt: ["$approval.approved", -1] }, true],
                },
              },
              { "approval.isEnrolled": { $exists: false } },
              { "approval.isComplete": { $exists: false } },
            ],
          },
          {
            $and: [
              {
                $expr: {
                  $eq: [{ $arrayElemAt: ["$approval.isEnrolled", -1] }, false],
                },
              },
              {
                $expr: {
                  $eq: [{ $arrayElemAt: ["$approval.isComplete", -1] }, false],
                },
              },
              {
                $expr: {
                  $eq: [{ $arrayElemAt: ["$approval.approved", -1] }, true],
                },
              },
              {
                $or: [
                  {
                    approverAt: { $exists: true },
                    $expr: {
                      $gt: [
                        { $subtract: [new Date(), "$approvedAt"] },
                        8 * 60 * 60 * 1000,
                      ],
                    },
                  },
                  {
                    $expr: {
                      $gt: [
                        { $subtract: [new Date(), "$createdAt"] },
                        8 * 60 * 60 * 1000,
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
        // level: { $in: [ 5,6, null, []] },
        // csr: User._id,
        // isEnrollmentComplete: true,
        // serviceProvider: User.company,
        // $expr: {
        //   $gt: [
        //     { $subtract: [new Date(), "$createdAt"] },
        //     8 * 60 * 60 * 1000, // 8 hours in milliseconds
        //   ],
        // },
      })
      .sort({ updatedAt: -1 })
      .populate({
        path: "plan",
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
    console.log(completedEnrollments.length);
    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing completed enrollments assigned to this QA Agent",
        data: completedEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No pending enrollments from PROVISION DEPARTMENT",
      });
    }
  } else if (userRole.toUpperCase() === "RETENTION AGENT") {
    const completedEnrollments = await model
      .find({
        $or: [
          { department: User.department, isEnrollmentComplete: true },
          {
            department: User.department,
            isEnrollmentComplete: true,
            csr: User._id,
          },
        ],
        accountType: accountType,
      })
      .sort({ updatedAt: -1 })
      .populate({
        path: "plan",
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
    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing completed enrollments for PROVISIONING MANAGER with level 3 or 4 approval",
        data: completedEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No completed enrollments found for PROVISIONING MANAGER with level 3 or 4 approval.",
      });
    }
  } else if (userRole.toUpperCase() === "RETENTION MANAGER") {
    const retentionUser = await adminUserModel.find({
      department: User.department,
    });
    const retIds = retentionUser.map((csr) => csr._id);
    console.log(retIds);
    const completedEnrollments = await model
      .find({
        csr: { $in: retIds },
        department: User.department,
        accountType: accountType,
        isEnrollmentComplete: true,
      })
      .sort({ updatedAt: -1 })
      .populate({
        path: "plan",
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

    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing completed enrollments for PROVISIONING MANAGER with level 3 or 4 approval",
        data: completedEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No completed enrollments found for PROVISIONING MANAGER with level 3 or 4 approval.",
      });
    }
  } else if (
    userRole.toUpperCase() === "CSR" ||
    userRole.toUpperCase() === "CS"
  ) {
    let statusFilter;

    if (accountType === "Prepaid") {
      console.log("prepaid");
      statusFilter = {
        $not: {
          $in: ["active"],
        },
      };
    } else {
      statusFilter = {
        $not: {
          $in: [
            "labelCreated",
            "labelPrinted",
            "preShipment",
            "inTransit",
            "delivered",
            "evaluation",
            "printed",
          ],
        },
      };
    }
    const completedEnrollments = await model
      .find({
        csr: userId,
        isEnrollmentComplete: true,
        accountType: accountType,
        serviceProvider: User.company,
        status: statusFilter,
        $or: [
          {
            $expr: {
              $and: [
                { $eq: [{ $arrayElemAt: ["$approval.approved", -1] }, true] },
                {
                  $eq: [
                    { $arrayElemAt: ["$approval.approvedBy", -1] },
                    User._id,
                  ],
                },
              ],
            },
          },
          { approval: { $exists: false } },
          { approval: { $size: 0 } },
        ],
      })
      .sort({ updatedAt: -1 })
      .populate({
        path: "plan",
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
        path: "invoice",
        select:
          "planId stripeId invoiceNo invoiceType accountId planCharges amountPaid additionalCharges discount invoiceCreateDate invoiceDueDate billingPeriod invoiceStatus invoicePaymentMethod invoiceOneTimeCharges lateFee",
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

    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing completed enrollments approval",
        data: completedEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No Enrolments added",
      });
    }
  } else if (userRole.toUpperCase() === "DISPATCH AGENT") {
    const completedEnrollments = await model
      .find({ level: 7, isEnrollmentComplete: true, accountType: accountType })
      .sort({ approvedAt: -1 })
      .populate({
        path: "plan",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
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

    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Showing completed enrollments approval",
        data: completedEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No completed enrollments found.",
      });
    }
  } else if (userRole.toUpperCase() === "ADMIN" || userRole === "Admin") {
    const completedEnrollments = await model
      .find({
        isEnrollmentComplete: true,
        accountType: accountType,
        //createdBy: userId,
      })
      .sort({ updatedAt: -1 })
      .populate({
        path: "plan",
        select: { _id: 1, name: 1 },
      })
      .populate({
        path: "createdBy",
        select: { _id: 1, name: 1 },
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
    if (completedEnrollments.length > 0) {
      res.status(201).send({
        msg: "Enrollments List",
        data: completedEnrollments,
      });
    } else {
      res.status(400).send({
        msg: "No Enrolments added",
      });
    }
  } else {
    res.status(400).send({
      msg: "No Enrolments Found",
    });
  }
});

// update api
exports.updateCustomer = expressAsyncHandler(async (req, res, next) => {
  const enrollmentId = req.query.enrollmentId;
  const updateFields = req.body;
  const customerData = await service.getByUserID(enrollmentId);
  if (!customerData) {
    return res
      .status(400)
      .json({ success: false, message: "cutomer not found" });
  }
  Object.assign(customerData, updateFields);

  // Save changes to the database
  const result = await customerData.save();

  // Respond with the updated data

  if (result) {
    return res.status(200).send({ success: true, updatedData: customerData });
  } else {
    res.status(400).send({ msg: "inventery not added successfully" });
  }
});

//REmarks api
exports.remarks = expressAsyncHandler(async (req, res, next) => {
  let {
    enrollmentId,
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
  } = req.body;

  if (callQualityRemarks === "Below" || callQualityRemarks === "Fatal") {
    if (!remarksComment) {
      return res.status(400).send({ msg: "remarks Comment required" });
    }
  }
  const validate = remarks.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }

  const result = await service.remarks(
    enrollmentId,
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
  );
  if (result) {
    return res.status(201).send({
      msg: "remarks added",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed to save remarks information!" });
  }
});
//REmarks for telgoo api
exports.qualityRemarks = expressAsyncHandler(async (req, res, next) => {
  let { enrollmentId, QualityRemarks, remarksNote } = req.body;

  if (!QualityRemarks) {
    return res.status(400).send({ msg: "quality remarks required" });
  }

  const result = await model.findOneAndUpdate(
    { _id: enrollmentId },
    {
      QualityRemarks,
      remarksNote,
    },
    { new: true }
  );
  if (result) {
    return res.status(201).send({
      msg: "remarks added",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "Failed to save remarks information!" });
  }
});
// check customer duplication
exports.checkCustomerDuplication = expressAsyncHandler(async (req, res) => {
  const { alternateContact, contact, accountType, customerId } = req.body;

  let query = { accountType };

  // If contact exists, add it to the query
  if (contact) {
    query.$or = [{ contact }, { alternateContact: contact }];
  }

  // If alternateContact exists, add it to the query
  if (alternateContact) {
    if (!query.$or) {
      query.$or = [];
    }
    query.$or.push({ alternateContact }, { contact: alternateContact });
  }

  // Exclude the current customer (provided by customerId) from the query if it exists
  if (customerId) {
    query._id = { $ne: customerId };
  }

  const duplicateCustomer = await model.findOne(query);

  if (duplicateCustomer) {
    if (contact && duplicateCustomer.contact === contact) {
      return res
        .status(400)
        .send({ msg: `Customer already exists with contact ${contact}` });
    } else if (
      alternateContact &&
      duplicateCustomer.alternateContact === alternateContact
    ) {
      return res.status(400).send({
        msg: `Customer already exists with alternate contact ${alternateContact}`,
      });
    }
  }

  return res.status(200).send({ msg: "Good to go" });
});
// verify enrollment using nlad
exports.verifyEligibility = expressAsyncHandler(async (req, res) => {
  let { enrollmentId, userId } = req.query;
  const enrollment = await service.getByUserID(enrollmentId);
  const result = await service.verifyUserInfoByNVS(enrollment);
  const applicationId = result.data.applicationId;
  console.log(applicationId);
  data = await model.findOneAndUpdate({ _id: enrollmentId }, { applicationId });
  if (result) {
    if (result.data.status === "COMPLETE") {
      await model.findOneAndUpdate(
        { _id: enrollmentId },
        {
          acpQualify: Date.now(),
          isNVsuccess: true,
          nvBy: userId,
        },
        { new: true }
      );
    }
    return res.status(result.status).send({ msg: "user", data: result.data });
  } else {
    return res.status(400).send({ msg: "User Not Found" });
  }
});

exports.verifyUserNlad = expressAsyncHandler(async (req, res) => {
  let { enrollmentId } = req.query;
  const enrollment = await service.getByUserID(enrollmentId);
  const result = await service.verifyUser(enrollment);
  if (result) {
    return res.status(result.status).send({ msg: "user", data: result.data });
  } else {
    return res.status(400).send({ data: result });
  }
});
exports.enrollVerifiedUser = expressAsyncHandler(async (req, res) => {
  let { userId, enrollmentId } = req.query;
  const enrollment = await service.getByUserID(enrollmentId);
  console.log(enrollment);
  const result = await service.enrollUser(enrollment);

  const User = await adminService.getByUserID(userId);
  const userRoleLevel = await heirarchyService.getHeirarchyName(User.role.role);
  console.log(userRoleLevel.level);

  console.log("result of data", result.nladEnrollmentDate);
  console.log("result of data", result.data.data);
  console.log("result of data", result.data.status);

  if (result.data) {
    if (result.data.status === 200 || result.data.status === 201) {
      console.log("result.data", result.data.data);
      console.log("subscriberId", result.data.data[0].subscriberId);
      const subscriberId = result.data.data[0].subscriberId;
      const dataRes = await model.findOneAndUpdate(
        { _id: enrollmentId },
        {
          subscriberId,
          nladEnrollmentDate: result.nladEnrollmentDate,
          EnrolledBy: User._id,
          status: "enrolled",
        },
        { new: true }
      );
      await service.approval(
        enrollmentId,
        User._id,
        true,
        userRoleLevel.level,
        true,
        false
      );
      console.log("here is subscdriberId", subscriberId);
    }
    return res
      .status(result.data.status)
      .send({ msg: "user", data: result.data.data });
  } else {
    return res.status(400).send({ msg: "User Not Found" });
  }
});

exports.updateVerifiedUser = expressAsyncHandler(async (req, res) => {
  let { enrollmentId } = req.query;
  const enrollment = await service.getByUserID(enrollmentId);
  console.log(enrollment.serviceInitializationDate);
  const result = await service.updateUserNLAD(enrollment);
  console.log("here is result", result);
  if (result) {
    return res.status(result.status).send({ msg: "user", data: result.data });
  } else {
    return res.status(400).send({ msg: "User Not Found" });
  }
});

exports.deEnrollUser = expressAsyncHandler(async (req, res) => {
  let { enrollmentId } = req.query;
  const enrollment = await service.getByUserID(enrollmentId);
  console.log(enrollment);
  const result = await service.deEnrollUser(enrollment);
  console.log("here is result", result);
  if (result) {
    return res.status(result.status).send({ msg: "user", data: result.data });
  } else {
    return res.status(400).send({ msg: "User Not Found" });
  }
});

exports.transferUserNlad = expressAsyncHandler(async (req, res) => {
  let { enrollmentId, repId, transferException, userId } = req.body;
  console.log("this is enrollment ", enrollmentId);
  const enrollment = await service.getByUserID(enrollmentId);
  console.log(enrollment);
  const User = await adminService.getByUserID(userId);
  const userRoleLevel = await heirarchyService.getHeirarchyName(User.role.role);
  console.log(userRoleLevel.level);
  const result = await service.transferUserNlad(
    enrollment,
    repId,
    transferException
  );
  console.log("result", result);
  console.log("result.status", result.data.status);
  if (result.data) {
    if (result.data.status === 200 || result.data.status === 201) {
      console.log("result.data", result.data.data);
      console.log("subscriberId", result.data.data[0].subscriberId);

      const subscriberId = result.data.data[0].subscriberId;
      const dataRes = await model.findOneAndUpdate(
        { _id: enrollmentId },
        {
          subscriberId,
          nladEnrollmentDate: result.nladEnrollmentDate,
          EnrolledBy: User._id,
          status: "enrolled",
        },
        { new: true }
      );
      await service.approval(
        enrollmentId,
        User._id,
        true,
        userRoleLevel.level,
        true,
        false
      );
      console.log("here is subscdriberId", subscriberId);
    }
    return res
      .status(result.data.status)
      .send({ msg: "user", data: result.data.data });
  } else {
    return res.status(400).send({ msg: "User Not Found" });
  }
});

exports.activateByPwg = expressAsyncHandler(async (req, res) => {
  let { enrollmentId, planId, esn, zip, userId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  console.log(enrollment);
  const User = await adminService.getByUserID(userId);
  const userRoleLevel = await heirarchyService.getHeirarchyName(User.role.role);
  console.log(userRoleLevel.level);
  if (!planId && !esn && !zip) {
    planId = enrollment.plan.planId;
    esn = enrollment.esn;
    zip = enrollment.zip;
  }
  if (!esn) {
    return res.status(400).send({ msg: "esn not assigned to this customer" });
  }
  console.log("here", enrollmentId, planId, esn, zip, userId);
  //const result = await service.activateByPwg(enrollment)
  const xmlData = `
      <?xml version="1.0" encoding="utf-8"?>
        <wholeSaleApi xmlns="https://oss.vcarecorporation.com:22712/api/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <session>
          <clec>
          <id>${process.env.PWG_ID}</id>
         <agentUser>
             <username>${process.env.PWG_USERNAME}</username>
             <token>${process.env.PWG_TOKEN}</token>
             <pin>${process.env.PWG_PIN}</pin>
         </agentUser>
            </clec>
          </session>
          <request type="Activate">
            <esn>${esn}</esn>
            <planId>${planId}</planId>
            <zip>${zip}</zip>
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

      const status = responseData.wholeSaleApi.response.$["status"];

      if (status === "success") {
        const zipEsn = responseData.wholeSaleApi.response.esn;
        const Mdn = responseData.wholeSaleApi.response.mdn;
        const CustomerId = responseData.wholeSaleApi.response.CustomerID;
        const subscriptionId =
          responseData.wholeSaleApi.response.SubscriptionID;
        const warningmsd = responseData.wholeSaleApi.response.warning;
        console.log(
          "esn " +
            zipEsn +
            ", mdn " +
            Mdn +
            `\nCustomerId ${CustomerId}\nsubscriptionId ${subscriptionId}`
        );
        let planDetails = await planModel.findOne({ planId });
        console.log("plan details", planDetails);
        let esnDetails = await simInventoryService.getBySim(zipEsn);
        console.log("esn details", esnDetails);
        const result = await model.findOneAndUpdate(
          { _id: enrollmentId },
          {
            customerId: CustomerId,
            phoneNumber: Mdn,
            phoneNumberInEbbp: Mdn,
            esn: zipEsn,
            plan: planDetails._id,
            esnId: esnDetails._id,
            IMEI: esnDetails.IMEI,
          },
          { new: true }
        );
        if (result) {
          console.log("checking in result");
          const statusCheck = await simInventoryService.statusUpdate(esn);
          await simInventoryService.simHistory(
            esn,
            enrollment.serviceProvider,
            userId,
            enrollment._id,
            enrollment.enrollmentId,
            enrollment.plan
          );
          console.log("checking status result", statusCheck);
          if (
            enrollment.accountType === "Prepaid" ||
            enrollment.accountType === "Postpaid"
          ) {
            await service.updateStatus(
              enrollment.serviceProvider,
              enrollment._id,
              enrollment.status
            );
            await model.findOneAndUpdate(
              { _id: enrollmentId },
              { statusElectronically: ACTIVE }
            );
            // await service.approval(
            //   enrollmentId,
            //   User._id,
            //   true,
            //   userRoleLevel.level,
            //   false,
            //   false
            // );
          } else {
            await service.updateStatus(
              enrollment.serviceProvider,
              enrollment._id,
              ACTIVE
            );
            await service.approval(
              enrollmentId,
              User._id,
              true,
              userRoleLevel.level,
              true,
              true
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
          const serviceInfo = await PWGServices.serviceInformation(Mdn);
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const queryHLR = await PWGServices.queryLHR(Mdn, zipEsn);
          console.log("queryHlR is here", queryHLR);
          console.log(
            "queryHlR simstatus is here",
            queryHLR.simStatus,
            queryHLR.simStatus
          );
          console.log("queryHlR simstatus is here", queryHLR);
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const querySim = await PWGServices.querySim(esn);
          await model.findOneAndUpdate(
            { _id: enrollmentId },
            {
              serviceStatus: serviceInfo?.serviceStatus,
              planEffectiveDate: serviceInfo?.planEffectiveDate,
              socs: serviceInfo?.socValues,
              planExpirationDate: serviceInfo?.planExpirationDate,
              talkBalance: serviceInfo?.talkBalance,
              textBalance: serviceInfo?.textBalance,
              dataBalance: serviceInfo?.dataBalance,
              simStatus: queryHLR,
              PUK1: querySim?.PUK1,
              PUK2: querySim?.PUK2,
              ICCIDSTATUS: querySim?.ICCIDSTATUS,
              activatedBy: User._id,
              activatedAt: Date.now(),
            },
            { new: true }
          );
          if (enrollment.accountType === "ACP") {
            const updateNlad = await service.updateUserNLAD(enrollment);
            if (updateNlad.status === 400) {
              return res.status(updateNlad.status).send({
                msg: "something went wrong in updation",
                data: updateNlad.data,
              });
            }
          }
          return res.status(200).send({
            msg: "Successfully mdn and subscriptionId generated",
            warning: warningmsd,
            data: result,
          });
        } else {
          return res.status(400).send({ msg: "something went wrong" });
        }
      } else {
        return res.status(400).send({
          msg: responseData.wholeSaleApi.response.errors.error.message,
        });
      }
    })
    .catch((error) => {
      // Handle errors here
      console.error("Error:", error);
      return res.status(500).send(error);
    });
});

exports.verifyAddress = expressAsyncHandler(async (req, res) => {
  let { city, state, address1, address2 } = req.query;
  if (!city || !state || !address1) {
    return res
      .status(400)
      .send({ msg: "city or state or address1 field is missing" });
  }
  const uspsApiResponse = await UspsService.uspsAccessToken();
  console.log(uspsApiResponse.data.access_token);
  let access_token = uspsApiResponse.data.access_token;
  let result = await UspsService.uspsAddressVerify(
    access_token,
    address1,
    city,
    state,
    address2
  );
  if (result) {
    res.status(result.status).send({ msg: "address", data: result.data });
  } else {
    res.status(200).send({ msg: "address", data: result.data });
  }
});

exports.getBatchStatus = expressAsyncHandler(async (req, res) => {
  const username = process.env.NLADID;
  const password = process.env.NLADKEY;
  Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
    "base64"
  )}`;
  url = `https://api.universalservice.org/ebbp-svc/1/batch?rowsProcessed`;
  const options = {
    headers: {
      Authorization: Access_token,
      "Content-Type": "application/json",
    },
  };

  //const data = await axios.post(url, JSON.stringify(body), { headers });
  const result = await axios
    .get(url, options)
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
  if (result) {
    return res.status(result.status).send({ msg: "user", data: result.data });
  } else {
    return res.status(400).send({ msg: "User Not Found" });
  }
});

exports.getErroredData = expressAsyncHandler(async (req, res) => {
  let { link } = req.body;
  const result = await service.getErroredData(link);
  if (result) {
    return res.status(result.status).send({ msg: "data", data: result.data });
  } else {
    return res.status(400).send({ msg: "error" });
  }
});

// Device Eligibilty
exports.deviceEligibilty = expressAsyncHandler(async (req, res) => {
  let { enrollmentId } = req.query;
  const enrollment = await service.getByUserID(enrollmentId);
  const result = await service.deviceEligibilty(enrollment);
  console.log(result);
  if (result.data.Message == "This person is eligible to receive a device.") {
    console.log("here");
    await model.findOneAndUpdate(
      { _id: enrollmentId },
      {
        deviceEligibilty: true,
      }
    );
  }
  if (result) {
    return res.status(result.status).send({ msg: "result", data: result.data });
  } else {
    return res.status(400).send({ msg: "User Not Found" });
  }
});

// disconnect esn/Mdn
exports.disconnectMdnByPwg = expressAsyncHandler(async (req, res) => {
  let { enrollmentId, disconnectReason } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  console.log(enrollment);
  let mdn = enrollment?.phoneNumber;
  let esn = enrollment?.esn;
  if (!mdn && !esn) {
    return res
      .status(400)
      .send({ msg: "no mdn assigned or this user is not activated" });
  }
  //const result = await service.activateByPwg(enrollment)
  const responseData = await PWGServices.disconnectMDN(mdn, esn);
  console.log(responseData);
  const status = responseData.$["status"];
  if (status === "success") {
    const customer = await model.findOneAndUpdate(
      { _id: enrollmentId },
      {
        status: "disconnected",
        disconnectReason,
      }
    );
    return res.status(200).send({ msg: `disconected successfully` });
  } else {
    return res.status(400).send({ msg: `error in disconnection` });
  }
});

// Change plan
exports.changePlan = expressAsyncHandler(async (req, res) => {
  let { enrollmentId, newPlanId, userId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  console.log(enrollment);
  let User = await adminService.getByUserID(userId);
  let newplan = await planModel.findOne({ newPlanId });
  //const result = await service.activateByPwg(enrollment)
  const responseData = await PWGServices.changePlan(
    enrollment.phoneNumber,
    enrollment.esn,
    newPlanId
  );
  const status = responseData.$["status"];
  if (status === "success") {
    await service.planHistory(
      enrollmentId,
      enrollment.plan,
      newplan._id,
      User._id
    );
    let planDetails = await planModel.findOne({ planId });
    console.log("plan details", planDetails);
    const result = await model.findOneAndUpdate(
      { _id: enrollmentId },
      {
        plan: planDetails._id,
      },
      { new: true }
    );
    console.log(result.plan);
    return res.status(200).send({ msg: `plan changed successfully` });
  } else {
    return res.status(400).send({ msg: `error in plan changing` });
  }
});

//  Transaction report
exports.NLADTransactionReport = expressAsyncHandler(async (req, res, next) => {
  let { sac, startDate, endDate } = req.body;

  const validate = NLADTransactionReport.validate(req.body);
  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }
  const result = await service.NLADTransactionReport(sac, startDate, endDate);

  if (result.data) {
    const jsonData = await csvToJson(result.data);
    const filteredData = jsonData.filter(
      (item) => item["Transaction Type"] === "TRANSFEROUT"
    );
    console.log(filteredData.length);
    return res.status(200).send({ msg: `transaction report`, data: jsonData });
  } else {
    return res.status(400).send({ msg: `error occured while transactioning` });
  }
});

exports.usage = expressAsyncHandler(async (req, res) => {
  try {
    let { mdn } = req.query;

    const responseData = await PWGServices.queryUsage(mdn);

    const responseObject = {
      msg: "Usage",
      data: {
        usage: responseData,
      },
    };

    return res.status(200).send(responseObject);
  } catch (error) {
    console.error("Error in serviceInfo:", error);
    return res.status(400).send({ msg: "error in serviceinfo" });
  }
});
exports.serviceInfo = expressAsyncHandler(async (req, res) => {
  let { mdn, esn } = req.body;
  const responseData = await PWGServices.serviceInformation(mdn);
  const queryLHR = await PWGServices.queryLHR(mdn, esn);
  console.log("serviceStatus", responseData.serviceStatus);
  console.log("socValues", responseData.socValues);

  const querySim = await PWGServices.querySim(esn);

  console.log("simActiveResponse", querySim);
  console.log("sim status", queryLHR);

  if (responseData) {
    return res.status(200).send({ msg: `service info`, data: responseData });
  } else {
    return res.status(400).send({ msg: `error in serviceinfo` });
  }
});
exports.customerHistory = expressAsyncHandler(async (req, res) => {
  let { startDate, endDate, reportType } = req.body;
  const UserId = req.query._id;
  // Ensure startDate and endDate are valid dates
  if (startDate && endDate) {
    startDate = new Date(startDate);
    endDate = new Date(endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res
        .status(400)
        .json({ msg: "Invalid start date or end date format" });
    }
  }
  // Construct the query based on the reportType
  let query;
  if (reportType === "MDN History") {
    query = {
      _id: UserId,
      updatedAt: {
        $gte: startDate,
        $lte: endDate,
      },
      MdnHistory: {
        $exists: true,
        $not: { $size: 0 },
      },
    };
  } else if (reportType === "Plan History") {
    query = {
      _id: UserId,
      updatedAt: {
        $gte: startDate,
        $lte: endDate,
      },
      planHistory: {
        $exists: true,
        $not: { $size: 0 },
      },
    };
  } else {
    return res.status(400).json({ msg: "Invalid report type" });
  }
  try {
    const historyResults = await model.find(query);

    // Return the results based on the report type
    if (reportType === "MDN History") {
      return res
        .status(200)
        .json({ msg: "MDN History results", data: historyResults });
    } else if (reportType === "Plan History") {
      return res
        .status(200)
        .json({ msg: "Plan History results", data: historyResults });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

async function csvToJson(csvData) {
  try {
    const csvDataPromise = new Promise((resolve, reject) => {
      const jsonData = [];

      const parser = csv.parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      parser.on("data", (record) => {
        jsonData.push(record);
      });

      parser.on("end", () => {
        resolve(jsonData);
      });

      parser.on("error", (error) => {
        console.error("Error parsing CSV:", error);
        reject(error);
      });

      // Process the CSV data
      parser.write(csvData);
      parser.end();
    });
    // Wait for the promise to resolve
    const cData = await csvDataPromise;

    // Check if csvData is an array
    if (!Array.isArray(cData)) {
      throw new Error("Invalid CSV data format");
    }
    const matchedDataArray = cData.map((csvData) => {
      const matchedData = {};

      // Assuming csvData represents a row of your CSV data
      for (const header in csvData) {
        // Use the header as the property name and assign the corresponding value
        matchedData[header] = csvData[header];
      }

      return matchedData;
    });
    return matchedDataArray;
  } catch (error) {
    console.error("An error occurred:", error);
    // Handle the error
  }
}
exports.NLADTransactionReportStatus = expressAsyncHandler(
  async (req, res, next) => {
    let { sac, startDate, endDate } = req.body;

    const validate = NLADTransactionReport.validate(req.body);
    if (validate.error) {
      return next(new AppError(validate.error, 400));
    }

    const result = await service.NLADTransactionReport(sac, startDate, endDate);

    if (result.data) {
      const jsonData = await csvToJson(result.data);

      // Assuming "Transaction Type" and "SubscriberId" are the relevant fields
      const latestStatusUpdates = filterLatestStatusUpdates(jsonData);

      console.log(latestStatusUpdates.length);

      // Iterate through the latest status updates
      for (const record of latestStatusUpdates) {
        const subscriberId = record["SubscriberId"]; // Replace with your actual field name
        const status = record["Transaction Type"]; // Use "Transaction Type" as the status

        // Update the status in your database
        await updateDatabaseStatus(subscriberId, status);

        // Now subscriberId is defined, and you can use it in the following lines
        const enrollment = await model.findOne({ subscriberId });

        // Check if enrollment is not null or undefined before accessing its properties
        if (enrollment && enrollment.transactionEffectiveDate) {
          // Assuming transactionEffectiveDate is the property you are trying to access
          const responseData = PWGServices.disconnectMDN(
            enrollment.phoneNumber,
            enrollment.esn
          );
          // ... (continue processing)
        } else {
          console.error(
            `Error: Unable to retrieve transactionEffectiveDate for subscriberId: ${subscriberId}`
          );
        }
      }

      return res
        .status(200)
        .send({ msg: `transaction report`, data: latestStatusUpdates });
    } else {
      return res
        .status(400)
        .send({ msg: `error occurred while transactioning` });
    }
  }
);

function filterLatestStatusUpdates(data) {
  const latestStatusUpdates = {};

  for (const item of data) {
    const subscriberId = item["SubscriberId"]; // Replace with your actual field name

    // Check if the current record is the latest based on the transaction date
    if (
      !latestStatusUpdates[subscriberId] ||
      new Date(item["NLAD Transaction Date"]) >
        new Date(latestStatusUpdates[subscriberId]["NLAD Transaction Date"])
    ) {
      latestStatusUpdates[subscriberId] = item;
    }
  }

  const filteredData = Object.values(latestStatusUpdates);
  return filteredData;
}

async function updateDatabaseStatus(subscriberId, status) {
  try {
    const filter = { subscriberId: subscriberId };
    const update = {
      $set: { status: status },
      $push: { nladhistory: { date: new Date(), status: status } },
    };

    const result = await model.findOneAndUpdate(filter, update);

    if (result) {
      console.log(
        `Status updated successfully for subscriberId: ${subscriberId}`
      );
    } else {
      console.log(
        `SubscriberId: ${subscriberId} not found or status is already up to date`
      );
    }
  } catch (error) {
    console.error(
      `Error updating status for subscriberId ${subscriberId}: ${error.message}`
    );
    throw error; // You can handle or propagate the error as needed
  }
}
exports.userprofile = expressAsyncHandler(async (req, res, next) => {
  const { userId } = req.query;
  const { fullName, address, DOB, SSN, contact, alternateContact } = req.body;
  let [firstName, ...lastNameArray] = fullName.split(" ");
  let lastName = lastNameArray.join(" ");
  const validate = userProfile.validate(req.body);

  if (validate.error) {
    return next(new AppError(validate.error, 400));
  }

  try {
    lastName = lastName.toUpperCase();
    firstName = firstName.toUpperCase();

    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path; // Assuming the file is stored in 'uploads' directory
    }

    // Validation passed, create a new user model with image URL and save
    const user = new model({
      firstName,
      lastName,
      address1: address,
      DOB,
      SSN,
      contact,
      alternateContact,
      imageUrl: imageUrl, // Save the image URL in the user model
    });

    const result = await user.save();

    res.status(200).json({
      success: true,
      message: "User profile saved successfully.",
      data: result,
    });
  } catch (error) {
    // Handle any error that occurs during the save operation
    res.status(500).json({ success: false, error: error.message });
  }
});
exports.getuserprofilebyid = expressAsyncHandler(async (req, res, next) => {
  try {
    const { userId } = req.query;

    // Replace 'model' with the actual model you are using
    const user = await model.findById({ _id: userId });

    if (!user) {
      // If user not found, return a 404 Not Found response
      return res.status(404).json({ success: false, error: "User not found." });
    }

    // Return the user data in the response
    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully.",
      data: user,
    });
  } catch (error) {
    // Handle any error that occurs during the retrieval operation
    res.status(500).json({ success: false, error: error.message });
  }
});
exports.updateuserprofile = expressAsyncHandler(async (req, res, next) => {
  try {
    const { userId, fullName, alternateContact, SSN, DOB, address } = req.body;

    // Check if userId is provided
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "userId is required." });
    }

    // Split fullName into firstName and lastName
    const [firstName, ...lastNameArray] = fullName.split(" ");
    const lastName = lastNameArray.join(" ");
    const upperCaseFirstName = firstName.toUpperCase();
    const upperCaseLastName = lastName.toUpperCase();

    let imageUrl = null;
    // Check if file was uploaded
    if (req.file) {
      imageUrl = req.file.path; // Store the image path
      console.log("Image uploaded successfully:", imageUrl);
    }

    // Call the updateuserProfile service function
    const result = await service.updateuserProfile({
      userId,
      firstName: upperCaseFirstName,
      lastName: upperCaseLastName,
      alternateContact,
      SSN,
      DOB,
      address1: address,
      imageUrl: imageUrl,
    });

    // Check if user was found and updated
    if (!result) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "User profile updated successfully.",
      data: result,
    });
  } catch (error) {
    // Handle any errors
    console.error("Error updating user profile:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// exports.updateuserprofile = expressAsyncHandler(async (req, res, next) => {
//   try {
//     const { userId, fullName, alternateContact, SSN, DOB, address, image } =
//       req.body;
//     console.log(userId);

//     // Check if userId is provided
//     if (!userId) {
//       return res
//         .status(400)
//         .json({ success: false, error: "userId is required." });
//     }

//     // Split fullName into firstName and lastName
//     const [firstName, ...lastNameArray] = fullName.split(" ");
//     const lastName = lastNameArray.join(" ");
//     const upperCaseFirstName = firstName.toUpperCase();
//     const upperCaseLastName = lastName.toUpperCase();

//     let imagePath = null;
//     let outputPath;
//     // Check if base64 encoded image is provided
//     if (image) {
//       // Remove header from base64 string
//       const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
//       const buffer = Buffer.from(base64Data, "base64");
//       // Define the path where image will be stored
//       const outputDirectory = "uploads";

//       // Create the output directory if it doesn't exist
//       if (!filefs.existsSync(outputDirectory)) {
//         filefs.mkdirSync(outputDirectory);
//       }
//       // Generate a unique filename for the PDF
//       const fileName = `${userId}_profile.jpg`;

//       // Specify the path to save the PDF
//       outputPath = `${outputDirectory}/${fileName}`;
//       // Write the modified PDF buffer to the file
//       filefs.writeFileSync(outputPath, buffer);

//       console.log(`Image saved successfully at ${outputPath}`);
//       // // Write the image file to the uploads folder
//       // filefs.writeFileSync(uploadPath, buffer);
//       // // Set the image path
//       // imagePath = uploadPath;
//       // console.log("Image uploaded successfully:", imagePath);
//     }

//     // Call the updateuserProfile service function
//     const result = await service.updateuserProfile({
//       userId,
//       firstName: upperCaseFirstName,
//       lastName: upperCaseLastName,
//       alternateContact,
//       SSN,
//       DOB,
//       address1: address,
//       imageUrl: outputPath,
//     });

//     // Check if user was found and updated
//     if (!result) {
//       return res.status(404).json({ success: false, error: "User not found." });
//     }

//     // Return success response
//     res.status(200).json({
//       success: true,
//       message: "User profile updated successfully.",
//       data: result,
//     });
//   } catch (error) {
//     // Handle any errors
//     console.error("Error updating user profile:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

exports.getByUnitType = expressAsyncHandler(async (req, res) => {
  try {
    const { serviceProvider, unitType } = req.query;

    // Validate input if necessary

    const result = await service.getByUnitType(serviceProvider, unitType);

    if (result.length > 0) {
      return res.status(200).json({ msg: "Data found", result });
    } else {
      return res.status(404).json({ msg: "Data not found" });
    }
  } catch (error) {
    console.error("Error during getByUnitType:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
async function listFormFieldNames(pdfPath) {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const fieldNames = Object.keys(fields);

    console.log("Form field names:", fieldNames);
  } catch (error) {
    console.error("Error reading PDF:", error);
  }
}
const generateOtp = () => randomize("0", 4);
function isOtpExpired(createdAt) {
  const otpExpiryMinutes = 10; // Set the expiration time in minutes
  const currentTime = new Date().getTime();
  const otpCreatedAt = new Date(createdAt).getTime();
  return currentTime - otpCreatedAt > otpExpiryMinutes * 60 * 1000;
}
// exports.getstatics = expressAsyncHandler(async (req, res) => {
//   try {
//     // Get the current date in Eastern Time Zone
//     const easternNow = DateTime.utc().setZone("America/New_York");

//     // Calculate the start date (10 days ago) and end date (yesterday)
//     const startOfPeriod = easternNow.minus({ days: 10 }).startOf("day");
//     const endOfPeriod = easternNow.minus({ days: 1 }).startOf("day");

//     const result = await model.aggregate([
//       {
//         $match: {
//           // Filter documents within the specified date range
//           createdAt: {
//             $gte: startOfPeriod.toJSDate(),
//             $lte: endOfPeriod.toJSDate(),
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "serviceproviders", // Assuming the name of the collection is "serviceProviderCollection"
//           localField: "serviceProvider",
//           foreignField: "_id",
//           as: "serviceProviderInfo",
//         },
//       },
//       {
//         $unwind: "$serviceProviderInfo", // Unwind the array created by the lookup
//       },
//       {
//         $group: {
//           _id: {
//             serviceProvider: "$serviceProviderInfo.name", // Populate service provider name instead of ID
//             AccountType: "$accountType",
//           },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $match: {
//           "_id.AccountType": { $ne: null }, // Filter out documents where AccountType is null or undefined
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           serviceProvider: "$_id.serviceProvider",
//           AccountType: "$_id.AccountType",
//           count: 1,
//         },
//       },
//     ]);

//     let emailContent = ""; // Initialize email content string

//     if (result.length === 0) {
//       // If result is empty, construct message indicating no enrollments
//       emailContent = "No enrollments found for the past 10 days.";
//     } else {
//       // If result is not empty, convert the result to JSON string for email body
//       emailContent = JSON.stringify(result);
//     }

//     // Create a Nodemailer transporter
//     const transporter = nodemailer.createTransport({
//       host: process.env.MAILHOST,
//       port: process.env.MAILPORT,
//       secure: false,
//       auth: {
//         user: process.env.MAIL,
//         pass: process.env.MAILPASS,
//       },
//     });

//     const mailOptions = {
//       from: process.env.MAIL,
//       to: "muhammad.minhaj@logics10.com, muhammad.bilal@ziscomm.me", // Email addresses to send the report
//       subject: "Daily Report", // Subject of the email
//       text: emailContent, // Plain text body of the email
//     };

//     // Send email
//     const info = await transporter.sendMail(mailOptions);

//     console.log("Email sent:", info.response);
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// });
// Schedule the cron job to run daily at 12 AM
// cron.schedule(
//   "* */7 * * * *",
//   async () => {
//     await sendEmailReport();
//   },
//   {
//     timezone: "America/New_York", // Set the timezone
//   }
// );
const fetchStaticsData = async () => {
  try {
    const easternNow = DateTime.now()
      .setZone("America/New_York")
      .startOf("day");

    const startOfYesterday = easternNow.minus({ days: 1 }).startOf("day");
    const endOfYesterday = easternNow.startOf("day");

    const result = await model.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYesterday, $lt: endOfYesterday },
        },
      },
      {
        $lookup: {
          from: "serviceproviders",
          localField: "serviceProvider",
          foreignField: "_id",
          as: "serviceProviderInfo",
        },
      },
      {
        $unwind: "$serviceProviderInfo",
      },
      {
        $group: {
          _id: {
            serviceProvider: "$serviceProviderInfo.name",
            AccountType: "$accountType",
          },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          "_id.AccountType": { $ne: null },
        },
      },
      {
        $project: {
          _id: 0,
          serviceProvider: "$_id.serviceProvider",
          AccountType: "$_id.AccountType",
          count: 1,
        },
      },
    ]);

    return result;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Propagate the error
  }
};

const sendEmailReport = async () => {
  try {
    const result = await fetchStaticsData(); // Fetch data

    let emailContent = ""; // Initialize email content string

    if (result.length === 0) {
      // If result is empty, construct message indicating no enrollments
      emailContent = "No enrollments found for the last day.";
    } else {
      // If result is not empty, construct the email content with the entries
      result.forEach((item, index) => {
        emailContent += `Entry ${index + 1}:\n`;
        emailContent += `Service Provider: ${item.serviceProvider}\n`;
        emailContent += `Account Type: ${item.AccountType}\n`;
        emailContent += `Enrollments: ${item.count}\n\n`;
      });
    }

    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.MAILHOST,
      port: process.env.MAILPORT,
      secure: false,
      auth: {
        user: process.env.MAIL,
        pass: process.env.MAILPASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL,
      to: "usman@logics10.com imsha@logicsten.com",
      subject: "Daily Report",
      text: emailContent,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// Schedule the email sending function to run every morning at 7 AM
cron.schedule(
  "0 7 * * *",
  async () => {
    await sendEmailReport();
  },
  {
    timezone: "America/New_York",
  }
);
exports.addBalanceforAuthorize = expressAsyncHandler(async (req, res) => {
  const { userId } = req.query;
  const {
    amount,
    cardNumber,
    expirationDate,
    cardCode,
    serviceProvider,
    modules,
    paymentGateway,
  } = req.body;

  try {
    // Find the user by userId
    let user = await model.findById({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Retrieve payment credentials based on user's serviceProvider, paymentGateway, and modules
    const result = await GatewayCredential.findOne({
      clientId: serviceProvider,
      paymentGateway: paymentGateway,
      modules: modules,
      "gatewayCredentials.isActive": true,
    });
    console.log(result);
    // Check if payment credentials exist
    if (
      !result ||
      !result.gatewayCredentials ||
      result.gatewayCredentials.length === 0
    ) {
      return res.status(404).json({ error: "No active credentials found" });
    }

    // Extract active credentials
    const activeCredential = result.gatewayCredentials.find(
      (credential) => credential.isActive === true
    );
    if (!activeCredential) {
      return res.status(404).json({ error: "No active credentials found" });
    }

    // Check expiration date validity
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = (currentDate.getMonth() + 1)
      .toString()
      .padStart(2, "0");
    const currentDateString = `${currentYear}-${currentMonth}`;
    if (expirationDate < currentDateString) {
      return res
        .status(400)
        .json({ msg: "Expiration date should not be in the past" });
    }

    // Expiration date limit: 10 years
    const maxExpiryDate = new Date(
      currentYear + 10,
      currentDate.getMonth(),
      currentDate.getDate()
    );
    if (new Date(expirationDate) > maxExpiryDate) {
      return res
        .status(400)
        .json({ msg: "Expiration date limit exceeded (10 years)" });
    }

    // Payment API URL
    const apiUrl = activeCredential.gatewayUrl;

    // Construct request body for payment
    const requestBody = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: activeCredential.apiKey,
          transactionKey: activeCredential.apiSecret,
        },
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: amount,
          payment: {
            creditCard: {
              cardNumber: cardNumber,
              expirationDate: expirationDate,
              cardCode: cardCode,
            },
          },
          order: {
            invoiceNumber: user.accountId,
          },
        },
      },
    };

    // Make API call to process payment
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    // Check payment result
    if (response.data.messages.resultCode === "Ok") {
      // Parse wallet balance as a number
      let currentBalance = user.wallet ? user.wallet : "0";
      console.log(currentBalance);
      currentBalance = parseFloat(currentBalance);
      // Ensure 'amount' is also parsed as a number
      const newAmount = parseFloat(amount);
      console.log(newAmount);
      // Update wallet balance for the user by adding the new amount
      user.wallet = (currentBalance + newAmount).toFixed(2); // Assuming you want to keep balance rounded to 2 decimal places

      // Save the updated user document
      await user.save();

      return res.status(200).json({
        message: "Balance added to wallet successfully",
        newBalance: user.wallet,
      });
    } else {
      console.error("Transaction Failed:", response.data.messages);
      return res.status(500).send({
        error: "Transaction failed",
        data: response.data.messages,
      });
    }
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).send({
      error: "Transaction failed",
      data: error.response ? error.response.data : error.message,
    });
  }
});

exports.showBalance = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;

    // Find the user by userId
    const user = await model.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the wallet balance
    return res.status(200).json({ wallet: user.wallet });
  } catch (error) {
    console.error("Error while fetching wallet balance:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.purchasePackage = expressAsyncHandler(async (req, res) => {
  const { userId, mdn, planId } = req.body;

  try {
    // Fetch user details
    const user = await model.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch firstName and lastName from the user object
    let fullName = `${user.firstName} ${user.lastName}`;

    // Fetch package details using planId
    let package = await planModel.findOne({ planId: planId });

    // Check if package exists
    if (!package) {
      return res.status(404).json({ error: "Package not found" });
    }

    // Check if user has sufficient balance
    if (user.wallet < package.price) {
      return res.status(400).json({ error: "Insufficient balance in wallet" });
    }

    // Call purchasePlan API to activate the package
    const result = await PWGServices.purchasePlan(mdn, package.planId);
    console.log(result);
    const status = result.$["status"];

    if (status === "success") {
      // Deduct package price from user's wallet balance
      user.wallet -= package.price;
      await user.save();

      // Concatenate firstName and lastName into fullName

      // Log the transaction
      await logTransaction(mdn, package._id, fullName, status, package.price);

      // Create notification for successful package activation
      const notification = new Notification({
        userId: userId,
        message: `Package ${removeEscapeCharacters(
          package.name
        )} activated successfully`,
        price: package.price,
        timestamp: new Date(),
        isMobile: true,
        // Any other relevant fields
      });
      await notification.save();

      return res.status(200).json({
        message: "Package purchased and activated successfully",
        newBalance: user.wallet,
      });
    } else {
      // Log the failed transaction
      await logTransaction(mdn, package._id, fullName, status, package.price);

      // Create notification for failed package activation
      const notification = new Notification({
        userId: userId,
        message: `Error activating package ${removeEscapeCharacters(
          package.name
        )}`,
        price: package.price,
        timestamp: new Date(),
        isMobile: true,

        // Any other relevant fields
      });
      console.log(notification);
      await notification.save();

      return res.status(400).json({ error: "Error in activating the package" });
    }
  } catch (error) {
    console.error("Error during purchasePackage:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
function removeEscapeCharacters(str) {
  return str.replace(/\\/g, "");
}
exports.uploadConsentformPrepaid = expressAsyncHandler(async (req, res) => {
  try {
    // Retrieve customer ID from request body or wherever it's available
    const { userId } = req.query;

    // Find the customer by ID
    const customer = await model.findById({ _id: userId });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Assuming 'files' is an array field in the Customer model
    customer.files.push({
      filetype: req.file.filename,
      filepath: req.file.path,
      // Add any additional metadata you want to store
    });

    // Save the updated customer data
    await customer.save();

    res
      .status(201)
      .json({ message: "File uploaded and customer updated successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
exports.withoutzip = expressAsyncHandler(async (req, res, next) => {
  try {
    const { serviceProvider, carrier, csr, zipCode, department, accountType } =
      req.body;
    let enrollment = enrollmentId();
    let accountId = SixDigitUniqueId();
    const result = await model({
      serviceProvider,
      carrier,
      csr,
      zip: zipCode,
      department,
      accountType,
      enrollmentId: enrollment,
      accountId,
    });
    await result.save();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    // Handle errors
    res.status(500).json({ success: false, error: error.message });
  }
});

async function logTransaction(mdn, itemId, fullName, status, price) {
  try {
    // Create a new Transaction object
    const transaction = new Transaction({
      mdn,
      itemId,
      transactionType: "Package Purchase",
      status,
      price,
      purchaseDate: new Date(),
      fullName,
    });

    // Save the transaction to the database
    await transaction.save();
  } catch (error) {
    console.error("Error logging transaction:", error);
    // Handle error logging transaction
    throw error;
  }
}
// exports.markNotificationAsRead = expressAsyncHandler(async (req, res) => {
//   try {
//     const { id } = req.query;
//     const notification = await Notification.findByIdAndUpdate(id, {
//       read: true,
//       isMobile: true,
//     });
//     if (!notification) {
//       return res.status(404).json({ error: "Notification not found" });
//     }
//     return res.status(200).json({ message: "Notification marked as read" });
//   } catch (error) {
//     console.error("Error marking notification as read:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// exports.markAllNotificationsAsRead = expressAsyncHandler(async (req, res) => {
//   try {
//     const userId = req.query; // Get userId from query parameters

//     // Ensure userId is provided
//     if (!userId) {
//       return res
//         .status(400)
//         .json({ success: false, error: "userId parameter is missing" });
//     }

//     // Find and fetch all unread mobile notifications for the provided userId
//     const unreadNotifications = await Notification.find({
//       userId: userId,
//       isMobile: true,
//       read: false,
//     });

//     // Mark unread notifications as read
//     await Notification.updateMany(
//       { user: userId, isMobile: true, read: false },
//       { read: true }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Notifications marked as read successfully",
//     });
//   } catch (error) {
//     console.error("Error marking notifications as read:", error);
//     return res
//       .status(500)
//       .json({ success: false, error: "Internal Server Error" });
//   }
// });
exports.getNotificationsforMobile = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;
    console.log(userId);
    // Fetch notifications for the user, sorted by timestamp in descending order
    const notifications = await Notification.find({
      userId: userId,
      isMobile: true,
    }).sort({
      timestamp: -1,
      read: 1,
    });

    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});
exports.showCount = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;
    const notifications = await Notification.find({
      userId: userId,
      isMobile: true,
      read: false,
    });
    return res.status(200).json({ success: true, count: notifications.length });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});
exports.resetCounter = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;
    const notifications = await Notification.updateMany(
      {
        userId: userId,
        isMobile: true,
        read: false,
      },
      { read: true },
      { new: true } // Including { new: true } for consistency
    );
    return res.status(200).json({ success: true, count: notifications.length });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});
exports.MobileNotificationCount = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query parameters
    console.log(userId);
    // Ensure userId is provided
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "userId parameter is missing" });
    }

    // Find and fetch all unread mobile notifications for the provided userId
    const unreadNotifications = await Notification.find({
      userId: userId,
      isMobile: true,
      read: false,
    });

    // Mark unread notifications as read
    const note = await Notification.updateMany(
      { userId: userId, isMobile: true, read: false },
      { read: true }
    );

    // Send the count of unread notifications
    return res.status(200).json({ success: true, data: note });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

exports.getInvoiceforMobile = expressAsyncHandler(async (req, res) => {
  try {
    const { customerId, inventoryType } = req.query;
    const user = await model.findOne({ _id: customerId });
    const invoicesArray = user.invoice;

    // Fetching invoices based on the IDs retrieved from the user
    const invoices = await invoiceModel.find({ _id: { $in: invoicesArray } });

    // Extracting planIds from invoices
    const planIds = invoices.map((invoice) => invoice.planId);

    // Fetching plans based on planIds and filtering by inventoryType
    const matchingPlans = await planModel.find({
      _id: { $in: planIds },
      inventoryType,
    });

    // Extracting invoice IDs from matching plans
    const matchingInvoiceIds = matchingPlans.map((plan) => plan._id);

    console.log("Invoices:", invoices);
    console.log("Matching Invoice IDs:", matchingInvoiceIds);

    // Filtering invoices based on the matching invoice IDs
    const filteredInvoices = await invoiceModel.find({
      _id: { $in: invoicesArray },
      planId: {
        $in: matchingInvoiceIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    });
    const updatedUser = await model
      .findOne({ _id: customerId })
      .select("firstName lastName contact");
    console.log(updatedUser);
    // Sending both filtered invoices and user data as the response
    res.status(200).json({ user: updatedUser, invoices: filteredInvoices });
  } catch (error) {
    // Handle any errors
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
