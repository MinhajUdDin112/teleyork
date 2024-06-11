const express = require("express");
const router = express.Router();
const controller = require("./controller.js");
const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, "uploads/vendors");
    console.log("destination");
    const targetDirectory = "uploads/vendors"; // Define your target directory
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
  filename: function (req, file, cb) {
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, Date.now() + "-" + sanitizedFilename);
    console.log("filename");
  },
});
const upload = multer({ storage });
// defining routes
router.post("/add", upload.single("file"), controller.add);
router.get("/getOne/:id", controller.getOne);
router.get("/getAll", controller.getAll);
router.put("/update/:id", upload.single("file"), controller.update);
router.delete("/delete/:id", controller.delete);
module.exports = router;
