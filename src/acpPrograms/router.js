const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const controller = require("./controller");
const service = require("./service");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    console.log("asd");
    const targetDirectory = "uploads/banners"; // Define your target directory
    try {
      // Check if the target directory exists
      if (!fs.existsSync(targetDirectory)) {
        // If it doesn't exist, create it
        await fs.promises.mkdir(targetDirectory, { recursive: true });
      }
      cb(null, targetDirectory);
    } catch (err) {
      // Handle any errors during directory creation
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png"];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  console.log(fileExtension);

  if (!allowedExtensions.includes(fileExtension)) {
    // Invalid file type
    return cb(
      new Error(
        "Invalid file type. Only JPG, JPEG, and PNG files are allowed."
      ),
      false
    );
  }

  const targetDirectory = "uploads/banners"; // Define your target directory
  const fileName = file.originalname;
  const filePath = path.join(targetDirectory, fileName);

  if (fs.existsSync(filePath)) {
    // File with the same name already exists
    return cb(new Error("File with the same name already exists"), false);
  }

  // File doesn't exist, so it can be saved
  cb(null, true);
};

// Initialize multer with the storage engine and file filter
const upload = multer({ storage, fileFilter });

router.post(
  "/bannerUpload",
  upload.single("banner"),
  expressAsyncHandler(async (req, res) => {
    if (!req.file) {
      // No file was selected, but the request is still considered successful
      return res.status(201).send({
        msg: "No file selected, but request successful",
      });
    }
    if (req.file) {
      // File was successfully uploaded
      return res.status(201).send({
        msg: "Uploaded",
      });
    }

    // No file was uploaded
    return res.status(400).send({
      msg: "Not uploaded",
    });
  })
);

// Route to add a service
router.post("/", controller.add);
router.patch("/", controller.update);
router.get("/all", controller.get);
router.get("/getOne", controller.getOne);

module.exports = router;
