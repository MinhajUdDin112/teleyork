const express = require("express");
const axios = require("axios");
const PWGServices = require("./service.js");
const mongoose = require("mongoose");
const customerservice = require("../user/service");
const simInventoryService = require("../simInventory/service");
const expressAsyncHandler = require("express-async-handler");
const planModel = require("../plan/model");
const model = require("../user/model");
const service = require("../user/service");
const xml2js = require("xml2js");
const sim = require("../simInventory/model.js");
const Transaction = require("../plan/transactionModel");
const moment = require("moment");
const {
  ACTIVE,
  INACTIVE,
  REJECTED,
  PROSPECTED,
  ENROLLED,
  LABELCREATED,
  SUSPENDED,
  RECONNECT,
  RESTORE,
} = require("../utils/userStatus");

exports.activateESNByPwg = expressAsyncHandler(async (req, res, next) => {
  let { esn, enrollmentId, zip, planId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  console.log(enrollment);
  //   const User = await adminService.getByUserID(userId);
  //   const userRoleLevel = await heirarchyService.getHeirarchyName(User.role.role);
  //   console.log(userRoleLevel.level);
  if (!planId && !esn && !zip) {
    planId = enrollment.plan.planId;
    esn = enrollment.esn;
    zip = enrollment.zip;
  }
  if (!esn) {
    return res.status(400).send({ msg: "esn not assigned to this customer" });
  }

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
            enrollment._id,
            enrollment._id,
            enrollment.enrollmentId,
            enrollment.plan
          );
          console.log("checking status result", statusCheck);
          //   if (
          //     enrollment.accountType === "Prepaid" ||
          //     enrollment.accountType === "Postpaid"
          //   ) {
          //     await service.updateStatus(
          //       enrollment.serviceProvider,
          //       enrollment._id,
          //       enrollment.status
          //     );
          //     await model.findOneAndUpdate(
          //       { _id: enrollmentId },
          //       { statusElectronically: ACTIVE }
          //     );
          //     // await service.approval(
          //     //   enrollmentId,
          //     //   User._id,
          //     //   true,
          //     //   userRoleLevel.level,
          //     //   false,
          //     //   false
          //     // );
          //   } else {
          //     await service.updateStatus(
          //       enrollment.serviceProvider,
          //       enrollment._id,
          //       ACTIVE
          //     );
          //     await service.approval(
          //       enrollmentId,
          //       User._id,
          //       true,
          //       userRoleLevel.level,
          //       true,
          //       true
          //     );
          //   }
          await customerservice.updateStatus(
            enrollment.serviceProvider,
            enrollment._id,
            ACTIVE
          );
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

          return res.status(200).send({
            msg: "Successfully Activated",
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
exports.PortInMdn = expressAsyncHandler(async (req, res, next) => {
  try {
    let { enrollmentId, streetNumber, account, password } = req.body;
    let enrollment = await service.getByUserID(enrollmentId);
    let planDetails = await planModel.findOne({ _id: enrollment.plan });
    const result = await PWGServices.PortInMDN(
      enrollment.esn,
      planDetails.planId,
      enrollment.phoneNumber,
      enrollment.firstName,
      enrollment.lastName,
      streetNumber,
      enrollment.address1,
      enrollment.city,
      enrollment.state,
      enrollment.zip,
      account,
      password
    );

    console.log(result);

    const status = result.$["status"];

    if (status === "success") {
      return res.status(200).send({ msg: "PortIn successfully" });
    } else {
      return res
        .status(400)
        .send({ msg: "Error in PortIn", error: result.errors.error });
    }
  } catch (error) {
    console.error("Error during PortInMdn:", error);
    return res.status(500).send({ msg: "Internal Server Error" });
  }
});
exports.searchPlan = expressAsyncHandler(async (req, res, next) => {
  try {
    const { searchTerm, inventoryType } = req.query;

    if (!searchTerm || !inventoryType) {
      return res.status(400).json({
        success: false,
        error: "Search term and inventory type are required",
      });
    }

    // Case-insensitive and partial matching with a regular expression
    const regex = new RegExp(searchTerm, "i");

    // MongoDB query to search for plans
    const result = await planModel.find({
      name: regex,
      inventoryType,
      active: true,
    });

    if (result.length > 0) {
      return res.status(200).json({ success: true, data: result });
    } else {
      return res.status(404).json({ success: false, error: "No plans found" });
    }
  } catch (error) {
    console.error("Error during searchPlan:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

exports.puchasePlan = expressAsyncHandler(async (req, res, next) => {
  try {
    const { mdn, planId } = req.body;
    const result = await PWGServices.purchasePlan(mdn, planId);
    const status = result.$["status"];
    if (status === "success") {
      // Assuming 'model' and 'disconnectReason' are defined
      // const customer = await model.findOneAndUpdate({
      //   status: "disconnected",
      //   disconnectReason,
      // });
      return res.status(200).send({ msg: "Package Activated successfully" });
    } else {
      return res.status(400).send({ msg: "Error in Package Activation" });
    }
  } catch (error) {
    console.error("Error during Package Activation:", error);
    res.status(500).send({ msg: "Internal Server Error" });
  }
});
exports.servicesInfos = expressAsyncHandler(async (req, res) => {
  let { mdn } = req.body;

  const responseData = await PWGServices.serviceInformations(mdn);

  const status = responseData.$["status"];

  if (status === "success") {
    return res.status(200).send({ msg: "Success", status: responseData });
  } else {
    return res.status(400).send({ msg: "modify PortIN failed" });
  }
});
//hotline pwg
exports.HotlineMdnByPwg = expressAsyncHandler(async (req, res) => {
  let { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  console.log(enrollment);
  //const result = await service.activateByPwg(enrollment)
  const responseData = await PWGServices.hotline(enrollment.phoneNumber);
  const status = responseData.$["status"];
  if (status === "success") {
    await model.findOneAndUpdate(
      { _id: enrollmentId },
      { status: SUSPENDED },
      { new: true }
    );
    return res.status(200).send({ msg: `Hotline successfully` });
  } else {
    return res.status(400).send({ msg: `Error in hotline` });
  }
});
//removeHotlineHandler
exports.removeHotlineHandler = expressAsyncHandler(async (req, res) => {
  try {
    let { enrollmentId } = req.body;
    let enrollment = await service.getByUserID(enrollmentId);
    const responseData = await PWGServices.removeHotline(
      enrollment.phoneNumber
    );
    const status = responseData.$["status"];
    if (status === "success") {
      await model.findOneAndUpdate(
        { _id: enrollmentId },
        { status: ACTIVE },
        { new: true }
      );
      return res.status(200).send({ msg: `Hotline removed successfully` });
    } else {
      return res.status(400).send({ msg: `Error in removing hotline` });
    }
  } catch (error) {
    console.error("Error in removeHotlineHandler:", error);
    return res.status(500).send({ msg: `Internal server error` });
  }
});
// reconnect Esn
exports.reConnectMdnByPwg = expressAsyncHandler(async (req, res) => {
  let { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  console.log(enrollment);

  //const result = await service.activateByPwg(enrollment)
  const responseData = await PWGServices.reconnectESN(
    enrollment.phoneNumber,
    enrollment.esn,
    enrollment.planId,
    enrollment.zip
  );
  const status = responseData.$["status"];
  if (status === "success") {
    let planDetails = await planModel.findOne({ planId });
    console.log("plan details", planDetails);
    const result = await model.findOneAndUpdate(
      { _id: enrollmentId },
      {
        plan: planDetails._id,
      },
      { new: true }
    );
    await model.findOneAndUpdate(
      { _id: enrollmentId },
      { status: RECONNECT },
      { new: true }
    );
    console.log(result.plan);
    return res.status(200).send({ msg: `reconnected successfully` });
  } else {
    return res.status(400).send({ msg: `error in reconnecting` });
  }
});
//queryCheckInPort
exports.queryCheckInPort = expressAsyncHandler(async (req, res) => {
  let { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.queryCheckOnPort(
    enrollment.phoneNumber
  );
  const status = responseData.$["status"];
  if (status === "success") {
    if (responseData.result === "SUCCESS") {
      const phoneNumber = enrollment.phoneNumber;
      const newmdn = enrollment.newmdn;
      await model.findOneAndUpdate(
        { _id: enrollmentId },
        {
          $set: {
            oldMdn: phoneNumber,
            phoneNumber: newmdn,
            newMdnAssignAt: newMdnAssignAt,
          },
        },
        { new: true }
      );
      return res.status(200).send({ msg: "success", status: responseData });
    } else
      return res.status(200).send({ msg: "success", status: responseData });
  } else {
    return res.status(400).send({
      msg: `error in queryCheckInPort`,
      error: responseData.errors.error,
    });
  }
});
//modifyPort
exports.modifyPort = expressAsyncHandler(async (req, res) => {
  let { enrollmentId, account, password, streetNumber } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.modifyPort(
    enrollment.phoneNumber,
    enrollment.esn,
    account,
    password,
    enrollment.firstName,
    enrollment.lastName,
    enrollment.address1,
    streetNumber,
    enrollment.city,
    enrollment.state,
    enrollment.zip
  );
  const status = responseData.$["status"];
  if (status === "success") {
    return res.status(200).send({ msg: "Success", status: responseData });
  } else {
    return res.status(400).send({ msg: "modify PortIN failed" });
  }
});
//cancelPort
exports.cancelPort = expressAsyncHandler(async (req, res) => {
  let { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.cancelPort(
    enrollment.phoneNumber,
    enrollment.esn
  );
  const status = responseData.$["status"];
  if (status === "success") {
    return res
      .status(200)
      .send({ msg: "PORTIN CANCEL Successfully", status: responseData });
  } else {
    return res.status(400).send({
      msg: "PortIN Cancelation failed",
      error: responseData.errors.error,
    });
  }
});
//portInChange
exports.portInChange = expressAsyncHandler(async (req, res) => {
  const { enrollmentId, newmdn, account, password } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  let planDetails = await planModel.findOne({ _id: enrollment.plan });
  const responseData = await PWGServices.portInWithMSISDN(
    enrollment.phoneNumber,
    newmdn,
    enrollment.esn,
    planDetails.planId,
    enrollment.zip,
    enrollment.firstName,
    enrollment.lastName,
    enrollment.city,
    enrollment.state,
    enrollment.address1,
    account,
    password
  );
  const status = responseData.$["status"];
  if (status === "success") {
    let newmdn = await model.findOneAndUpdate(
      {
        _id: enrollmentId,
      },
      { newmdn: newmdn },

      { new: true }
    );
    return res
      .status(200)
      .send({ msg: "PORTIN CHANGE Successfully", status: responseData });
  } else {
    return res.status(400).send({
      msg: "PortIN CHANGING failed",
      error: responseData.errors.error,
    });
  }
});
exports.queryusage = expressAsyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.queryUsage(enrollment.phoneNumber);
  const status = responseData.$["status"];
  if (status === "success") {
    return res
      .status(200)
      .send({ msg: "Remaning allowance", status: responseData });
  } else {
    return res.status(400).send({ msg: " failed" });
  }
});
exports.getBalanceInfo = expressAsyncHandler(async (req, res) => {
  const { enrollmentId, pendingBalance } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.balanceInformation(
    enrollment.phoneNumber,
    pendingBalance
  );
  const status = responseData.$["status"];
  if (status === "success") {
    return res
      .status(200)
      .send({ msg: "Remaning Balance", status: responseData });
  } else {
    return res.status(400).send({ msg: " failed" });
  }
});
exports.swapMDN = expressAsyncHandler(async (req, res) => {
  const { enrollmentId, newzip } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.requestNewSwapMDN(
    enrollment.phoneNumber,
    enrollment.imei,
    enrollment.esn,
    newzip
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "Success", status: responseData });
  } else {
    return res
      .status(400)
      .send({ msg: "failed", error: responseData.errors.error });
  }
});
exports.SwapESN = expressAsyncHandler(async (req, res) => {
  let { enrollmentId, newesn, reuse } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.swapESNSIM(
    enrollment.phoneNumber,
    newesn,
    enrollment.esn,
    reuse
  );

  const status = responseData.$["status"];
  if (status == "success") {
    if (reuse === "TRUE") {
      const result = await sim.findOneAndUpdate(
        { SimNumber: enrollment.esn },
        { status: "available" },
        { new: true }
      );
      const newEsn = await sim.findOneAndUpdate(
        { SimNumber: newesn },
        { status: "inUse" }
      );
      const assignNewEsn = await model.findOneAndUpdate(
        { _id: enrollment._id },
        {
          esn: newesn,
          esnId: newEsn._id,
          phoneNumber: newEsn,
          phoneNumber: responseData.mdn,
        }
      );
    }
    return res.status(200).send({ msg: "Success", status: responseData });
  } else {
    return res
      .status(400)
      .send({ msg: "failed", error: responseData.errors.error });
  }
});
exports.getCoverageInformation = expressAsyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  let carrier = enrollment.carrier.name;
  const responseData = await PWGServices.coverageInformation(
    carrier,
    enrollment.zip
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: responseData });
  } else {
    return res.status(400).send({ msg: "failed", status: status });
  }
});
exports.disconnectMDN = expressAsyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.disconnectMDN(
    enrollment.phoneNumber,
    enrollment.esn
  );
  const status = responseData.$["status"];
  if (status == "success") {
    await model.findOneAndUpdate(
      { _id: enrollment._id },
      { status: "disconnected" },
      { new: true }
    );
    return res.status(200).send({ msg: "Success", status: responseData });
  } else {
    return res.status(400).send({ msg: "Failed", status: status });
  }
});
exports.changePlan = expressAsyncHandler(async (req, res) => {
  const { enrollmentId, newPlanId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.changePlan(
    enrollment.phoneNumber,
    enrollment.esn,
    newPlanId
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: responseData });
  } else {
    return res.status(400).send({ msg: "failed", status: status });
  }
});
exports.cancelPurchase = expressAsyncHandler(async (req, res) => {
  const { enrollmentId, purchaseId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.cancelPurchase(
    enrollment.phoneNumber,
    purchaseId
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: responseData });
  } else {
    return res.status(400).send({ msg: "failed", status: status });
  }
});
exports.QueryNetwork = expressAsyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.QueryNetwork(
    enrollment.phoneNumber,
    enrollment.esn
  );
  const status = responseData.$["status"];
  if (status == "success") {
    let data = responseData.description;
    return res.status(200).send({ msg: "success", status: data });
  } else {
    return res.status(400).send({ msg: "failed", status: status });
  }
});
exports.voicePasswordReset = expressAsyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.voicePasswordReset(
    enrollment.phoneNumber,
    enrollment.esn
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: responseData });
  } else {
    return res.status(400).send({ msg: "failed", status: status });
  }
});
exports.ValidatePort = expressAsyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.validatePort(
    enrollment.phoneNumber,
    enrollment.esn
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: responseData });
  } else {
    return res
      .status(400)
      .send({ msg: "failed", status: responseData.errors.error });
  }
});
exports.adjustBalanceRequest = expressAsyncHandler(async (req, res) => {
  const { enrollmentId, amount } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.adjustBalanceRequest(
    enrollment.phoneNumber,
    enrollment.subscriberId,
    amount
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: responseData });
  } else {
    return res.status(400).send({ msg: "failed", status: status });
  }
});
exports.cancelDeviceLocation = expressAsyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.cancelDeviceLocation(
    enrollment.phoneNumber,
    enrollment.esn
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: responseData });
  } else {
    return res.status(400).send({ msg: "failed", status: status });
  }
});
exports.ValidatePortOutEligibility = expressAsyncHandler(async (req, res) => {
  const { enrollmentId, ospAccountNumber, ospAccountPassword } = req.body;

  let enrollment = await service.getByUserID(enrollmentId);
  let name = `${enrollment.firstName} ${enrollment.lastName}`;

  const responseData = await PWGServices.validationPortOutEligibility(
    enrollment.phoneNumber,
    enrollment.esn,
    name,
    ospAccountNumber,
    ospAccountPassword,
    enrollment.address1,
    enrollment.city,
    enrollment.state,
    enrollment.zip
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: responseData });
  } else {
    return res.status(400).send({ msg: "failed", status: status });
  }
});
exports.partnerPortOutValidation = expressAsyncHandler(async (req, res) => {
  const { enrollmentId, MessageCode, Description } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.partnerPortOutValidation(
    enrollment.phoneNumber,
    enrollment.esn,
    MessageCode,
    Description
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: responseData });
  } else {
    return res
      .status(400)
      .send({ msg: "failed", error: responseData.errors.error });
  }
});
exports.addWFC = expressAsyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.addWFC(
    enrollment.phoneNumber,
    enrollment.esn,
    enrollment.address1,
    enrollment.address2,
    enrollment.city,
    enrollment.state,
    enrollment.zip
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: responseData });
  } else {
    return res.status(400).send({ msg: "failed", status: status });
  }
});
exports.updateE119Address = expressAsyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.updateE119Address(
    enrollment.phoneNumber,
    enrollment.esn,
    enrollment.address1,
    enrollment.address2,
    enrollment.city,
    enrollment.state,
    enrollment.zip
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return resender.status(200).send({ msg: "success", status: responseData });
  } else {
    return resender.status(400).send({ msg: "failed", status: status });
  }
});
exports.getCoverage2 = expressAsyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  let carrier = enrollment.carrier.name;
  const responseData = await PWGServices.getCoverage2(carrier, enrollment.zip);
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: status });
  } else {
    return res.status(400).send({ msg: "failed", status: status });
  }
});
exports.querySim = expressAsyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.querySim(enrollment.esn);
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: status });
  } else {
    return res.status(400).send({ msg: "failed", status: status });
  }
});
exports.changeVoiceMailLanguage = expressAsyncHandler(async (req, res) => {
  const { enrollmentId, language } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  const responseData = await PWGServices.changeVoiceMailLanguage(
    enrollment.phoneNumber,
    enrollment.esn,
    language
  );
  const status = responseData.$["status"];
  if (status == "success") {
    return res.status(200).send({ msg: "success", status: status });
  } else {
    return res.status(400).send({ msg: "failed", status: status });
  }
});
exports.getTransactionHistory = expressAsyncHandler(async (req, res, next) => {
  try {
    const { mdn, fromDate, toDate } = req.query;

    // Parse the fromDate and toDate strings into Date objects
    const startDate = fromDate
      ? moment(fromDate).startOf("day").toDate()
      : null;
    const endDate = toDate ? moment(toDate).endOf("day").toDate() : null;

    // Build query to filter transactions by MDN and date range
    const query = { mdn };
    if (startDate && endDate) {
      query.purchaseDate = { $gte: startDate, $lte: endDate };
    }

    // Assuming you have a 'Transaction' model defined
    const transactions = await Transaction.find(query)
      .sort({ purchaseDate: -1 })
      .select(
        "-_id mdn itemId transactionType status price purchaseDate fullName"
      )
      .populate({
        path: "itemId",
        select: "name",
      }); // Select fields to return

    // Group transactions by date
    const groupedTransactions = {};
    transactions.forEach((transaction) => {
      const dateKey = moment(transaction.purchaseDate).format("YYYY-MM-DD");
      if (!groupedTransactions[dateKey]) {
        groupedTransactions[dateKey] = [];
      }
      groupedTransactions[dateKey].push(transaction);
    });

    res.status(200).json({ success: true, data: groupedTransactions });
  } catch (error) {
    console.error("Error retrieving transaction history:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
exports.reConnectByPwg = expressAsyncHandler(async (req, res) => {
  let { enrollmentId } = req.body;
  let enrollment = await service.getByUserID(enrollmentId);
  console.log(enrollment);
  let planDetails = await planModel.findOne({ _id: enrollment.plan });
  //const result = await service.activateByPwg(enrollment)
  const responseData = await PWGServices.reconnectESN(
    enrollment.phoneNumber,
    enrollment.esn,
    planDetails.planId,
    enrollment.zip
  );
  console.log(responseData);
  const status = responseData.$["status"];
  if (status === "success") {
    await model.findOneAndUpdate(
      { _id: enrollmentId },
      { status: "active" },
      { new: true }
    );

    return res.status(200).send({ msg: `Reconnected successfully` });
  } else {
    return res
      .status(400)
      .send({ msg: `Error in reconnecting`, error: responseData.errors.error });
  }
});
exports.getMdnHistory = expressAsyncHandler(async (req, res) => {
  try {
    const { customerId } = req.query;
    const result = await model
      .find({ _id: customerId })
      .select("newmdn oldMdn newMdnAssignAt -_id");
    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving MDN history", error: error.message });
  }
});

exports.getPwgInfo = expressAsyncHandler(async (req, res) => {
  try {
    const { customerId } = req.query;
    const enrollment = await service.getByUserID(customerId);
    const serviceInfo = await PWGServices.serviceInformation(
      enrollment.phoneNumber
    );
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const queryHLR = await PWGServices.queryLHR(
      enrollment.phoneNumber,
      enrollment.esn
    );
    console.log("queryHlR is here", queryHLR);
    console.log(
      "queryHlR simstatus is here",
      queryHLR.simStatus,
      queryHLR.simStatus
    );
    console.log("queryHlR simstatus is here", queryHLR);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const querySim = await PWGServices.querySim(enrollment.ESN);

    const result = await model.findOneAndUpdate(
      { _id: enrollment._id },
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
      },
      { new: true }
    );
    if (result) {
      res
        .status(200)
        .send({ msg: "Information Fetched Successfully", data: result });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving MDN history", error: error.message });
  }
});
