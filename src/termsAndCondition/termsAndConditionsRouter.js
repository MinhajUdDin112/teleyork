const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const termsAndConditionsServices = require("./termsAndCondionsServices");
const termsAndConditionsRouter = express.Router();

// Get all term and conditions
termsAndConditionsRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    try {
      const result = await termsAndConditionsServices.getAll();
      res.status(200).send({ msg: "Term and Conditions", data: result });
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Internal server error" });
    }
  })
);
//get individual term and condition
termsAndConditionsRouter.get(
  "/getById",
  expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.query;
      const result = await termsAndConditionsServices.getOne(id);
      if (result) {
        return res
          .status(200)
          .send({ msg: "Term and Conditions", data: result });
      } else {
        return res.status(404).send({ msg: "Not Found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Internal server error" });
    }
  })
);

// Create a new term and condition
termsAndConditionsRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { content } = req.body;
    try {
      const result = await termsAndConditionsServices.create(content);
      res.status(200).send({ msg: "Term and Condition created", data: result });
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Internal server error" });
    }
  })
);

// Update a term and condition by ID
termsAndConditionsRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { id, content } = req.body;
    try {
      const result = await termsAndConditionsServices.update(id, content);
      if (result) {
        res
          .status(200)
          .send({ msg: "Term and Condition updated", data: result });
      } else {
        res.status(404).json({ msg: "Term and Condition not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Internal server error" });
    }
  })
);
// delete term and condition
termsAndConditionsRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.query;
    try {
      const result = await termsAndConditionsServices.delete(id);
      if (result.deletedCount != 0) {
        res
          .status(200)
          .send({ msg: "Term and Condition deleted", data: result });
        return;
      } else {
        res.status(404).json({ msg: "Term and Condition not found" });
        return;
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Internal server error" });
    }
  })
);

module.exports = termsAndConditionsRouter;
