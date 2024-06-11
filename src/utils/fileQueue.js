const Queue = require('bull');
const XLSX = require('xlsx');
const fs = require('fs');

const fileQueue = new Queue('file-processing', {
  redis: {
    host: 'localhost', // Replace with your Redis server configuration
    port: 6379,
  },
});

fileQueue.process(async (job) => {
  const { filePath, uploadedFileName, userId } = job.data;

  console.log("huhuhuhuhuhuh")
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Extract the required data and send it back to the frontend
    const processedData = await processDataTest(userId, data);

    // Delete the uploaded file
    fs.unlinkSync(filePath);

    return processedData;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

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
      const dynamicKeys = template.template.match(/\$\w+/g);
  
      // Replace keys in the message with their corresponding values from the rowData
      let messageWithValues = template.template;
      if (dynamicKeys) {
        dynamicKeys.forEach((key) => {
          const dataKey = key.slice(1); // Remove the $ sign from the key
          const value = rowData[dataKey];
          messageWithValues = messageWithValues.replace(key, value);
        });
      }
      rowData.message = messageWithValues;
      rowData.uploadedBy = uploadedBy;
      rowData.company = template.company;
      rowData.notification_subject = template.notification_subject;
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

module.exports = fileQueue;