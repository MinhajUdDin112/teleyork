const { default: axios } = require("axios");
const { default: mongoose, trusted, model } = require("mongoose");
const custModel = require("../user/model");
const os = require("os");
const { exec } = require("child_process");
const { promisify } = require("util");
const sacModel = require("../sacNumber/sacModels");
const programModel = require("../acpPrograms/model");
const planModel = require("../plan/model");
const carrierModel = require("../carrier/model");
const PWGServices = require("./service");
const invoiceservice = require("../invoices/services");
const qrs = require("qr-image");
const crypto = require("crypto");
const pdf = require("pdf-parse");
const path = require("path");
const qr = require("qrcode");
const fs = require("fs").promises;
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fontkit = require("fontkit");
const acpService = require("../acpPrograms/service");
const {
  enrollmentId: generateEnrollmentId,
  SixDigitUniqueId,
} = require("../utils/enrollmentId");
const userMod = require("../adminUser/adminUserModel");
const inventoryService = require("../EsnNumbers/Services");

const padaservice = require("../user/service");

const service = {
  batchEnrollUser: async (enrollment) => {
    console.log("enrollment", enrollment);

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
      .post(url, JSON.stringify(enrollment), options)
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

  savedata: async (
    enrollments,
    uploadedBy,
    serviceProvider,
    uploadedFileName,
    filePath
  ) => {
    enrollments.shift(); // Assuming the first element is a header

    // Fetch required data in advance
    const sacMap = new Map();
    const programMap = new Map();
    const planMap = new Map();
    const carrierMap = new Map();
    const userDetails = await userMod.findOne({ _id: uploadedBy });
    const skippedRows = [];
    const promises = enrollments.map(async (data, index) => {
      try {
        const existingData = await custModel.findOne({ esn: data.ESN });

        // If ESN number already exists, skip this row
        if (existingData) {
          const skippedMessage = `Row ${index + 2} with ESN ${
            data.ESN
          } already exists in the database. Skipping this row.`;
          console.log(skippedMessage);
          skippedRows.push(skippedMessage); // Add skipped row message to skippedRows array
          return;
        }
        // Assuming enrollmentId() and SixDigitUniqueId() functions are defined elsewhere
        const enrollmentId = generateEnrollmentId();
        const accountId = SixDigitUniqueId();
        let creat = await convertDateToYYYYMMDD(data.Account_Created_Date);
        let activ = await convertDateToYYYYMMDD(data.Account_Activation_Date);
        if (creat > activ) {
          const errorMessage = `Row ${
            index + 2
          }: Account creation Date cannot be greater than Account Activation Date for ESN ${
            data.ESN
          }`;
          console.log(errorMessage);
          skippedRows.push(errorMessage); // Add error message to errorRows array
          return;
        }
        let body = {
          firstName: data.First_Name,
          middleName: data.Middle_Name,
          lastName: data.Last_Name,
          suffix: data.Suffix,
          SSN: data.Social_Security_No,
          BenifitFirstName: data.Beneficiary_FirstName
            ? data.Beneficiary_FirstName
            : "",
          BenifitMiddleName: data.Beneficiary_MiddleName
            ? data.Beneficiary_MiddleName
            : "",
          BenifitLastName: data.Beneficiary_LastName
            ? data.Beneficiary_Last
            : "",
          BenifitSSN: data.Beneficiary_SSN,
          // BenifitDOB: data.Beneficiary_DOB,
          //BenifitDOB: convertDateToYYYYMMDD(data?.Beneficiary_DOB),
          address1: data.Address,
          address2: data.Address2,
          city: data.City,
          state: data.State,
          zip: data.Zip,
          isEnrollmentComplete: true,
          mailingAddress1: data.Mailing_Address,
          mailingAddress2: data.Mailing_Address2,
          mailingCity: data.Mailing_City,
          mailingState: data.Mailing_State,
          mailingZip: data.Mailing_Zip,
          createdAt: await convertDateToYYYYMMDD(data.Account_Created_Date),
          activatedAt: await convertDateToYYYYMMDD(
            data.Account_Activation_Date
          ),
          orderCreateDate: await convertDateToYYYYMMDD(
            data.Account_Created_Date
          ),
          mdnActivateAt: await convertDateToYYYYMMDD(data.MDN_Activation_Date), //
          DOB: await convertDateToYYYYMMDD(data.DOB),
          SSN: data.Social_Security_No,
          acpProgram: data.Program_Name,
          status: "active",
          email: data.Email,
          plan: data.PlanId, //
          Carrier_Status: data.Carrier_Status,
          Account_Status: data.Account_Status,
          Carrier_Plan_Code: data.Carrier_Plan_Code,
          esn: data.ESN,
          phoneNumber: data.MDN,
          phoneNumberInEbbp: data.MDN,
          accountType: data.Account_Type,
          contact: data.alternateContact,
          //contact: data.alternateContact,
          customerId: data.Pwg_customerId,
          subscriberId: data.NLAD_Subscriber_ID,
          applicationId: data.NV_Application_ID,
          transactionEffectiveDate: await convertDateToYYYYMMDD(
            data.transactionEffectiveDate || Date.now()
          ),
          serviceInitializationDate: await convertDateToYYYYMMDD(
            data.serviceInitializationDate || Date.now()
          ),
          nladEnrollmentDate: await convertDateToYYYYMMDD(
            data.transactionEffectiveDate || Date.now()
          ),

          IMEI: data.IMEI,
          Phone_Model: data.Phone_Model,
          Device_Type: data.Device_Type,
          Device_Make: data.Device_Make,
          Device_Model_Number: data.Device_Model_Number,
          Device_Reimbursement_Date: await convertDateToYYYYMMDD(
            data.Device_Reimbursement_Date
          ),
          Device_Retail_Cost: data.Device_Retail_Cost,
          Device_CoPay_Cost: data.Device_CoPay_Cost,
          Device_Reimbursement_rate: data.Device_Reimbursement_rate,
          Device_Delivery_Mehod: data.Device_Delivery_Mehod,
          Cosumer_Fee: data.Cosumer_Fee,
          assignToQa: uploadedBy,
          serviceProvider,
          // csr: uploadedBy,
          // createdBy: uploadedBy,
          enrollmentId,
          accountId,
          assignedToUser: [uploadedBy],
          assignTo: [uploadedBy],
          approvedBy: uploadedBy,
          enrolledBy: uploadedBy,
          isUploaded: true,
          approval: [
            {
              approvedBy: uploadedBy,
              level: 5,
              isEnrolled: true,
              isComplete: true,
            },
          ],
          level: [5, 6],
          department: userDetails.department,
          statusElectronically: "active",
          currentPlan: {
            planId: data.PlanId,
            planName: data.Plan_Name,
            planCharges: "30",
            additionalCharges: [],
            discount: [
              {
                name: "ACP Discount Applied",
                amount: "30",
              },
            ],
            billingPeriod: {
              from: "onActivation",
              to: "onActivation",
            },
            chargingType: "monthly",
            printSetting: "Both",
            invoiceDueDate: "20",
          },
        };
        console.log("activatedAt in savedata", body.activatedAt);
        // Fetch additional data if not cached
        if (!sacMap.has(data.State)) {
          const sac = await sacModel.findOne({ state: data.State });
          sacMap.set(data.State, sac.sac);
        }
        if (!programMap.has(data.Program_Name)) {
          const program = await programModel.findOne({
            _id: data.Program_Name,
          });
          programMap.set(data.Program_Name, program._id);
        }
        if (!planMap.has(data.PlanId)) {
          var planId = data.PlanId.replace(/(?<!0)\b\d\b/g, function (match) {
            return "0" + match;
          });

          console.log("planId", planId);
          var plandetails = await planModel.findOne({
            planId: planId,
            type: data.Account_Type,
            inventoryType: data.Inventory_Type,
          });

          if (plandetails) {
            planMap.set(data.PlanId, plandetails);
            planId = plandetails._id;
            planName = plandetails.name;
            planPrice = plandetails.price;
          } else {
            // Handle the case where plandetails is not found
            console.error(`Plan details not found for PlanId: ${planId}`);
            const errorMessage = `Row ${index + 1}: PlanId ${
              data.PlanId
            } does not exist in the database. Skipping this row.`;
            console.error(errorMessage);
            skippedRows.push(errorMessage);
            return;
          }
        } else {
          planId = planMap.get(data.PlanId)._id;
          planName = planMap.get(data.PlanId).name;
          planPrice = planMap.get(data.planPrice).price;
        }
        if (!carrierMap.has(data.Carrier)) {
          const carrierDetail = await carrierModel.findOne({
            name: data.Carrier,
          });
          carrierMap.set(data.Carrier, carrierDetail._id);
        }

        body.sac = sacMap.get(data.State);
        body.acpProgram = programMap.get(data.Program_Name);
        body.plan = planMap.get(data.PlanId);
        body.carrier = carrierMap.get(data.Carrier);

        // Optimize Device Type check
        body.deviceEligibilty = ["tablet", "TAB"].includes(
          data.Device_Type.toLowerCase()
        );

        // Create customer
        let customer = new custModel(body);
        customer = await customer.save();
        console.log("body", body);
        console.log(data.Device_Make);
        // Sim History
        const simHistory = [
          {
            Company_id: serviceProvider,
            Assigned_by: uploadedBy,
            Assigned_to: customer._id,
            Enrollment_id: enrollmentId,
            Plan_id: body.plan._id,
          },
        ];

        // Activate ESN
        const inventory = await inventoryService.activatedEsn(
          uploadedBy,
          body.carrier,
          data.ESN,
          serviceProvider,
          userDetails.department,
          uploadedBy,
          data.Device_Model_Number ? data.Device_Model_Number : "nano",
          "box 12",
          "SIM",
          "Add And Assign Non Active",
          data.IMEI,
          "ACP",
          data.Device_Make ? data.Device_Make : "SIM",
          simHistory
        );

        const serviceInfo = await PWGServices.serviceInformation(data.MDN);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const queryHLR = await PWGServices.queryLHR(data.MDN, data.ESN);
        console.log("queryHlR is here", queryHLR);
        console.log(
          "queryHlR simstatus is here",
          queryHLR.simStatus,
          queryHLR.simStatus
        );
        console.log("queryHlR simstatus is here", queryHLR);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const querySim = await PWGServices.querySim(data.ESN);

        await custModel.findOneAndUpdate(
          { _id: customer._id },
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
            activatedBy: userDetails._id,
            //activatedAt: Date.now(),
          },
          { new: true }
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const invoice = await invoiceservice.bulkInvoiceSave(
          customer._id,
          planId,
          body.accountId,
          planName,
          "30",
          body.activatedAt
        );
        //console.log(invoice);
        // Update customer with esnId
        const custdata = await custModel.findOneAndUpdate(
          { _id: customer._id },
          {
            esnId: inventory._id,
            invoice: invoice,
            acpUploadedFilePath: filePath,
            acpUploadedFileName: uploadedFileName,
            AcptoPrepaid: false,
          }
        );
        if (custdata) {
          await datatopdf(custdata);
        }
      } catch (error) {
        const errorMessage = `Error processing row ${index + 1}: ${
          error.message
        }`;
        console.error(errorMessage);
        skippedRows.push(errorMessage);
      }
    });

    await Promise.all(promises);
    let responseMessage = "Skipped Rows:\n";
    skippedRows.forEach((row) => {
      responseMessage += `${row}\n`;
    });
    return { msg: responseMessage, skippedRows };
  },

  // postpaidSaveData: async (enrollments, uploadedBy, serviceProvider) => {
  //   enrollments.shift(); // Assuming the first element is a header
  //   console.log(enrollments);
  //   // Fetch required data in advance
  //   const planMap = new Map();
  //   const carrierMap = new Map();
  //   const userDetails = await userMod.findOne({ _id: uploadedBy });
  //   const skippedRows = []; // Array to store skipped rows
  //   const promises = enrollments.map(async (data, index) => {
  //     try {
  //       const existingData = await custModel.findOne({ esn: data.ESN });

  //       // If ESN number already exists, skip this row
  //       if (existingData) {
  //         const skippedMessage = `Row ${index + 1} with ESN ${
  //           data.ESN
  //         } already exists in the database. Skipping this row.`;
  //         console.log(skippedMessage);
  //         skippedRows.push(skippedMessage); // Add skipped row message to skippedRows array
  //         return;
  //       }

  //       // // Check if PlanId exists in the planMap
  //       // if (!planMap.has(data.PlanId)) {
  //       //   const errorMessage = `Row ${index + 1}: PlanId ${
  //       //     data.PlanId
  //       //   } does not exist in the database. Skipping this row.`;
  //       //   console.error(errorMessage);
  //       //   skippedRows.push(errorMessage);
  //       //   return;
  //       // }

  //       console.log("hrrr");
  //       // Assuming enrollmentId() and SixDigitUniqueId() functions are defined elsewhere
  //       const enrollmentId = generateEnrollmentId();
  //       const accountId = SixDigitUniqueId();

  //       let body = {
  //         csr: uploadedBy,
  //         createdBy: uploadedBy,
  //         firstName: data.First_Name,
  //         middleName: data.Middle_Name,
  //         lastName: data.Last_Name,
  //         suffix: data.Suffix,
  //         SSN: data.Social_Security_No,
  //         BenifitFirstName: data.Beneficiary_FirstName
  //           ? data.Beneficiary_FirstName
  //           : "",
  //         BenifitMiddleName: data.Beneficiary_MiddleName
  //           ? data.Beneficiary_MiddleName
  //           : "",
  //         BenifitLastName: data.Beneficiary_LastName
  //           ? data.Beneficiary_Last
  //           : "",
  //         BenifitSSN: data.Beneficiary_SSN,
  //         // BenifitDOB: data.Beneficiary_DOB,
  //         //BenifitDOB: convertDateToYYYYMMDD(data?.Beneficiary_DOB),
  //         address1: data.Address,
  //         address2: data.Address2,
  //         city: data.City,
  //         state: data.State,
  //         zip: data.Zip,
  //         maidenMotherName: data.MotherMaidenName,
  //         isEnrollmentComplete: true,
  //         mailingAddress1: data.Mailing_Address,
  //         mailingAddress2: data.Mailing_Address2,
  //         mailingCity: data.Mailing_City,
  //         mailingState: data.Mailing_State,
  //         mailingZip: data.Mailing_Zip,
  //         //createdAt: convertDateToYYYYMMDD(data.Account_Created_Date),
  //         activatedAt: convertDateToYYYYMMDD(data.Account_Activation_Date),
  //         activatedAt: convertDateToYYYYMMDD(data.MDN_Activation_Date),
  //         DOB: convertDateToYYYYMMDD(data.DOB),
  //         status: "active",
  //         email: data.Email,
  //         plan: data.PlanId,
  //         Carrier_Status: data.Carrier_Status,
  //         Account_Status: data.Account_Status,
  //         Carrier_Plan_Code: data.Carrier_Plan_Code,
  //         esn: data.ESN,
  //         phoneNumber: data.MDN,
  //         phoneNumberInEbbp: data.MDN,
  //         accountType: "Postpaid",
  //         contact: data.Alternate_Phone_No,
  //         customerId: data.Pwg_customerId,
  //         subscriberId: data.NLAD_Subscriber_ID,
  //         currentPlan: {
  //           planId: data.PlanId,
  //           planName: data.Plan_Name,
  //           additionalCharges: [],
  //           discount: [],
  //           billingPeriod: {
  //             from: "onActivation",
  //             to: "onActivation",
  //           },
  //           chargingType: "monthly",
  //           printSetting: "Both",
  //           invoiceDueDate: "20",
  //         },
  //         // transactionEffectiveDate: convertDateToYYYYMMDD(
  //         //   data.transactionEffectiveDate || Date.now()
  //         // ),
  //         // serviceInitializationDate: convertDateToYYYYMMDD(
  //         //   data.serviceInitializationDate || Date.now()
  //         // ),
  //         // nladEnrollmentDate: convertDateToYYYYMMDD(
  //         //   data.transactionEffectiveDate || Date.now()
  //         // ),
  //         IMEI: data.IMEI,
  //         // Phone_Model: data.Phone_Model,
  //         // Device_Type: data.Device_Type,
  //         // Device_Make: data.Device_Make,
  //         // Device_Model_Number: data.Device_Model_Number,
  //         // Device_Reimbursement_Date: convertDateToYYYYMMDD(
  //         //   data.Device_Reimbursement_Date
  //         // ),
  //         // Device_Retail_Cost: data.Device_Retail_Cost,
  //         // Device_CoPay_Cost: data.Device_CoPay_Cost,
  //         // Device_Reimbursement_rate: data.Device_Reimbursement_rate,
  //         // Device_Delivery_Mehod: data.Device_Delivery_Mehod,
  //         //Cosumer_Fee: data.Cosumer_Fee,
  //         assignToQa: uploadedBy,
  //         serviceProvider,
  //         csr: uploadedBy,
  //         createdBy: uploadedBy,
  //         enrollmentId,
  //         accountId,
  //         assignedToUser: [uploadedBy],
  //         assignTo: [uploadedBy],
  //         approvedBy: uploadedBy,
  //         enrolledBy: uploadedBy,
  //         approval: [
  //           {
  //             approvedBy: uploadedBy,
  //             level: 2,
  //             isEnrolled: true,
  //             isComplete: true,
  //           },
  //         ],
  //         level: [2],
  //         department: userDetails.department,
  //         statusElectronically: "active",
  //       };

  //       if (!planMap.has(data.PlanId)) {
  //         console.log(
  //           "huhh",
  //           data.PlanId,
  //           data.Account_Type,
  //           data.Inventory_Type
  //         );
  //         var plandetails = await planModel.findOne({
  //           planId: data.PlanId,
  //           type: data.Account_Type,
  //           inventoryType: data.Inventory_Type,
  //         });
  //         console.log(plandetails);
  //         if (plandetails) {
  //           console.log("here");
  //           planMap.set(data.PlanId, plandetails);
  //           planId = plandetails._id;
  //           planName = plandetails.name;
  //           planPrice = plandetails.price;
  //         } else {
  //           // Handle the case where plandetails is not found
  //           console.error(`Plan details not found for PlanId: ${data.PlanId}`);
  //           const errorMessage = `Row ${index + 1}: PlanId ${
  //             data.PlanId
  //           } does not exist in the database. Skipping this row.`;
  //           console.error(errorMessage);
  //           skippedRows.push(errorMessage);
  //           return;
  //         }
  //       } else {
  //         planId = planMap.get(data.PlanId)._id;
  //         planName = planMap.get(data.PlanId).name;
  //         planPrice = planMap.get(data.planPrice).price;
  //       }
  //       if (!carrierMap.has(data.Carrier)) {
  //         const carrierDetail = await carrierModel.findOne({
  //           name: data.Carrier,
  //         });
  //         carrierMap.set(data.Carrier, carrierDetail._id);
  //       }

  //       body.plan = planMap.get(data.PlanId);
  //       body.carrier = carrierMap.get(data.Carrier);

  //       // Optimize Device Type check
  //       // body.deviceEligibilty = ["tablet", "TAB"].includes(
  //       //   data.Device_Type.toLowerCase()
  //       // );

  //       // Create customer
  //       let customer = new custModel(body);
  //       customer = await customer.save();
  //       //console.log("body", body);

  //       // Sim History
  //       const simHistory = [
  //         {
  //           Company_id: serviceProvider,
  //           Assigned_by: uploadedBy,
  //           Assigned_to: customer._id,
  //           Enrollment_id: enrollmentId,
  //           Plan_id: body.plan,
  //         },
  //       ];

  //       // Activate ESN
  //       const inventory = await inventoryService.activatedEsn(
  //         uploadedBy,
  //         body.carrier,
  //         data.ESN,
  //         serviceProvider,
  //         uploadedBy,
  //         userDetails.department,
  //         data.Inventory_Model ? data.Inventory_Model : "",
  //         "box 12",
  //         data.inventoryType,
  //         "Add And Assign Non Active",
  //         data.IMEI,
  //         "POSTPAID",
  //         data.inventory_Make ? data.inventory_Make : "",
  //         simHistory
  //       );

  //       const serviceInfo = await PWGServices.serviceInformation(data.MDN);
  //       await new Promise((resolve) => setTimeout(resolve, 3000));
  //       const queryHLR = await PWGServices.queryLHR(data.MDN, data.ESN);
  //       console.log("queryHlR is here", queryHLR);
  //       console.log(
  //         "queryHlR simstatus is here",
  //         queryHLR.simStatus,
  //         queryHLR.simStatus
  //       );
  //       console.log("queryHlR simstatus is here", queryHLR);
  //       await new Promise((resolve) => setTimeout(resolve, 3000));
  //       const querySim = await PWGServices.querySim(data.ESN);

  //       await custModel.findOneAndUpdate(
  //         { _id: customer._id },
  //         {
  //           serviceStatus: serviceInfo?.serviceStatus,
  //           planEffectiveDate: serviceInfo?.planEffectiveDate,
  //           socs: serviceInfo?.socValues,
  //           planExpirationDate: serviceInfo?.planExpirationDate,
  //           talkBalance: serviceInfo?.talkBalance,
  //           textBalance: serviceInfo?.textBalance,
  //           dataBalance: serviceInfo?.dataBalance,
  //           simStatus: queryHLR,
  //           PUK1: querySim?.PUK1,
  //           PUK2: querySim?.PUK2,
  //           ICCIDSTATUS: querySim?.ICCIDSTATUS,
  //           activatedBy: userDetails._id,
  //           activatedAt: Date.now(),
  //         },
  //         { new: true }
  //       );
  //       await new Promise((resolve) => setTimeout(resolve, 4000));

  //       const invoice = await invoiceservice.bulkinvoice(
  //         customer._id,
  //         planId,
  //         body.accountId,
  //         planName,
  //         planPrice
  //       );
  //       console.log(invoice);
  //       //Update customer with esnId
  //       await custModel.findOneAndUpdate(
  //         { _id: customer._id },
  //         { esnId: inventory._id, $push: { invoice: invoice._id } }
  //       );
  //     } catch (error) {
  //       const errorMessage = `Error processing row ${index + 1}: ${
  //         error.message
  //       }`;
  //       console.error(errorMessage);
  //       skippedRows.push(errorMessage);
  //     }
  //   });

  //   await Promise.all(promises);
  //   // Generate response message for skipped rows
  //   let responseMessage = "Skipped Rows:\n";
  //   skippedRows.forEach((row) => {
  //     responseMessage += `${row}\n`;
  //   });
  //   return { msg: responseMessage, skippedRows };
  // },
  postpaidSaveData: async (enrollments, uploadedBy, serviceProvider) => {
    enrollments.shift(); // Assuming the first element is a header
    console.log(enrollments);
    // Fetch required data in advance
    const planMap = new Map();
    const carrierMap = new Map();
    const userDetails = await userMod.findOne({ _id: uploadedBy });
    const skippedRows = []; // Array to store skipped rows
    const promises = enrollments.map(async (data, index) => {
      try {
        const existingData = await custModel.findOne({ esn: data.ESN });

        // If ESN number already exists, skip this row
        if (existingData) {
          const skippedMessage = `Row ${index + 1} with ESN ${
            data.ESN
          } already exists in the database. Skipping this row.`;
          console.log(skippedMessage);
          skippedRows.push(skippedMessage); // Add skipped row message to skippedRows array
          return;
        }

        // Check if PlanId exists in the planMap
        // if (!planMap.has(data.PlanId)) {
        //   const errorMessage = `Row ${index + 1}: PlanId ${
        //     data.PlanId
        //   } does not exist in the database. Skipping this row.`;
        //   console.error(errorMessage);
        //   skippedRows.push(errorMessage);
        //   return;
        // }

        console.log("hrrr");
        // Assuming enrollmentId() and SixDigitUniqueId() functions are defined elsewhere
        const enrollmentId = generateEnrollmentId();
        const accountId = SixDigitUniqueId();

        let body = {
          csr: uploadedBy,
          createdBy: uploadedBy,
          firstName: data.First_Name,
          middleName: data.Middle_Name,
          lastName: data.Last_Name,
          suffix: data.Suffix,
          SSN: data.Social_Security_No,
          BenifitFirstName: data.Beneficiary_FirstName
            ? data.Beneficiary_FirstName
            : "",
          BenifitMiddleName: data.Beneficiary_MiddleName
            ? data.Beneficiary_MiddleName
            : "",
          BenifitLastName: data.Beneficiary_LastName
            ? data.Beneficiary_Last
            : "",
          BenifitSSN: data.BenifitSSN ? data.BenifitSSN : "",
          BenifitDOB: data.BenifitDOB ? data.BenifitDOB : "",
          //BenifitDOB: convertDateToYYYYMMDDP(data?.Beneficiary_DOB),
          address1: data.Address,
          address2: data.Address2,
          city: data.City,
          state: data.State,
          zip: data.Zip,
          maidenMotherName: data.MotherMaidenName,
          isEnrollmentComplete: true,
          mailingAddress1: data.Mailing_Address,
          mailingAddress2: data.Mailing_Address2,
          mailingCity: data.Mailing_City,
          mailingState: data.Mailing_State,
          mailingZip: data.Mailing_Zip,
          createdAt: await convertDateToYYYYMMDDP(data.Account_Created_Date),
          activatedAt: await convertDateToYYYYMMDDP(
            data.Account_Activation_Date
          ),
          activatedAt: await convertDateToYYYYMMDDP(data.MDN_Activation_Date),
          DOB: await convertDateToYYYYMMDDP(data.DOB),
          status: "active",
          email: data.Email,
          plan: data.PlanId,
          Carrier_Status: data.Carrier_Status,
          Account_Status: data.Account_Status,
          Carrier_Plan_Code: data.Carrier_Plan_Code,
          esn: data.ESN,
          phoneNumber: data.MDN,
          phoneNumberInEbbp: data.MDN,
          accountType: "Postpaid",
          contact: data.Alternate_Phone_No,
          customerId: data.Pwg_customerId,
          subscriberId: data.NLAD_Subscriber_ID,
          currentPlan: {
            planId: data.PlanId,
            planName: data.Plan_Name,
            additionalCharges: [],
            discount: [],
            billingPeriod: {
              from: "onActivation",
              to: "onActivation",
            },
            chargingType: "monthly",
            printSetting: "Both",
            invoiceDueDate: "20",
          },
          // transactionEffectiveDate: convertDateToYYYYMMDD(
          //   data.transactionEffectiveDate || Date.now()
          // ),
          // serviceInitializationDate: convertDateToYYYYMMDD(
          //   data.serviceInitializationDate || Date.now()
          // ),
          // nladEnrollmentDate: convertDateToYYYYMMDD(
          //   data.transactionEffectiveDate || Date.now()
          // ),
          IMEI: data.IMEI,
          // Phone_Model: data.Phone_Model,
          // Device_Type: data.Device_Type,
          // Device_Make: data.Device_Make,
          // Device_Model_Number: data.Device_Model_Number,
          // Device_Reimbursement_Date: convertDateToYYYYMMDD(
          //   data.Device_Reimbursement_Date
          // ),
          // Device_Retail_Cost: data.Device_Retail_Cost,
          // Device_CoPay_Cost: data.Device_CoPay_Cost,
          // Device_Reimbursement_rate: data.Device_Reimbursement_rate,
          // Device_Delivery_Mehod: data.Device_Delivery_Mehod,
          //Cosumer_Fee: data.Cosumer_Fee,
          assignToQa: uploadedBy,
          serviceProvider,
          csr: uploadedBy,
          createdBy: uploadedBy,
          enrollmentId,
          accountId,
          assignedToUser: [uploadedBy],
          assignTo: [uploadedBy],
          approvedBy: uploadedBy,
          enrolledBy: uploadedBy,
          approval: [
            {
              approvedBy: uploadedBy,
              level: 2,
              isEnrolled: true,
              isComplete: true,
            },
          ],
          level: [2],
          department: userDetails.department,
          statusElectronically: "active",
          isUploaded: true,
        };

        if (!planMap.has(data.PlanId)) {
          var planId = data.PlanId.replace(/(?<!0)\b\d\b/g, function (match) {
            return "0" + match;
          });

          console.log("planId", planId);
          var plandetails = await planModel.findOne({
            planId: data.PlanId,
            type: "POSTPAID",
            inventoryType: data.Inventory_Type,
          });

          if (plandetails) {
            planMap.set(data.PlanId, plandetails);
            planId = plandetails._id;
            planName = plandetails.name;
            planPrice = plandetails.price;
          } else {
            // Handle the case where plandetails is not found
            console.error(`Plan details not found for PlanId: ${planId}`);
            const errorMessage = `Row ${index + 1}: PlanId ${
              data.PlanId
            } does not exist in the database. Skipping this row.`;
            console.error(errorMessage);
            skippedRows.push(errorMessage);
            return;
          }
        } else {
          planId = planMap.get(data.PlanId)._id;
          planName = planMap.get(data.PlanId).name;
          planPrice = planMap.get(data.planPrice).price;
        }
        if (!carrierMap.has(data.Carrier)) {
          const carrierDetail = await carrierModel.findOne({
            name: data.Carrier,
          });
          carrierMap.set(data.Carrier, carrierDetail._id);
        }

        body.plan = planMap.get(data.PlanId);
        body.carrier = carrierMap.get(data.Carrier);

        // Optimize Device Type check
        // body.deviceEligibilty = ["tablet", "TAB"].includes(
        //   data.Device_Type.toLowerCase()
        // );

        // Create customer
        let customer = new custModel(body);
        customer = await customer.save();
        //console.log("body", body);

        // Sim History
        const simHistory = [
          {
            Company_id: serviceProvider,
            Assigned_by: uploadedBy,
            Assigned_to: customer._id,
            Enrollment_id: enrollmentId,
            Plan_id: body.plan,
          },
        ];

        // Activate ESN
        const inventory = await inventoryService.activatedEsn(
          uploadedBy,
          body.carrier,
          data.ESN,
          serviceProvider,
          uploadedBy,
          userDetails.department,
          data.Inventory_Model ? data.Inventory_Model : "nano",
          "box 12",
          data.Inventory_Type,
          "Add And Assign Non Active",
          data.IMEI,
          "POSTPAID",
          data.inventory_Make ? data.inventory_Make : "SIM",
          simHistory
        );

        const serviceInfo = await PWGServices.serviceInformation(data.MDN);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const queryHLR = await PWGServices.queryLHR(data.MDN, data.ESN);
        console.log("queryHlR is here", queryHLR);
        console.log(
          "queryHlR simstatus is here",
          queryHLR.simStatus,
          queryHLR.simStatus
        );
        console.log("queryHlR simstatus is here", queryHLR);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const querySim = await PWGServices.querySim(data.ESN);

        await custModel.findOneAndUpdate(
          { _id: customer._id },
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
            activatedBy: userDetails._id,
            activatedAt: Date.now(),
          },
          { new: true }
        );
        await new Promise((resolve) => setTimeout(resolve, 4000));

        const invoice = await invoiceservice.bulkinvoice(
          customer._id,
          planId,
          body.accountId,
          planName,
          planPrice,
          body.activatedAt
        );
        console.log(invoice);
        const billConfig = await invoiceservice.BillConfig(
          data.Inventory_Type,
          "POSTPAID",
          customer._id,
          invoice
        );
        //Update customer with esnId
        await custModel.findOneAndUpdate(
          { _id: customer._id },
          {
            esnId: inventory._id,
            invoice: invoice,
            currentPlan: billConfig.currentPlan,
            billId: billConfig.billingConfig._id,
            invoiceOneTimeCharges: "0",
            invoiceType: "Monthly",
            lateFee: "5",
            paymentMethod: "Skip Payment",
            selectProduct: data.Inventory_Type,
            totalAmount: planPrice,
            invoiceStatus: "pending",
          }
        );
      } catch (error) {
        const errorMessage = `Error processing row ${index + 1}: ${
          error.message
        }`;
        console.error(errorMessage);
        skippedRows.push(errorMessage);
      }
    });

    await Promise.all(promises);
    // Generate response message for skipped rows
    let responseMessage = "Skipped Rows:\n";
    skippedRows.forEach((row) => {
      responseMessage += `${row}\n`;
    });
    return { msg: responseMessage, skippedRows };
  },
};

