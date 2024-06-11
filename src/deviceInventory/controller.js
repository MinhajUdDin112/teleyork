const expressAsyncHandler = require("express-async-handler");
const service = require("./service");
exports.saveDeviceInventory = expressAsyncHandler(async (req, res, next) => {
  const result = await service.bulkInsert(req.body);
  if (result) {
    return res.status(201).send({
      msg: "success",
      data: result,
    });
  } else {
    return res.status(400).send({
      msg: "Failed!",
    });
  }
});
// get all devices
exports.getAll = expressAsyncHandler(async (req, res) => {
  const result = await service.getAll(req.query.serviceProvider);
  res.status(200).send({ msg: "list", data: result });
});
//align devices
exports.getAlignDevice = expressAsyncHandler(async (req, res) => {
  const result = await service.getAlignDevices(req.query.serviceProvider);
  res.status(200).send({ msg: "list", data: result });
});
//get free devices
exports.getFreeDevices = expressAsyncHandler(async (req, res) => {
  const result = await service.getFreeDevices(req.query.serviceProvider);
  res.status(200).send({ msg: "list", data: result });
});
// get by serial number
exports.getByMDN = expressAsyncHandler(async (req, res) => {
  const result = await service.getByMDN(req.query.serviceProvider,req.query.esn);
  if (result) {
    res.status(200).send({ msg: "Device", data: result });
  } else {
    res.status(404).send({ msg: "Device not found" });
  }
});

