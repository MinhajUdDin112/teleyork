const controller = require("./controller");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const multer = require("multer");
const XLSX = require("xlsx");
const Queue = require("bull");
const simModel = require("./model");
const { default: mongoose } = require("mongoose");

//upload a file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
    console.log("destination");
  },
  filename: function (req, file, cb) {
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, Date.now() + "-" + sanitizedFilename);
    console.log("filename");
  },
});
const upload = multer({ storage });

const fileQueue = new Queue("bulkSimFile", {
  redis: "localhost:6379",
});

// Process uploaded files using the fileQueue
fileQueue.process(async (job) => {
  job.progress(0);
  const {
    filePath,
    uploadedFileName,
    Uploaded_by,
    serviceProvider,
    carrier,
    AgentType,
    AgentName,
    /* team, */ planId,
    trackingNumber,
    tinNumber,
    unitType,
    provisionType,
    billingModel,
  } = job.data;

  try {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("before");
    console.log("File path:", filePath);
    const workbook = XLSX.readFile(filePath);
    console.log("after ", filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
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
    if (provisionType === "Add pre activated") {
      console.log("preActivate");
      //let preActivateResult = await preActivate(data, Uploaded_by,serviceProvider, carrier,Agent_id,master,planId,trackingNumber,tinNumber,unitType,provisionType)
      const preActivateResult = await preActivate(
        data,
        Uploaded_by,
        serviceProvider,
        carrier,
        /* team , */ AgentType,
        AgentName,
        unitType,
        provisionType,
        billingModel
      );

      return preActivateResult;
    } else if (provisionType === "Add Stock") {
      console.log("processedData");
      //const processedData = await processData( data,Uploaded_by,serviceProvider, carrier,Agent_id,master,unitType,provisionType);
      const processedData = await processData(
        data,
        Uploaded_by,
        serviceProvider,
        carrier,
        /* team , */ AgentType,
        AgentName,
        unitType,
        provisionType,
        billingModel
      );
      console.log("returned", processedData);

      return processedData;
    } else if (provisionType === "Add and activate") {
      console.log("Add and Activate");
      //const addAndActivateResult = await addAndActivate(data, Uploaded_by,serviceProvider, carrier,Agent_id,master,planId,trackingNumber,tinNumber,unitType,provisionType)
      const addAndActivateResult = await addAndActivate(
        data,
        Uploaded_by,
        serviceProvider,
        carrier,
        /* team , */ AgentType,
        AgentName,
        unitType,
        provisionType,
        billingModel
      );

      return addAndActivateResult;
    } else {
      console.log("asdasd");
      const AddAndAssignNonActivateResult = await AddAndAssignNonActivate(
        data,
        Uploaded_by,
        serviceProvider,
        carrier,
        /* team , */ AgentType,
        AgentName,
        unitType,
        provisionType,
        billingModel
      );

      return AddAndAssignNonActivateResult;
    }
  } catch (error) {
    console.error("Error processing file:", error);
    return res.status(500).send({ msg: "Network issue: Please try again" });
  }
});

router.post(
  "/bulkSimAddStock",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const filePath = req.file ? req.file.path : null;
      if (!filePath) {
        res.status(400).send({ msg: "file not found" });
      }
      const uploadedFileName = req.file.originalname;
      console.log(filePath);
      let {
        Uploaded_by,
        serviceProvider,
        carrier,
        /* team  ,*/ AgentType,
        AgentName,
        unitType,
        provisionType,
        billingModel,
      } = req.body;
      const workbook = XLSX.readFile(filePath);
      console.log("after ", filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      const { validSIMs, invalidSIMs } = data.reduce(
        (result, entry) => {
          const sim = String(entry.SIM).trim(); // Ensure SIM is treated as string
          if (sim.length !== 19 || !/^\d+$/.test(sim)) {
            // If SIM is invalid, push it to invalidSIMs array
            result.invalidSIMs.push(sim);
          } else {
            result.validSIMs.push({
              SIM: sim,
              Model: entry.Model,
              Box: entry.Box,
              IMEI: entry.IMEI,
              make: entry.make,
              // Add other fields as needed
            });
          }
          return result;
        },
        { validSIMs: [], invalidSIMs: [] }
      );
      const result = await processData(
        invalidSIMs,
        validSIMs,
        Uploaded_by,
        serviceProvider,
        carrier,
        /* team , */ AgentType,
        AgentName,
        unitType,
        provisionType,
        billingModel
      );
      //const result = await job.finished();
      if (result) {
        return res.status(200).send({
          msg: `inventory added`,
          data: result,
        });
      } else {
        return res.status(400).send({
          msg: `Failed: inventory not added`,
        });
      }
    } catch (error) {
      next(error); // Pass the error to the error handling middleware
      return res.status(500).send({ msg: "Network issue: Please try again" });
    }
  }
);

