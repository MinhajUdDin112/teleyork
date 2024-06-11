const express = require("express");
const moduleRouter = express.Router();
const expressAsyncHandler = require("express-async-handler");
const moduleServices = require("./moduleServices");
moduleRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    let { name, route, icon, orderPosition } = req.body;
    const isExist = await moduleServices.isExist(name);
    if (isExist) {
      res.status(400).send({ msg: "Module with name already exist" });
      return;
    }
    if (orderPosition) {
      const isOrderPositionExist = await moduleServices.isOrderPositionExist(
        orderPosition
      );
      if (isOrderPositionExist) {
        res.status(400).send({ msg: "Module on this position already exist" });
        return;
      }
    } else {
      orderPosition = await moduleServices.getOrderPosition();
    }
    const result = await moduleServices.new(name, route, icon, orderPosition);
    if (result) {
      res.status(201).send({ msg: "New Module added", data: result });
    } else {
      res.status(400).send({ msg: "Module not added" });
    }
  })
);

moduleRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const result = await moduleServices.getAll();
    if (result) {
      res.status(200).send({ msg: "Module list", data: result });
    } else {
      res.status(400).send({ msg: "Module not added" });
    }
  })
);
module.exports = moduleRouter;
