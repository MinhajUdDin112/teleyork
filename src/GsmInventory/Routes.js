const express = require("express");
const router = express.Router();
const controller = require("./Controller");
const fs = require("fs");
const multer = require("multer");
const XLSX = require("xlsx");
const Queue = require("bull");
const gsmModel = require("../simInventory/model");
const { default: mongoose } = require("mongoose");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, Date.now() + "-" + sanitizedFilename);
  },
});
const upload = multer({ storage });

const fileQueue = new Queue("bulkgsmFile", {
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
    planId,
    trackingNumber,
    tinNumber,
    unitType,
    provisionType,
    box,
    billingModel,
  } = job.data;

  try {
    const workbook = XLSX.readFile(filePath);
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

    if (provisionType === "Add pre activated") {
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
      return processedData;
    } else if (provisionType === "Add and activate") {
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
    } else if (provisionType === "Reprovision") {
      const addReprovisionResult = await addReprovision(
        data,
        Uploaded_by,
        serviceProvider,
        carrier,
        /* team , */ AgentType,
        AgentName,
        unitType,
        provisionType
      );
      return addReprovisionResult;
    } else {
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
    console.error(error);
    throw error;
  }
});

router.post(
  "/bulkphoneAddStock",
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

router.post("/bulkAddPreActivated", upload.single("file"), async (req, res) => {
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
});

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
    const { validSIMs, invalidSIMs, emptyModelSIMs } = data.reduce(
      (result, entry) => {
        const sim = String(entry.SIM).trim(); // Ensure SIM is treated as string
        const model = entry.Model.trim(); // Get the model and trim any whitespace
        if (sim.length < 18 || sim.length > 19 || !/^\d+$/.test(sim)) {
          result.invalidSIMs.push(sim);
        } else if (!model) {
          result.emptyModelSIMs.push({
            SIM: sim,
            Model: model,
            Box: entry.Box,
            IMEI: entry.IMEI,
            make: entry.make,
            // Add other fields as needed
          });
        } else {
          result.validSIMs.push({
            SIM: sim,
            Model: model,
            Box: entry.Box,
            IMEI: entry.IMEI,
            make: entry.make,
            // Add other fields as needed
          });
        }
        return result;
      },
      { validSIMs: [], invalidSIMs: [], emptyModelSIMs: [] }
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
router.post(
  "/bulkAddReprovision",
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
      //await new Promise((resolve) => setTimeout(resolve, 3000));

      // Enqueue file processing task
      // const job = await fileQueue.add({
      //   filePath,
      //   uploadedFileName,
      //   Uploaded_by,
      //   serviceProvider,
      //   carrier,
      //   AgentType,
      //   AgentName,
      //   unitType,
      //   provisionType,
      //   billingModel,
      // });
      const workbook = XLSX.readFile(filePath);
      console.log("after ", filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      // Validate SIM field
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
    } catch (error) {
      next(error); // Pass the error to the error handling middleware
      return res.status(500).send({ msg: "Network issue: Please try again" });
    }
  }
);

router.route("/").post(controller.saveDeviceInventory).get(controller.getAll);
router.route("/getByESN").get(controller.getByESN);
router.route("/getPhoneDetails").get(controller.getSimDetails);
router.route("/inUse").get(controller.getAlignDevice);
router.route("/available").get(controller.getFreeDevices);
router.route("/deActivate").get(controller.getDeActivate);
router.route("/phoneAddStock").post(controller.gsmAddStock);
router.route("/AddPreActivated").post(controller.AddPreEsnActivated);
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
  const uniqueSimNumbers = Array.from(new Set(data.map((row) => row.SIM)));
  // Query the database to find existing SimNumbers
  const existingSimNumbers = await gsmModel.distinct("SimNumber", {
    SimNumber: { $in: uniqueSimNumbers, unitType, billingModel },
  });
  // Filter out SimNumbers that already exist in the database
  const newSimNumbers = uniqueSimNumbers.filter(
    (SimNumber) => !existingSimNumbers.includes(SimNumber)
  );
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
  const session = await mongoose.startSession();
  let savedData;
  try {
    session.startTransaction();
    savedData = await gsmModel.insertMany(mongooseDocuments);
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
  const uniqueSimNumbers = Array.from(new Set(data.map((row) => row.SIM)));
  // Query the database to find existing SimNumbers
  const existingSimNumbers = await gsmModel.distinct("SimNumber", {
    SimNumber: { $in: uniqueSimNumbers, unitType, billingModel },
  });
  // Filter out SimNumbers that already exist in the database
  const newSimNumbers = uniqueSimNumbers.filter(
    (SimNumber) => !existingSimNumbers.includes(SimNumber)
  );
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
  const session = await mongoose.startSession();
  let savedData;
  try {
    session.startTransaction();
    savedData = await gsmModel.insertMany(mongooseDocuments);
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
  const uniqueSimNumbers = Array.from(new Set(data.map((row) => row.SIM)));

  // Query the database to find existing SimNumbers
  const existingSimNumbers = await gsmModel.distinct("SimNumber", {
    SimNumber: { $in: uniqueSimNumbers, unitType, billingModel },
  });
  // Filter out SimNumbers that already exist in the database
  const newSimNumbers = uniqueSimNumbers.filter(
    (SimNumber) => !existingSimNumbers.includes(SimNumber)
  );
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
  const session = await mongoose.startSession();
  let savedData;
  try {
    session.startTransaction();
    savedData = await gsmModel.insertMany(mongooseDocuments);
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
  const existingSimNumbers = await gsmModel.distinct("SimNumber", {
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
      Model: model ? model : "",
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
    savedData = await gsmModel.insertMany(mongooseDocuments);
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
  };
}

// add reprovision
async function addReprovision(
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
  const uniqueSimNumbers = Array.from(new Set(data.map((row) => row.SIM)));
  // Query the database to find existing SimNumbers
  const existingSimNumbers = await gsmModel.distinct("SimNumber", {
    SimNumber: { $in: uniqueSimNumbers, unitType, billingModel },
  });
  // Filter out SimNumbers that already exist in the database
  const newSimNumbers = uniqueSimNumbers.filter(
    (SimNumber) => !existingSimNumbers.includes(SimNumber)
  );
  // Create mongooseDocuments with new unique SimNumbers

  const mongooseDocuments = newSimNumbers.map((simNumber) => {
    // Find the corresponding row in the data array
    const rowData = data.find((row) => row.SIM === simNumber);
    if (unitType === "WIRELESS DEVICE" || unitType === "Wireless Device") {
      let model = rowData.Model;
      console.log("show model", rowData);
      model.toUpperCase();
      let Make = rowData.make;
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
  const session = await mongoose.startSession();
  let savedData;
  try {
    session.startTransaction();
    savedData = await gsmModel.insertMany(mongooseDocuments);
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

module.exports = router;
