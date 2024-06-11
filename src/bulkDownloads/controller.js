const express = require("express");
const role = require("../rolePermission/roleModel");
const fs = require("fs");
const user = require("../adminUser/adminUserModel");
const customer = require("../user/model");
const { DateTime } = require("luxon");
const UserService = require("../adminUser/adminUserServices");
const archiver = require("archiver");

exports.getLabelData = async (req, res) => {
  let { startDate, endDate, billingModel, role } = req.body;
  // checking endDate is greater than current date then show error
  let endDateTime, startDateTime;
  if (endDate) {
    endDateTime = DateTime.fromISO(endDate).setZone("America/New_York");
    if (endDateTime > DateTime.now().setZone("America/New_York")) {
      return res
        .status(400)
        .json({ error: "endDate cannot be greater than current date" });
    }
  }

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
  }
  const users = await user.find({ role: { $in: role } });
  console.log("user", users);
  const usersData = await Promise.all(
    users.map(async (user) => {
      const customersCount = await customer.find({
        createdBy: user,
        accountType: billingModel,
        isEnrollmentComplete: true,
        serviceProvider: user.company,
        labelCreatedAt: {
          $gte: startISOWithoutTZ,
          $lte: endISOWithoutTZ,
        },
      });
      return {
        user,
        customer: customersCount,
        customersCountLength: customersCount.length,
        labels: customersCount.map((customer) => customer.label),
      };
    })
  );

  console.log(usersData);
  res.json(usersData); // Sending the data as JSON response
};

exports.downloadLabelsAsZip = async (req, res) => {
  const labels = req.body.labels;

  if (!labels || labels.length === 0) {
    return res.status(400).json({ error: "No labels provided" });
  }

  const zipFileName = `labels.zip`;
  const output = fs.createWriteStream(zipFileName);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    res.download(zipFileName, zipFileName, (err) => {
      if (err) {
        console.error("Error occurred while downloading ZIP file:", err);
        res
          .status(500)
          .json({ error: "Error occurred while downloading ZIP file" });
      }
      fs.unlinkSync(zipFileName); // Cleanup: Delete the temporary ZIP file after download
    });
  });

  archive.pipe(output);

  labels.forEach((labelPath, index) => {
    archive.file(labelPath, { name: `label_${index + 1}.pdf` });
  });

  archive.finalize();
};
