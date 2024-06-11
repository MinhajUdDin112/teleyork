const express = require("express");
const subModuleRouter = express.Router();
const expressAsyncHandler = require("express-async-handler");
const subModuleServices = require("./subModuleServices");

subModuleRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    let { module, name, route, icon, orderPosition,actions } = req.body;
    const isExist = await subModuleServices.isExist(module, name);
    if (isExist) {
      res.status(400).send({ msg: "SubModule with name already exist" });
      return;
    }
    if (orderPosition) {
      const isOrderPositionExist = await subModuleServices.isOrderPositionExist(
        module,
        orderPosition
      );
      if (isOrderPositionExist) {
        res.status(400).send({ msg: "Module on this position already exist" });
        return;
      }
    } else {
      orderPosition = await subModuleServices.getOrderPosition(module);
    }
    const result = await subModuleServices.new(
      module,
      name,
      route,
      icon,
      orderPosition,
      actions
    );
    if (result) {
      res.status(201).send({ msg: "New SubModule added", data: result });
    } else {
      res.status(400).send({ msg: "SubModule not added" });
    }
  })
);

subModuleRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const result = await subModuleServices.getAll();
    res.status(200).send({ msg: "Sub Module list", data: result });
  })
);
module.exports = subModuleRouter;
