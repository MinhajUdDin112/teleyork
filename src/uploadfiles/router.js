const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs").promises;
const customerService = require("../user/service");
const model = require("../user/model");
const enrollmentId = require("../utils/enrollmentId");
const axios = require("axios");
const fss = require("fs");

const router = express.Router();

const downloadFile = async (url, destinationPath) => {
  const response = await axios({
    method: "get",
    url: url,
    responseType: "stream",
  });

  response.data.pipe(fs.createWriteStream(destinationPath));

  return new Promise((resolve, reject) => {
    response.data.on("end", () => resolve());
    response.data.on("error", (error) => reject(error));
  });
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/banners"); // Specify the folder where the images will be stored
  },
  filename: function (req, file, cb) {
    const sanitizedFilename =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, sanitizedFilename.replace(/\\/g, "/")); // Use a unique filename, remove spaces, and replace backslashes with forward slashes
  },
});

const fileFilter = (req, file, cb) => {
  // Check file type or any other validations
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: fileFilter,
});

// API endpoint for file uploads
router.post(
  "/upload-file",
  upload.single("file"),
  expressAsyncHandler(async (req, res) => {
    let { uploadedBy, enrollmentId, audioUrl } = req.body;
    if (req.file) {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const fileType = req.body.fileType || "unknown"; // Assuming fileType is sent in the request body

      // Save the file path to your model's files array
      //const { uploadedBy, enrollmentId } = req.body; // Replace with the actual user ID
      const user = await model
        .findById({ _id: enrollmentId })
        .populate({ path: "files.uploadedBy" }); // Populate the user details

      if (!user) {
        return res.status(404).json({ msg: "User not found." });
      }

      const filePath = path
        .join("uploads/banners", req.file.filename)
        .replace(/\\/g, "/");

      user.files.push({
        filetype: fileType,
        filepath: filePath,
        uploadedBy: uploadedBy, // Assuming "name" is the field containing the user's name
      });

      const saved = await user.save();
      if (!saved) {
        return res
          .status(400)
          .json({ msg: "File not uploaded successfully.", data: user });
      } else {
        return res
          .status(200)
          .json({ msg: "File uploaded successfully.", data: user });
      }
    } else {
      //const { audioUrl, enrollmentId } = req.body;
      const fileType = req.body.fileType || "unknown";
      try {
        const cust = await customerService.getByUserID(enrollmentId);
        console.log(cust);
        // Download the audio file
        const response = await axios.get(audioUrl, {
          responseType: "arraybuffer",
        });

        // Specify the directory path
        const directory = "uploads/audios";

        // Generate timestamp
        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, "-")
          .replace(/\..+/, ""); // Format: yyyy-mm-ddThh-mm-ss

        // Specify the filename
        const filename = `${cust.firstName}_${timestamp}.mp3`;

        // Ensure the directory exists
        if (!fss.existsSync(directory)) {
          fss.mkdirSync(directory, { recursive: true });
        }

        // Write the downloaded audio data to a file
        const outputPath = path.join(directory, filename).replace(/\\/g, "/");
        fss.writeFileSync(outputPath, Buffer.from(response.data));

        // Save the audio path in the database
        const result = await model.findOneAndUpdate(
          { _id: enrollmentId },
          {
            $push: {
              files: {
                filetype: fileType ? fileType : filename,
                filepath: outputPath,
                uploadedBy: uploadedBy,
              },
            },
          },
          { new: true }
        );
        if (result) {
          return res
            .status(200)
            .send({ msg: "Audio uploaded successfully.", data: result });
        } else {
          return res.status(400).send({ msg: "failed to upload" });
        }
      } catch (error) {
        console.log("Error fetching uploaded files:", error);
        return res.status(500).json({ message: "Internal Server Error" });
      }
    }
  })
);

router.get(
  "/get-uploaded-files",
  expressAsyncHandler(async (req, res) => {
    try {
      // Fetch all files with details
      const { enrollmentId } = req.query;
      const files = await model
        .find({ _id: enrollmentId })
        .populate({ path: "files.uploadedBy", select: { _id: 1, name: 1 } });
      // Map files to a new array with modified details
      const filesWithDetails = files.map(async (file) => {
        const fileDetails = file.files.map(async (fileItem) => {
          const user = await model.findById(fileItem.uploadedBy, "name"); // Assuming "name" is the field containing the user's name
          return {
            fileType: fileItem.filetype,
            filepath: fileItem.filepath,
            uploadedBy: fileItem.uploadedBy,
            uploadDate: fileItem.uploadDate,
          };
        });

        return Promise.all(fileDetails);
      });

      const result = await Promise.all(filesWithDetails);

      return res.status(200).json(result.flat());
    } catch (error) {
      console.error("Error fetching uploaded files:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  })
);
const filePath =
  "E:\\Rezolvat Engineerings\\crm-backend\\pdf-templates\\SP_ETC796748.pdf";
router.get("/download", (req, res) => {
  try {
    // Send the local file as a response
    console.log("File Path:", filePath);
    res.download(filePath, (err) => {
      if (err) {
        console.error("Error sending the file:", err.message);
        res.status(500).send("Internal Server Error");
      } else {
        console.log("File sent successfully.");
      }
    });
  } catch (error) {
    console.error("Error sending the file:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

router.post(
  "/uploadaudiao",
  expressAsyncHandler(async (req, res) => {
    const { audioUrl, enrollmentId } = req.body;
    try {
      const cust = await customerService.getByUserID(enrollmentId);
      console.log(cust);
      // Download the audio file
      const response = await axios.get(audioUrl, {
        responseType: "arraybuffer",
      });

      // Specify the directory path
      const directory = "uploads/audios";

      // Generate timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\..+/, ""); // Format: yyyy-mm-ddThh-mm-ss

      // Specify the filename
      const filename = `${cust.firstName}_${timestamp}.mp3`;

      // Ensure the directory exists
      if (!fss.existsSync(directory)) {
        fss.mkdirSync(directory, { recursive: true });
      }

      // Write the downloaded audio data to a file
      const outputPath = path.join(directory, filename);
      fss.writeFileSync(outputPath, Buffer.from(response.data));

      // Save the audio path in the database
      const result = await model.findOneAndUpdate(
        { _id: enrollmentId },
        {
          $push: {
            audioFiles: {
              audioPath: outputPath,
              audioLink: audioUrl,
              audioUploadedAt: new Date(),
            },
          },
        }
      );
      if (result) {
        return res
          .status(200)
          .send({ msg: "Audio uploaded successfully.", data: result });
      } else {
        return res.status(400).send({ msg: "failed to upload" });
      }
    } catch (error) {
      console.error("Error fetching uploaded files:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  })
);

module.exports = router;
