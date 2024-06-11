const express = require("express");
const router = express.Router();
const controller = require("./controller");
router.get("/", controller.states);

router.get(
  "/EnrollmentApprovedBySingleUser",
  controller.EnrollmentApprovedBySingleUser
);
router.get(
  "/provisionedSingleEnrollmentUserList",
  controller.provisionedSingleEnrollmentUserList
);
router.get(
  "/completeSingleEnrollmentUserList",
  controller.completeSingleEnrollmentUserList
);
router.get(
  "/approvedSingleEnrollmentList",
  controller.approvedSingleEnrollmentList
);
router.get(
  "/rejectedSingleEnrollmentUserList",
  controller.rejectedSingleEnrollmentUserList
);
router.get(
  "/inCompleteSingleEnrollmentUserList",
  controller.inCompleteSingleEnrollmentUserList
);
router.get(
  "/showTransferOutEnrollments",
  controller.showTransferOutEnrollments
);
router.get("/getEnrollmentsForUser", controller.getEnrollmentsForUser);
router.get(
  "/getEnrollmentsForProvision",
  controller.getEnrollmentsForProvision
);
router.get("/getEnrollmentsForTeamlead", controller.getEnrollmentsForTeamlead);
router.get("/getNVSuccessLength", controller.getNVSuccessLength);
router.get("/getactivesalescsr", controller.getactivesalescsr);
router.get("/inactiveenrollments", controller.inactiveenrollments);
router.get("/salesStatsByChannel", controller.salesStatsByChannel);
router.get("/showsalestoteamlead", controller.showsalestoteamlead);
router.get("/totalEnrollments", controller.totalEnrollments);
router.get("/enrollmentsByRoles", controller.enrollmentsByRoles);

module.exports = router;