router.post(
  "/bulkAddPreSimActivated",
  upload.single("file"),
  async (req, res) => {
    const filePath = req.file.path;
    const uploadedFileName = req.file.originalname;
    console.log(filePath);
    let {
      Uploaded_by,
      serviceProvider,
      carrier,
      /* team  ,*/ AgentType,
      AgentName,
      unitType,
      provisionType,
      billingModel,
    } = req.body;
    const workbook = XLSX.readFile(filePath);
    console.log("after ", filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    const { validSIMs, invalidSIMs } = data.reduce(
      (result, entry) => {
        const sim = String(entry.SIM).trim(); // Ensure SIM is treated as string
        if (sim.length !== 19 || !/^\d+$/.test(sim)) {
          // If SIM is invalid, push it to invalidSIMs array
          result.invalidSIMs.push(sim);
        } else {
          result.validSIMs.push({
            SIM: sim,
            Model: entry.Model,
            Box: entry.Box,
            IMEI: entry.IMEI,
            make: entry.make,
            // Add other fields as needed
          });
        }
        return result;
      },
      { validSIMs: [], invalidSIMs: [] }
    );
    const result = await preActivate(
      invalidSIMs,
      validSIMs,
      Uploaded_by,
      serviceProvider,
      carrier,
      /* team , */ AgentType,
      AgentName,
      unitType,
      provisionType,
      billingModel
    );
    //const result = await job.finished();
    if (result) {
      return res.status(200).send({
        msg: `inventory added`,
        data: result,
      });
    } else {
      return res.status(200).send({
        msg: `Failed: inventory not added`,
      });
    }
  }
);

router.post("/bulkAddAndActivate", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const uploadedFileName = req.file.originalname;
  console.log(filePath);
  let {
    Uploaded_by,
    serviceProvider,
    carrier,
    /* team  ,*/ AgentType,
    AgentName,
    unitType,
    provisionType,
    billingModel,
  } = req.body;
  const workbook = XLSX.readFile(filePath);
  console.log("after ", filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  const { validSIMs, invalidSIMs } = data.reduce(
    (result, entry) => {
      const sim = String(entry.SIM).trim(); // Ensure SIM is treated as string
      if (sim.length !== 19 || !/^\d+$/.test(sim)) {
        // If SIM is invalid, push it to invalidSIMs array
        result.invalidSIMs.push(sim);
      } else {
        result.validSIMs.push({
          SIM: sim,
          Model: entry.Model,
          Box: entry.Box,
          IMEI: entry.IMEI,
          make: entry.make,
          // Add other fields as needed
        });
      }
      return result;
    },
    { validSIMs: [], invalidSIMs: [] }
  );
  const result = await addAndActivate(
    invalidSIMs,
    validSIMs,
    Uploaded_by,
    serviceProvider,
    carrier,
    /* team , */ AgentType,
    AgentName,
    unitType,
    provisionType,
    billingModel
  );
  //const result = await job.finished();
  if (result) {
    return res.status(200).send({
      msg: `inventory added`,
      data: result,
    });
  } else {
    return res.status(200).send({
      msg: `Failed: inventory not added`,
    });
  }
});

router.post(
  "/bulkAddAndAssignNonActivate",
  upload.single("file"),
  async (req, res, next) => {
    const filePath = req.file.path;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const uploadedFileName = req.file.originalname;
      console.log(filePath);

      let {
        Uploaded_by,
        serviceProvider,
        carrier,
        AgentType,
        AgentName,
        unitType,
        provisionType,
        billingModel,
      } = req.body;
      const workbook = XLSX.readFile(filePath);
      console.log("after ", filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      // Validate SIM field
      const {
        validSIMs,
        invalidSIMs,
        emptyModelSIMs,
        emptyBoxSIMs,
        emptySIMRows,
      } = data.reduce(
        (result, entry, index) => {
          const sim = String(entry.SIM).trim(); // Ensure SIM is treated as string
          const model = entry.Model ? entry.Model.toLowerCase() : ""; // Get the model and convert to lowercase
          const box = entry.Box; // Get the box and trim any whitespace
          if (sim.length !== 19 || !/^\d+$/.test(sim) || !model || !box) {
            if (!model) {
              result.emptyModelSIMs.push(sim);
            } else if (!box) {
              result.emptyBoxSIMs.push(sim);
            } else {
              result.invalidSIMs.push(sim);
              result.emptySIMRows.push(
                `row ${index + 1} has an empty or invalid SIM or Model`
              );
            }
          } else if (!["micro", "macro", "nano"].includes(model)) {
            // Check if model is not in the list of valid values
            result.invalidSIMs.push(sim);
            result.emptySIMRows.push(
              `row ${index + 1} has an invalid Model value`
            );
          } else {
            result.validSIMs.push({
              SIM: sim,
              Model: model,
              Box: box,
              IMEI: entry.IMEI,
              make: entry.make,
              // Add other fields as needed
            });
          }
          return result;
        },
        {
          validSIMs: [],
          invalidSIMs: [],
          emptyModelSIMs: [],
          emptyBoxSIMs: [],
          emptySIMRows: [],
        }
      );
      const result = await AddAndAssignNonActivate(
        invalidSIMs,
        validSIMs,
        Uploaded_by,
        serviceProvider,
        carrier,
        /* team , */ AgentType,
        AgentName,
        unitType,
        provisionType,
        billingModel,
        emptyModelSIMs,
        emptyBoxSIMs,
        emptySIMRows
      );
      //const result = await job.finished();
      if (result) {
        return res.status(200).send({
          msg: `inventory added`,
          data: result,
        });
      } else {
        return res.status(200).send({
          msg: `Failed: inventory not added`,
        });
      }
    } catch (error) {
      next(error); // Pass the error to the error handling middleware
      return res.status(500).send({ msg: "Network issue: Please try again" });
    }
  }
);

router.route("/").post(controller.saveDeviceInventory).get(controller.getAll);
router.route("/getByESN").get(controller.getByESN);
router.route("/getByUnitType").get(controller.getByUnitType);
router.route("/getSimDetails").get(controller.getSimDetails);
router.route("/getByBillModel").get(controller.getByBillModel);
router.route("/getesnbyBillingModel").get(controller.getesnbyBillingModel);
router.route("/inUse").get(controller.getAlignDevice);
router.route("/available").get(controller.getFreeDevices);
router.route("/update").put(controller.update);
router.route("/deActivate").get(controller.getDeActivate);
router.route("/SimAddStock").post(controller.SimAddStock);
router.route("/AddPreSimActivated").post(controller.AddPreSimActivated);
router.route("/addAndActivate").post(controller.addAndActivate);
router
  .route("/addAndAssignNonActivate")
  .post(controller.addAndAssignNonActivate);

async function processData(
  data,
  Uploaded_by,
  serviceProvider,
  carrier,
  /* team , */ AgentType,
  AgentName,
  unitType,
  provisionType,
  billingModel
) {
  console.log(
    Uploaded_by,
    serviceProvider,
    carrier,
    /* team , */ AgentType,
    AgentName,
    unitType,
    provisionType
  );

  const uniqueSimNumbers = Array.from(new Set(data.map((row) => row.SIM)));
  console.log(uniqueSimNumbers);
  // Query the database to find existing SimNumbers
  const existingSimNumbers = await simModel.distinct("SimNumber", {
    SimNumber: { $in: uniqueSimNumbers, unitType, billingModel },
  });
  console.log(existingSimNumbers);
  // Filter out SimNumbers that already exist in the database
  const newSimNumbers = uniqueSimNumbers.filter(
    (simNumber) => !existingSimNumbers.includes(simNumber)
  );
  console.log(newSimNumbers);
  // Create mongooseDocuments with new unique SimNumbers

  const mongooseDocuments = newSimNumbers.map((simNumber) => {
    // Find the corresponding row in the data array
    const rowData = data.find((row) => row.SIM === simNumber);
    let model, Make;
    if (unitType === "WIRELESS DEVICE" || unitType === "Wireless Device") {
      model = rowData.Model;
      console.log("show model", model);
      model.toUpperCase();
      Make = rowData.make;
      Make.toUpperCase();
    }
    return {
      SimNumber: simNumber,
      Model: model,
      make: Make,
      IMEI: rowData.IMEI,
      box: rowData.Box,
      Uploaded_by,
      serviceProvider,
      carrier,
      //team ,
      AgentType,
      AgentName,
      unitType,
      provisionType,
      billingModel,
    };
  });
  console.log("here here", mongooseDocuments);
  const session = await mongoose.startSession();
  let savedData;
  try {
    session.startTransaction();
    savedData = await simModel.insertMany(mongooseDocuments);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted. Error: ", error);
    throw error;
  } finally {
    session.endSession();
  }

  return {
    savedData: savedData,
    duplicateNumbers: existingSimNumbers,
    newSimNumbers: newSimNumbers,
  };
}

// preAvtivate function
async function preActivate(
  data,
  Uploaded_by,
  serviceProvider,
  carrier,
  /* team , */ AgentType,
  AgentName,
  unitType,
  provisionType,
  billingModel
) {
  console.log(
    Uploaded_by,
    serviceProvider,
    carrier,
    /* team , */ AgentType,
    AgentName,
    unitType,
    provisionType
  );

  const uniqueSimNumbers = Array.from(new Set(data.map((row) => row.SIM)));
  console.log(uniqueSimNumbers);
  // Query the database to find existing SimNumbers
  const existingSimNumbers = await simModel.distinct("SimNumber", {
    SimNumber: { $in: uniqueSimNumbers, unitType, billingModel },
  });
  console.log(existingSimNumbers);
  // Filter out SimNumbers that already exist in the database
  const newSimNumbers = uniqueSimNumbers.filter(
    (simNumber) => !existingSimNumbers.includes(simNumber)
  );
  console.log(newSimNumbers);
  // Create mongooseDocuments with new unique SimNumbers

  const mongooseDocuments = newSimNumbers.map((simNumber) => {
    // Find the corresponding row in the data array
    const rowData = data.find((row) => row.SIM === simNumber);
    let model, Make;
    if (unitType === "WIRELESS DEVICE" || unitType === "Wireless Device") {
      model = rowData.Model;
      console.log("show model", model);
      model.toUpperCase();
      Make = rowData.make;
      Make.toUpperCase();
    }
    return {
      SimNumber: simNumber,
      Model: model,
      make: Make,
      IMEI: rowData.IMEI,
      box: rowData.Box,
      Uploaded_by,
      serviceProvider,
      carrier,
      //team ,
      AgentType,
      AgentName,
      unitType,
      provisionType,
      billingModel,
    };
  });
  console.log("here here", mongooseDocuments);
  const session = await mongoose.startSession();
  let savedData;
  try {
    session.startTransaction();
    savedData = await simModel.insertMany(mongooseDocuments);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted. Error: ", error);
    throw error;
  } finally {
    session.endSession();
  }

  return {
    savedData: savedData,
    duplicateNumbers: existingSimNumbers,
    newSimNumbers: newSimNumbers,
  };
}

// Add and activate
async function addAndActivate(
  data,
  Uploaded_by,
  serviceProvider,
  carrier,
  /* team , */ AgentType,
  AgentName,
  unitType,
  provisionType,
  billingModel
) {
  console.log(
    Uploaded_by,
    serviceProvider,
    carrier,
    /* team , */ AgentType,
    AgentName,
    unitType,
    provisionType
  );

  const uniqueSimNumbers = Array.from(new Set(data.map((row) => row.SIM)));
  console.log(uniqueSimNumbers);
  // Query the database to find existing SimNumbers
  const existingSimNumbers = await simModel.distinct("SimNumber", {
    SimNumber: { $in: uniqueSimNumbers, unitType, billingModel },
  });
  console.log(existingSimNumbers);
  // Filter out SimNumbers that already exist in the database
  const newSimNumbers = uniqueSimNumbers.filter(
    (simNumber) => !existingSimNumbers.includes(simNumber)
  );
  console.log(newSimNumbers);
  // Create mongooseDocuments with new unique SimNumbers

  const mongooseDocuments = newSimNumbers.map((simNumber) => {
    // Find the corresponding row in the data array
    const rowData = data.find((row) => row.SIM === simNumber);
    let model, Make;
    if (unitType === "WIRELESS DEVICE" || unitType === "Wireless Device") {
      model = rowData.Model;
      console.log("show model", model);
      model.toUpperCase();
      Make = rowData.make;
      Make.toUpperCase();
    }
    return {
      SimNumber: simNumber,
      Model: model,
      make: Make,
      IMEI: rowData.IMEI,
      box: rowData.Box,
      Uploaded_by,
      serviceProvider,
      carrier,
      //team ,
      AgentType,
      AgentName,
      unitType,
      provisionType,
      billingModel,
    };
  });
  console.log("here here", mongooseDocuments);
  const session = await mongoose.startSession();
  let savedData;
  try {
    session.startTransaction();
    savedData = await simModel.insertMany(mongooseDocuments);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted. Error: ", error);
    throw error;
  } finally {
    session.endSession();
  }

  return {
    savedData: savedData,
    duplicateNumbers: existingSimNumbers,
    newSimNumbers: newSimNumbers,
  };
}

//add and assigm non activate
async function AddAndAssignNonActivate(
  invalidSIMs,
  data,
  Uploaded_by,
  serviceProvider,
  carrier,
  /* team , */ AgentType,
  AgentName,
  unitType,
  provisionType,
  billingModel,
  emptyModelSIMs,
  emptyBoxSIMs,
  emptySIMRows
) {
  console.log(
    Uploaded_by,
    serviceProvider,
    carrier,
    /* team , */ AgentType,
    AgentName,
    unitType,
    provisionType,
    data
  );

  const uniqueSimNumbers = Array.from(new Set(data.map((row) => row.SIM)));
  console.log(uniqueSimNumbers);
  // Query the database to find existing SimNumbers
  const existingSimNumbers = await simModel.distinct("SimNumber", {
    SimNumber: { $in: uniqueSimNumbers },
    unitType,
    billingModel,
  });
  console.log(existingSimNumbers);
  // Filter out SimNumbers that already exist in the database
  const newSimNumbers = uniqueSimNumbers.filter(
    (simNumber) => !existingSimNumbers.includes(simNumber)
  );
  console.log(newSimNumbers);
  // Create mongooseDocuments with new unique SimNumbers

  const mongooseDocuments = newSimNumbers.map((simNumber) => {
    // Find the corresponding row in the data array
    const rowData = data.find((row) => row.SIM === simNumber);
    console.log(unitType);
    let model, Make;
    if (unitType === "WIRELESS DEVICE" || unitType === "Wireless Device") {
      model = rowData.Model;
      console.log("show model", model);
      model?.toUpperCase();
      Make = rowData.make;
      Make?.toUpperCase();
    }
    return {
      SimNumber: simNumber,
      Model: model,
      make: Make,
      IMEI: rowData.IMEI,
      box: rowData.Box,
      Uploaded_by,
      serviceProvider,
      carrier,
      //team ,
      AgentType,
      AgentName,
      unitType,
      provisionType,
      billingModel,
    };
  });
  console.log("here here", mongooseDocuments);
  const session = await mongoose.startSession();
  let savedData;
  try {
    session.startTransaction();
    savedData = await simModel.insertMany(mongooseDocuments);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted. Error: ", error);
    throw error;
  } finally {
    session.endSession();
  }

  return {
    savedData: savedData,
    duplicateNumbers: existingSimNumbers,
    newSimNumbers: newSimNumbers,
    invalidSIMs: invalidSIMs,
    noModelAddedForSIMs: emptyModelSIMs,
    noBoxNoAddedForSIMS: emptyBoxSIMs,
    emptySIMRows: emptySIMRows,
  };
}

module.exports = router;
