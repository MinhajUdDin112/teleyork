const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const permissionServices = require("./permissionServices");
const permissionRouter = express.Router();

permissionRouter.get(
  "/all",
  expressAsyncHandler(async (req, res) => {
    const result = await permissionServices.get();
    res.status(200).send({ msg: "permissions", data: result });
  })
);
permissionRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await permissionServices.addNew(name);
    if (result) {
      return res.status(200).send({ msg: "Promotion added.", data: result });
    } else {
      return res.status(400).send({ msg: "Promotion not added" });
    }
  })
);
permissionRouter.patch(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { permissionId, name } = req.body;
    if (!permissionId || !name) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await permissionServices.update(permissionId, name);
    if (result) {
      return res.status(200).send({ msg: "Promotion updated.", data: result });
    } else {
      return res.status(400).send({ msg: "Promotion not updated" });
    }
  })
);
permissionRouter.delete(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { permissionId } = req.body;
    if (!permissionId) {
      return res.status(400).send({ msg: "Fields Missing" });
    }
    const result = await permissionServices.delete(permissionId);
    if (result.deletedCount == 0) {
      return res.status(400).send({ msg: "ID Not found" });
    }
    if (result) {
      return res.status(200).send({ msg: "Promotion deleted.", data: result });
    } else {
      return res.status(400).send({ msg: "Promotion not deleted" });
    }
  })
);

module.exports = permissionRouter;