// Function to convert a date to YYYYMMDD format
async function convertDateToYYYYMMDD(date) {
  const newDate = date + "T00:00:00.000+00:00";
  const d = new Date(newDate);
  console.log(newDate);
  d.setUTCHours(d.getUTCHours() + 5); // Adding 5 hours to UTC time
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");
  console.log(
    `activatedAt in fun ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  );
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
async function convertDateToYYYYMMDDP(date) {
  const newDate = date + "T00:00:00.000+00:00";
  const d = new Date(newDate);
  console.log(newDate);
  d.setUTCHours(d.getUTCHours() + 5); // Adding 5 hours to UTC time
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0"); // Corrected to getUTCMonth
  const day = d.getUTCDate().toString().padStart(2, "0"); // Corrected to getUTCDate
  const year = d.getUTCFullYear(); // Corrected to getUTCFullYear
  const hours = d.getUTCHours().toString().padStart(2, "0"); // Corrected to getUTCHours
  const minutes = d.getUTCMinutes().toString().padStart(2, "0"); // Corrected to getUTCMinutes
  const seconds = d.getUTCSeconds().toString().padStart(2, "0"); // Corrected to getUTCSeconds
  console.log(
    `activatedAt in fun ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  );
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Function to format a date to a custom format (you can adjust the format as needed)
function formatDateToCustomFormat(date) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}
async function datatopdf(enrollmentData, res) {
  try {
    const outputPath = `uploads/SP_${enrollmentData.enrollmentId}.pdf`;
    const templateBytes = await fs.readFile("pdf-templates/consentij.pdf");
    const pdfDoc = await PDFDocument.load(templateBytes, {
      ignoreEncryption: true,
    });
    const form = pdfDoc.getForm();
    const fieldNames = form.getFields().map((field) => field.getName());
    console.log("Form Field Names:", fieldNames);
    const randomId = generateRandomID(27);

    const formattedDate = enrollmentData.createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });

    const formattedDOB = enrollmentData.DOB.toLocaleDateString();
    // const fullName = `${enrollmentData.firstName} ${enrollmentData.lastName}`;
    // const signatureFont = await pdfDoc.embedFont(StandardFonts.ZapfDingbats);
    // const fontSize = 12;
    // const textColor = rgb(0, 0, 0); // Black color
    // const signatureText = fullName;
    // Set the signature text

    // Update each field with corresponding data
    form.getTextField("serial1").setText(randomId);
    form.getTextField("serial2").setText(randomId);
    form.getTextField("Text-lMQQWgj0hy").setText(randomId);
    form.getTextField("serial4").setText(randomId);
    form.getTextField("digitalfinger").setText(randomId);
    form.getTextField("partyid").setText(randomId);

    form.getTextField("id0").setText(randomId);
    form.getTextField("genon00").setText(formattedDate);
    form.getTextField("signon00").setText("https://ijwireless.net/");
    form
      .getTextField("firstname")
      .setText("(" + enrollmentData.firstName + ")");
    form.getTextField("lastname").setText("(" + enrollmentData.lastName + ")");
    form
      .getTextField("contact")
      .setText("(" + String(enrollmentData.phoneNumber) + ")");
    form.getTextField("dob").setText("(" + formattedDOB + ")");
    form.getTextField("email0").setText("(" + enrollmentData.email + ")");
    form.getTextField("ssn").setText("(" + enrollmentData.SSN + ")");
    form.getTextField("address").setText("(" + enrollmentData.address1 + ")");
    form.getTextField("city").setText("(" + enrollmentData.city + ")");
    form.getTextField("state").setText("(" + enrollmentData.state + ")");
    form.getTextField("zip").setText("(" + enrollmentData.zip + ")");
    form.getTextField("id5").setText(randomId);
    form.getTextField("genon2").setText(formattedDate);
    form.getTextField("signon4").setText("https://ijwireless.net/");
    form.getTextField("id2").setText(randomId);
    form.getTextField("id4").setText(randomId);
    form.getTextField("genon1").setText(formattedDate);
    form.getTextField("signon1").setText("https://ijwireless.net/");
    form.getTextField("signon").setText(formattedDate);
    form.getTextField("signby").setText(enrollmentData.firstName);
    form.getTextField("signon4").setText("https://ijwireless.net/");
    form.getTextField("email").setText("(" + enrollmentData.email + ")");
    form
      .getTextField("flname10")
      .setText(
        "(" + `${enrollmentData.firstName} ${enrollmentData.lastName}` + ")"
      );
    form.getTextField("timestamp1").setText(formattedDate);
    form.getTextField("timestamp2").setText(formattedDate);
    form.getTextField("timestamp3").setText(formattedDate);
    form.getTextField("ip").setText("2400:adcc:2105:b500:b588:5939:9af3");
    form
      .getTextField("Text-Om6f3swOOA")
      .setText("2400:adcc:2105:b500:b588:5939:9af3");
    form
      .getTextField("signature2")
      .setText(`${enrollmentData.firstName} ${enrollmentData.lastName}`);
    form
      .getTextField("signature")
      .setText(`${enrollmentData.firstName} ${enrollmentData.lastName}`);

    // form.getTextField("signature2").setText(signatureText);
    // form.getTextField("signature").setText(signatureText);

    form
      .getTextField("flname1")
      .setText(`${enrollmentData.firstName} ${enrollmentData.lastName}`);
    form.getTextField("id5").setText(randomId);
    form
      .getTextField("flname3")
      .setText(
        "(" + `${enrollmentData.firstName} ${enrollmentData.lastName}` + ")"
      );
    form
      .getTextField("flname")
      .setText(
        "(" + `${enrollmentData.firstName} ${enrollmentData.lastName}` + ")"
      );

    const checkboxYesNo = { yes: "yes", no: "no" };

    const checkboxFieldMap = {
      "Supplemental Assistance Nutrition Program (SNAP)": "snap",
      "Supplemental Security": "ssi",
      Medicaid: "medicaid",
      "Federal Public Housing Assistance": "fpha",
      "Federal Pell Grant": "fpg",
      "Special Supplemental Nutrition Program For Women,Infants,Children (WIC)":
        "wic",
      "Free and Reduced Price School Lunch or Breakfast Program, or enrollment in a Community Eligibility Provision School. If you choose this program, please enter your school name, school district and state":
        "frp",
      "Bureau Of Indian Affairs General Assistance": "bia",
      "Tribal TANF": "tanf",
      "Food Distribution Program on Indian Reservations": "fdpir",
      "Tribal Head Start": "ths",
      household: "household",
      acp: "acp",
      location: "location",
    };
    // Always mark checkboxes as "no" by default

    if (Array.isArray(enrollmentData.acpProgram)) {
      enrollmentData.acpProgram.forEach(async (programId) => {
        try {
          const program = await acpService.getOne(programId);
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
              console.error("No mapping found for program name:", programName);
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
            const checkbox = form.getCheckBox(checkboxFieldMap[checkboxField]);
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
            console.error("No mapping found for program name:", programName);
            // Handle the case where no mapping is found
          }
        } else {
          console.error("No matching program found for ID:", singleProgramId);
          // Handle the case where no matching program is found
        }
      } catch (error) {
        console.error(
          `Error fetching ACP program with ID ${singleProgramId}:`,
          error
        );
      }
    }

    // Always mark the "household" checkbox
    const householdCheckbox = form.getCheckBox(checkboxFieldMap["acp"]);
    if (householdCheckbox) {
      householdCheckbox.check(checkboxYesNo.yes);
    }
    const householdCheckboxs = form.getCheckBox(checkboxYesNo["no"]);
    if (householdCheckboxs) {
      householdCheckboxs.check(checkboxYesNo.no);
    }
    // Generate QR code for enrollmentData
    const userId = enrollmentData.enrollmentId;

    // File path of the user's specific PDF form
    const userPdfFilePath = `https://dev-api-ijwireless.teleyork.com/SP_${userId}.pdf`;

    // Generate QR code image data URL with the user's PDF form file path
    const qrCodeImage = qrs.imageSync(userPdfFilePath, { type: "png" });

    // Convert QR code image data to a buffer
    const qrCodeImageData = Buffer.from(qrCodeImage, "base64");

    // Embed QR code image into the PDF document
    const qrImage = await pdfDoc.embedPng(qrCodeImageData);

    // Access the fourth page of the PDF document
    const fourthPage = pdfDoc.getPages()[3]; // Pages are 0-indexed

    // Calculate position for bottom left of the page
    const xPos = 50; // Left margin
    const yPos = 65; // Bottom margin

    // Draw QR code image on the fourth page
    fourthPage.drawImage(qrImage, {
      x: xPos,
      y: yPos,
      width: 100,
      height: 100,
    });
    form.flatten();
    // Save the modified PDF to a file
    const modifiedBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, modifiedBytes);
    const randomTimeOffset = Math.floor(Math.random() * 86400000); // Random offset within a day (24 hours)

    // Convert the formatted date to a timestamp and add the random offset
    const creationTimestamp =
      new Date(formattedDate).getTime() + randomTimeOffset;
    const modificationTimestamp =
      new Date(formattedDate).getTime() + randomTimeOffset;

    // Convert the adjusted timestamps back to date strings
    const creationDateString = new Date(creationTimestamp)
      .toISOString()
      .replace(/[TZ]/g, " ");
    const modificationDateString = new Date(modificationTimestamp)
      .toISOString()
      .replace(/[TZ]/g, " ");

    let setFileDatesCommand;
    // Execute PowerShell command to set both creation and modification dates with the adjusted dates
    if (isWindows()) {
      // PowerShell command to set file dates
      setFileDatesCommand = `powershell -Command "(Get-Item '${outputPath}').CreationTime = '${creationDateString}'; (Get-Item '${outputPath}').LastWriteTime = '${modificationDateString}'"`;
    } else {
      // Touch command to set file dates on Linux
      setFileDatesCommand = `touch -d '${creationDateString}' '${outputPath}' && touch -m -d '${modificationDateString}' '${outputPath}'`;
    }

    await promisify(exec)(setFileDatesCommand);
    // Save the PDF path in the database

    const pdfFilePath = outputPath;
    const id = enrollmentData._id;
    // Create an object with the required fields
    const fileData = {
      filetype: "ACP Consent Form",
      filepath: pdfFilePath,
      audioLink: "",
      uploadedBy: id,
    };

    // Update the user document with the new file data
    await custModel.findOneAndUpdate(
      { _id: id },
      { $push: { files: fileData } },
      { new: true }
    );

    console.log(outputPath); // Log the path of the newly created file
  } catch (error) {
    console.error("PDF generation error:", error);
    return res.status(500).send({ msg: "Internal Server Error" });
  }
}
function generateRandomID(length) {
  const characters = "abcdefghijklmnopqrstuvwxyzZ0123456789";
  let id = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters[randomIndex];
  }
  return id;
}
// Function to check if the OS is Windows
function isWindows() {
  return os.platform() === "win32";
}

module.exports = service;
