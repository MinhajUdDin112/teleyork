const express = require("express");
const router = express.Router();
const controller = require("./controller");
const nlad = require("../pwg/nladService");
const fs = require("fs");
const multer = require("multer");
const service = require("./service");
const pwgcontroller = require("../pwg/pwgcontroller");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Generate a unique filename or use the original filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Create Multer upload middleware
const upload = multer({ storage: storage });
router.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const uploadedFileName = req.file.originalname;
  console.log(filePath, uploadedFileName);
  const result = await service.batchUpload(filePath, uploadedFileName);
  console.log("result in router", result.data);
  if (result) {
    return res.status(result.status).send({ msg: "user", data: result.data });
  } else {
    return res.status(400).send({ msg: "something went wrong" });
  }
});

router.post(
  "/batchNvEligibiltyCheck",
  upload.single("file"),
  async (req, res) => {
    const filePath = req.file.path;
    const uploadedFileName = req.file.originalname;
    console.log(filePath, uploadedFileName);
    const fileData = await service.fileData(filePath, uploadedFileName);
    if (fileData) {
      const resultsArray = [];

      // Iterate through each entry in fileData and call batchEnrollUser()
      for (const entry of fileData) {
        try {
          const result = await nlad.batchEnrollUser(entry);
          const data = result.data;
          resultsArray.push({ entry, data });
        } catch (error) {
          console.error("Error enrolling user:", error);
          // Handle the error if needed, e.g., push an error message to resultsArray
          resultsArray.push({ entry, error: "Enrollment error" });
        }
      }
      console.log("resultsArray", resultsArray);
      return res
        .status(200)
        .send({ msg: "Batch enrollment completed", results: resultsArray });
    } else {
      return res.status(400).send({ msg: "something went wrong" });
    }
  }
);

router.post("/bulkActivatedUpload", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const uploadedFileName = req.file.originalname;
  const { uploadedBy, serviceProvider } = req.body;
  console.log(filePath, uploadedFileName);
  const fileData = await service.ExcelfileData(filePath, uploadedFileName);
  console.log(fileData);
  const { msg, skippedRows } = await nlad.savedata(
    fileData,
    uploadedBy,
    serviceProvider,
    uploadedFileName,
    filePath
  );
  console.log(skippedRows);
  if (skippedRows.length > 0) {
    // If there are skipped rows, send them in the response
    return res
      .status(400)
      .send({ error: "Some rows were skipped", skippedRows });
  } else {
    // If no rows were skipped, send a success message
    return res.status(200).send({ msg: "Success" });
  }
});
router.post(
  "/bulkPostpaidActivatedUpload",
  upload.single("file"),
  async (req, res) => {
    const filePath = req.file.path;
    const uploadedFileName = req.file.originalname;
    const { uploadedBy, serviceProvider } = req.body;
    console.log(filePath, uploadedFileName);
    const fileData = await service.postpaidExcelfileData(
      filePath,
      uploadedFileName
    );
    console.log(fileData);
    const { msg, skippedRows } = await nlad.postpaidSaveData(
      fileData,
      uploadedBy,
      serviceProvider
    );

    if (skippedRows.length > 0) {
      // If there are skipped rows, send them in the response
      return res
        .status(400)
        .send({ error: "Some rows were skipped", skippedRows });
    } else {
      // If no rows were skipped, send a success message
      return res.status(200).send({ msg: "Success" });
    }
  }
);

router.get("/all", controller.getAll);
router.get("/userDetails", controller.getOne);
router.post("/verifyZip", controller.verifyZip);
router.post("/PWGverifyZip", controller.PWGverifyZip);
router.post("/DBverifyzip", controller.DBverifyzip);
router.post("/withoutzip", controller.withoutzip);
router.post("/initialInformation", controller.initialInformation);
router.post("/homeAddress", controller.homeAddress);
router.post("/selectProgram", controller.acpProgram);
router.post("/question", controller.question);
router.post("/termsAndConditions", controller.termsAndConditions);
router.post("/plan", controller.selectPlan);
router.post("/checkCustomerDuplication", controller.checkCustomerDuplication);
router.post("/postpaidpaymentDetails", controller.postpaidpaymentDetails);
router.post("/handOverEnrollment", controller.handOver);
router.post("/prepaidHandOver", controller.prepaidhandOver);
router.get("/completeEnrollmentUser", controller.completeEnrollmentUserList);
router.get(
  "/prePostCompletedEnrollmentsList",
  controller.prePostCompletedEnrollmentsList
);
router.get(
  "/prePostEvaluatedEnrollmentsList",
  controller.prePostEvaluatedEnrollmentsList
);
router.post("/statusnonelectronically", controller.statusnonelectronically);
router.get(
  "/provisionedEnrollmentUserList",
  controller.provisionedEnrollmentUserList
);
router.get("/approvedEnrollmentList", controller.approvedEnrollmentList);
router.get("/dispatchInsight", controller.dispatchInsight);
router.get("/rejectedEnrollmentUser", controller.rejectedEnrollmentUserList);
router.get("/getpostpaidpayment", controller.getpostpaidpayment);
router.get(
  "/inCompleteEnrollmentUser",
  controller.inCompleteEnrollmentUserList
);
router.get("/proofedEnrollmentUser", controller.proofedEnrollmentUserList);
router.get(
  "/withoutProofedEnrollmentUser",
  controller.withoutProofedEnrollmentUserList
);
// router.post("/q2", controller.q2);
// router.post("/q3", controller.q3);
router.post("/login", controller.login);
router.post("/verifyOtp", controller.verifyOtp);
//router.post("/resetPassword", controller.resetPassword);
router.post("/updateStatus", controller.updateStatus);
router.patch("/", controller.updateCustomer);
router.delete("/", controller.delete);
router.patch("/approval", controller.approval);
router.patch("/prePostapproval", controller.prePostapproval);
router.patch("/batchApproval", controller.batchApproval);
router.patch("/rejected", controller.rejected);
router.patch("/remarks", controller.remarks);
router.patch("/qualityRemarks", controller.qualityRemarks);
router.patch("/changeAccountStatus", controller.changeAccountStatus);
router.get("/EnrollmentApprovedByUser", controller.EnrollmentApprovedByUser);
router.post("/verifyEligibility", controller.verifyEligibility);
router.post("/verifyEnroll", controller.verifyUserNlad);
router.post("/enrollVerifiedUser", controller.enrollVerifiedUser);
router.put("/updateVerifiedUser", controller.updateVerifiedUser);
router.delete("/deEnrollUser", controller.deEnrollUser);
router.post("/transferUserNlad", controller.transferUserNlad);
router.post("/activateByPwg", controller.activateByPwg);
router.get("/getBatchStatus", controller.getBatchStatus);
router.post("/getErroredData", controller.getErroredData);
router.post("/deviceEligibilty", controller.deviceEligibilty);
router.post("/disconnectMdnByPwg", controller.disconnectMdnByPwg);
router.post("/changePlan", controller.changePlan);
router.post("/serviceInfo", controller.serviceInfo);
router.post("/NLADTransactionReport", controller.NLADTransactionReport);
router.post(
  "/NLADTransactionReportStatus",
  controller.NLADTransactionReportStatus
);

