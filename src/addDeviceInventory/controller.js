const expressAsyncHandler = require("express-async-handler");
const service = require("./service");
const model = require("./model");
exports.addDevice = expressAsyncHandler(async (req, res, next) => {
  let {
    company,
    networkType,
    simType,
    operatingSystem,
    dataCapable,
    grade,
    deviceType,
    imeiType,
    make,
    price,
  } = req.body;
  if (
    !company ||
    !networkType ||
    !simType ||
    !operatingSystem ||
    !dataCapable ||
    !grade ||
    !deviceType ||
    !imeiType ||
    !make ||
    !price
  ) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  const result = await service.addNew(
    company,
    networkType,
    simType,
    operatingSystem,
    dataCapable,
    grade,
    deviceType,
    imeiType,
    make,
    price
  );
  if (result) {
    return res.status(201).send({
      msg: "device add Successfully",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "device not added" });
  }
});

// get all devices
exports.getAllDevices = expressAsyncHandler(async (req, res, next) => {
  const { company } = req.query;
  const result = await service.get(company);
  res.status(200).send({ msg: "devices", data: result });
});

//get by Id
exports.getOneDevice = expressAsyncHandler(async (req, res, next) => {
  let { deviceId } = req.query;
  const result = await service.getByID(deviceId);
  if (result) {
    return res.status(200).send({ msg: "device", data: result });
  } else {
    return res.status(400).send({ msg: "device Not Found" });
  }
});

// update devices info
exports.updateDevice = expressAsyncHandler(async (req, res, next) => {
  let {
    company,
    deviceId,
    networkType,
    simType,
    operatingSystem,
    dataCapable,
    grade,
    deviceType,
    imeiType,
    make,
    price,
  } = req.body;
  if (
    !company ||
    !deviceId ||
    !networkType ||
    !simType ||
    !operatingSystem ||
    !dataCapable ||
    !grade ||
    !deviceType ||
    !imeiType ||
    !make ||
    !price
  ) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  const result = await service.updateDevice(
    company,
    deviceId,
    networkType,
    simType,
    operatingSystem,
    dataCapable,
    grade,
    deviceType,
    imeiType,
    make,
    price
  );
  if (result) {
    return res.status(201).send({
      msg: "device updated Successfully",
      data: result,
    });
  } else {
    return res.status(400).send({ msg: "device not updated" });
  }
});

// get by device
exports.getPhoneDeviceModel = expressAsyncHandler(async (req, res, next) => {
  const result = await service.getPhoneDeviceModel();
  if (result) {
    return res.status(200).send({ msg: "device", data: result });
  } else {
    return res.status(400).send({ msg: "device Not Found" });
  }
});
// get by device
exports.getTabletDeviceModel = expressAsyncHandler(async (req, res, next) => {
  const result = await service.getTabletDeviceModel();
  if (result) {
    return res.status(200).send({ msg: "device", data: result });
  } else {
    return res.status(400).send({ msg: "device Not Found" });
  }
});

exports.delete = expressAsyncHandler(async (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) {
    return res.status(400).send({ msg: "Fields Missing" });
  }
  const result = await service.delete(deviceId);
  if (result.deletedCount == 0) {
    return res.status(400).send({ msg: "ID Not found" });
  }
  if (result) {
    return res.status(200).send({ msg: "User deleted.", data: result });
  } else {
    return res.status(400).send({ msg: "User not deleted" });
  }
});
exports.getmodelbymake = expressAsyncHandler(async (req, res) => {
  try {
    const { makeId } = req.query;

    // Ensure that the makeId is a valid ObjectId
    if (!makeId) {
      return res.status(400).json({ error: "Field Missing" });
    }

    const devices = await model.find({ make: makeId });
    if (devices) {
      return res.status(200).json({ msg: "devices", data: devices });
    } else {
      return res.status(400).json({ msg: "devices not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
