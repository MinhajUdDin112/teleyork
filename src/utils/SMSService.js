// Required dependencies
const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Route for file upload
function SMSService(filePath) {
  //const filePath = req.file.path;
  // Process the uploaded file
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Extract the required data and send it back to the frontend
    const processedData = processData(data);
    return processData;
    // res.json({ data: processedData });
  } catch (error) {
    res.status(500).json({ error: "Failed to process the file" });
  }
};
// Example function to process the data
function processData(data) {
  // Implement your logic here to extract and process the required data from the uploaded file
  // Return the processed data to be displayed on the frontend

  const processedData = data.slice(1).map((row) => ({
    mobileNo: row[0],
    trackingId: row[1],
    name: row[2],
    email: row[3],
    templateId: row[4],
    message: ` Dear ${row[2]} , your sim has been dispatched you will receive in your mail, your tracking id is ${row[1]}`,
  }));

  return processedData;
}
module.exports=SMSService