router.post("/createpassword", controller.updatePassword);
router.post("/emailotp", controller.emailotpverification);
router.post("/customerHistory", controller.customerHistory);
router.get("/verifyAddress", controller.verifyAddress);
router.post("/signup", upload.single("file"), controller.signup);
router.post("/contactotp", controller.verifyContactOtp);
router.post("/resend-email-otp", controller.resendEmailOtp);
router.post("/resend-contact-otp", controller.resendContactOtp);
router.post("/forget-password", controller.mobileforgetPassword);
router.post("/verifytoken", controller.verifyToken);
router.post("/resetPassword", controller.resetPassword);
router.get("/usage", controller.usage);
router.post("/mobilelogin", controller.mobilelogin);
router.post("/disconnectionList", controller.disconnectionList);
router.post("/userprofile", upload.single("imageUrl"), controller.userprofile);
router.get("/getuserbyid", controller.getuserprofilebyid);
// router.put("/markNotificationAsRead", controller.markNotificationAsRead);
router.get("/MobileNotificationCount", controller.MobileNotificationCount);
router.get("/getInvoiceforMobile", controller.getInvoiceforMobile);
// router.put(
//   "/markAllNotificationsAsRead",
//   controller.markAllNotificationsAsRead
// );
router.get("/getNotificationsforMobile", controller.getNotificationsforMobile);
// router.put(
//   "/updateuserprofile",
//   upload.single("image"),
//   controller.updateuserprofile
// );
router.put(
  "/updateuserprofile",
  upload.single("file"),
  controller.updateuserprofile
);
router.get("/getByUnitType", controller.getByUnitType);
router.post("/esnAssingment", controller.esnAssingment);
router.post("/activateESNByPwg", pwgcontroller.activateESNByPwg);
router.post("/getBalanceInfo", pwgcontroller.getBalanceInfo);
router.get("/getMdnHistory", pwgcontroller.getMdnHistory);
router.post("/swapMDN", pwgcontroller.swapMDN);
router.post("/SwapESN", pwgcontroller.SwapESN);
router.post("/PortInMdn", pwgcontroller.PortInMdn);
router.post("/getCoverageInformation", pwgcontroller.getCoverageInformation);
router.post("/searchPlan", pwgcontroller.searchPlan);
router.post("/puchasePlan", pwgcontroller.puchasePlan);
router.get("/getTransactionHistory", pwgcontroller.getTransactionHistory);
router.post("/servicesInfos", pwgcontroller.servicesInfos);
router.post("/queryusage", pwgcontroller.queryusage);
router.post("/HotlineMdnByPwg", pwgcontroller.HotlineMdnByPwg);
router.post("/reConnectMdnByPwg", pwgcontroller.reConnectMdnByPwg);
router.post("/reConnectMdn", pwgcontroller.reConnectByPwg);
router.post("/removeHotline", pwgcontroller.removeHotlineHandler);
router.post("/queryCheckInPort", pwgcontroller.queryCheckInPort);
router.post("/modifyPort", pwgcontroller.modifyPort);
router.post("/cancelPort", pwgcontroller.cancelPort);
router.post("/portInChange", pwgcontroller.portInChange);
router.post("/getPwgInfo", pwgcontroller.getPwgInfo);
router.post("/add-balance", controller.addBalanceforAuthorize);
router.post("/purchasePackage", controller.purchasePackage);
router.get("/showBalance", controller.showBalance);
router.get("/showCount", controller.showCount);
router.post("/resetCounter", controller.resetCounter);
router.get("/getServiceProvider", controller.getServiceProvider);
router.post(
  "/uploadConsentformPrepaid",
  upload.single("file"),
  controller.uploadConsentformPrepaid
);
module.exports = router;
