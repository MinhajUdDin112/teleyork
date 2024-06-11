// Required dependencies
const express = require("express");
const fs = require("fs");
const multer = require("multer");
const XLSX = require("xlsx");
const SMSService = require("../utils/SMSService");
const mailService = require("../utils/mailService");
const serviceSMS = require("../utils/serviceSMS");
const expressAsyncHandler = require("express-async-handler");
const SMSModel = require("./SMSModel");
const { default: mongoose } = require("mongoose");
const service = require("./service");
const templateModel = require("./templateModel");
const userService = require("../adminUser/adminUserServices");
//const fileQueue = require('../utils/fileQueue');
const Queue = require("bull");
const SMSRouter = express.Router();
// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

const fileQueue = new Queue("file-processing", {
  redis: "localhost:6379",
});

// Process uploaded files using the fileQueue
fileQueue.process(async (job) => {
  job.progress(0);
  const { filePath, userId } = job.data;

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const totalTasks = data.length;

    // Initialize a variable to keep track of completed tasks
    let completedTasks = 0;

    // Process each task in the data
    for (let i = 0; i < data.length; i++) {
      // Process the task...

      // Update the progress based on completed tasks
      completedTasks++;
      const progress = (completedTasks / totalTasks) * 100; // Convert to percentage
      job.progress(progress);
    }
    // Process the data as needed (you can call a separate function here)
    const processedData = await processDataTest(userId, data);
    // Delete the uploaded file
    fs.unlinkSync(filePath);

    return processedData;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

// Route for file upload
SMSRouter.post("/upload/:id", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  if (!filePath) {
    return res.status(200).send({ msg: "file not found" });
  }
  const uploadedFileName = req.file.originalname;
  const userId = req.params.id;
  console.log(filePath, userId);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  // Process the data as needed (you can call a separate function here)
  const processedData = await processDataTest(userId, data);
  // Delete the uploaded file
  fs.unlinkSync(filePath);
  if (processedData) {
    return res
      .status(200)
      .send({ msg: "file uploaded successfully", data: processedData });
  } else {
    return res.status(400).send({ msg: "something went wrong" });
  }
});

SMSRouter.get("/upload-progress", async (req, res) => {
  try {
    let allJobsCompleted = false;

    while (!allJobsCompleted) {
      const jobs = await fileQueue.getJobs([
        "active",
        "waiting",
        "delayed",
        "completed",
        "failed",
      ]);

      // An array to store progress information for each job.
      const progressInfo = [];

      for (const job of jobs) {
        const progress = await job.progress();
        progressInfo.push({
          id: job.id,
          progress: progress,
        });
      }

      allJobsCompleted = progressInfo.every((job) => job.progress === 100);

      if (!allJobsCompleted) {
        // If not all jobs are completed, send progress information and wait before polling again.
        res.status(200).json({ progress: progressInfo });
        await delay(2000); // Adjust the delay time (in milliseconds) as needed.
      } else {
        // All jobs are completed, send the final progress.
        res.status(200).json({ progress: progressInfo, message: "Uploaded!" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route for sending messages
SMSRouter.post(
  "/send",
  expressAsyncHandler(async (req, res) => {
    try {
      const { sentBy, templateId } = req.query;
      const data = await service.getDraftAll(templateId);
      //let subject = data.push(notification_subject)
      console.log("data here", data);
      let emailResult, smsResult;
      const type = data[0].type;
      if (type === 1) {
        emailResult = await mailService(data, sentBy, data.length);
        console.log("Email result: ", emailResult);
      }

      // Conditionally call the serviceSMS if sendSMS is true
      if (type === 0) {
        smsResult = await serviceSMS(data, sentBy, data.length);
        console.log("SMS result: ", smsResult);
      }

      if (type === 2) {
        smsResult = await serviceSMS(data, sentBy, data.length);
        emailResult = await mailService(data, sentBy, data.length);
        console.log("Email result: ", emailResult);
        console.log("SMS result: ", smsResult);
      }

      // const result = await mailService(data, sentBy, data.length);
      // const result = await serviceSMS(data, sentBy, data.length);
      if (emailResult || smsResult) {
        res.status(200).send({ msg: "Messages queued and sent", data: data });
      } else {
        res.status(400).send({ msg: "Not Sent" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Failed!" });
    }
  })
);
SMSRouter.post(
  "/addTemplate",
  expressAsyncHandler(async (req, res) => {
    const {
      company,
      name,
      template,
      keySequence,
      type,
      notification_subject,
      createdBy,
    } = req.body;
    if (
      !company ||
      !name ||
      !template ||
      keySequence.length === 0 ||
      !createdBy
    ) {
      return res.status(400).send({ msg: "Fields Missing!" });
    }

    const existingTemplate = await templateModel.findOne({ name });

    if (existingTemplate) {
      return res
        .status(400)
        .send({ msg: "Template with the same name already exists!" });
    }
    const timestamp = new Date().getTime(); // Get the current timestamp
    const randomPart = Math.floor(1000 + Math.random() * 9000); // Generate a random number between 1000 and 9999

    // Combine the timestamp and random number to create a unique ID
    const templateId = `${timestamp}${randomPart}`;
    const result = await service.addTemplate(
      company,
      createdBy,
      name,
      templateId,
      template,
      keySequence,
      type,
      notification_subject
    );
    if (result) {
      return res.status(200).send({ msg: "added", data: result });
    } else {
      return res.status(400).json({ msg: "Failed!" });
    }
  })
);
SMSRouter.patch(
  "/updateTemplate",
  expressAsyncHandler(async (req, res) => {
    const { templateId, notification_subject, template, type, keySequence } =
      req.body;
    const result = await service.updateTemplate(
      templateId,
      notification_subject,
      template,
      type,
      keySequence
    );
    if (result) {
      return res.status(200).send({ msg: "Updated", data: result });
    } else {
      return res.status(400).json({ msg: "Failed!" });
    }
  })
);
SMSRouter.get(
  "/template/all",
  expressAsyncHandler(async (req, res) => {
    try {
      const { userId } = req.query;
      const User = await userService.getByUserID(userId);
      const campony = User.company;
      const result = await service.getTemplateAll(campony);
      res.status(200).send({ msg: "Template List", data: result });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Failed!" });
    }
  })
);
SMSRouter.get(
  "/template/draft-rendared",
  expressAsyncHandler(async (req, res) => {
    try {
      const { userId } = req.query;
      const User = await userService.getByUserID(userId);
      const campony = User.company;
      const result = await service.getDraftAllTemplate(campony);

      const draftTemplates = result.map((result) => result.template);

      res.render("template", { draftTemplates });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Failed!" });
    }
  })
);
SMSRouter.get(
  "/template/draft",
  expressAsyncHandler(async (req, res) => {
    try {
      const { userId } = req.query;
      const User = await userService.getByUserID(userId);
      console.log(User);
      const campony = User.company;

      const result = await service.getDraftAllTemplate(campony);
      res.status(200).json({ data: result });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Failed!" });
    }
  })
);
SMSRouter.get(
  "/template/sent",
  expressAsyncHandler(async (req, res) => {
    try {
      const { companyId } = req.query;
      const result = await service.getSentAllTemplate(companyId);
      res.status(200).send({ msg: "Template List", data: result });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Failed!" });
    }
  })
);
SMSRouter.get(
  "/template/:id",
  expressAsyncHandler(async (req, res) => {
    try {
      const result = await service.getOne(req.params.id);
      if (result) {
        return res.status(200).send({ msg: "Template", data: result });
      } else {
        return res.status(404).send({ msg: "Not Found" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Failed!" });
    }
  })
);
SMSRouter.get(
  "/draft",
  expressAsyncHandler(async (req, res) => {
    try {
      const data = await service.getDraftAll(req.query.templateId);
      res.status(200).send({ msg: "List", data: data });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Failed to process the file" });
    }
  })
);
SMSRouter.get(
  "/sent",
  expressAsyncHandler(async (req, res) => {
    try {
      const data = await service.getSentAll(
        req.query.templateId,
        req.query.company
      );
      console.log("s");
      res.status(200).send({ msg: "List", data: data });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Failed to process the file" });
    }
  })
);
async function processDataTest(uploadedBy, data) {
  const template = await templateModel.findOne({ templateId: data[1][0] });
  console.log("template: ", template);
  if (!template) {
    throw new Error("Please add template first");
  }
  const processedData = await data.slice(1).map((row) => {
    console.log(template.keySequence);
    const rowData = {}; // Object to hold the mapped data for each row
    // Map the values from the 'row' array to their corresponding fields
    for (let i = 0; i < template.keySequence.length; i++) {
      rowData[template.keySequence[i]] = row[i];
    }
    // Find keys in the message template (e.g., $name, $trackingId)
    const dynamicKeys = template.template.match(/\$\$\w+/g);
    const dynamicKeysNotificationSubject =
      template.notification_subject.match(/\$\$\w+/g);

    // Replace keys in the message with their corresponding values from the rowData
    let messageWithValues = template.template;
    let notificationSubjectWithValues = template.notification_subject;
    if (dynamicKeys) {
      dynamicKeys.forEach((key) => {
        const dataKey = key.slice(2); // Remove the $ sign from the key
        const value = rowData[dataKey];
        messageWithValues = messageWithValues.replace(key, value);
      });
    }
    if (dynamicKeysNotificationSubject) {
      dynamicKeysNotificationSubject.forEach((key) => {
        const dataKey = key.slice(2); // Remove the $ sign from the key
        const value = rowData[dataKey];
        notificationSubjectWithValues = notificationSubjectWithValues.replace(
          key,
          value
        );
      });
    }
    rowData.message = messageWithValues;
    rowData.uploadedBy = uploadedBy;
    rowData.company = template.company;
    rowData.type = template.type;
    rowData.notification_subject = notificationSubjectWithValues;
    console.log("rowDate", rowData);
    return rowData;
  });

  const session = await mongoose.startSession();
  let savedData;
  try {
    session.startTransaction();
    savedData = await SMSModel.insertMany(processedData);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted. Error: ", error);
    throw error;
  } finally {
    session.endSession();
  }

  return savedData;
}
// Example function to process the data
const processData = async (uploadedBy, data) => {
  console.log(data[1][0]);
  const template = await templateModel.findOne({ templateId: data[1][0] });
  if (!template) {
    throw new Error("Please add template first");
  }
  console.log(template);

  const processedData = await data.slice(1).map((row) => ({
    uploadedBy,
    mobileNo: row[0],
    trackingId: row[1],
    name: row[2],
    email: row[3],
    templateId: row[4],
    message: template.template
      .replace("${row[2]}", row[2])
      .replace("${row[1]}", row[1]),
  }));
  const session = await mongoose.startSession();
  let savedData;
  try {
    session.startTransaction();
    savedData = await SMSModel.insertMany(processedData);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted. Error: ", error);
    throw error;
  } finally {
    session.endSession();
  }

  return savedData;
};

const saveData = async (processedData) => {
  let data = [];
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    for (var i = 0; i < processedData; i++) {
      user = new SMSModel({
        uploadedBy: processedData[i].uploadedBy,
        mobileNo: processedData[i].mobileNo,
        name: processedData[i].name,
        trackingId: processedData[i].trackingId,
        email: processedData[i].email,
        templateId: processedData[i].templateId,
        message: processedData[i].message,
      });
      const result = await user.save();
      data.push(result);
    }
    await session.commitTransaction();
    return data;
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted. Error: ", error);
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
};

SMSRouter.delete(
  "/delete",
  expressAsyncHandler(async (req, res) => {
    const { templateId } = req.query;
    if (!templateId) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await service.delete(templateId);
    if (result.deletedCount == 0) {
      return res.status(400).send({ msg: "ID Not found" });
    }
    if (result) {
      return res.status(200).send({ msg: "template deleted.", data: result });
    } else {
      return res.status(400).send({ msg: "template not deleted" });
    }
  })
);

SMSRouter.get(
  "/getAllTemplate/:id",
  expressAsyncHandler(async (req, res) => {
    try {
      //const result = await templateModel.find({deleted: {$ne: true}})
      const result = await service.getAllTemplate(req.params.id);
      res.status(200).send({ msg: "Templatess List", data: result });
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Failed!" });
    }
  })
);

module.exports = SMSRouter;
