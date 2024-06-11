const expressAsyncHandler = require("express-async-handler");
const service = require("./service");
const ApiError = require("../helpers/apiError");
const custModel = require("../user/model");
const labelModel = require("../order/labelModel");
const {
  DELIVERED1,
  DELIVERED2,
  LABELCREATED,
  USPSFACILITY1,
  USPSFACILITY2,
  INTRANSIT,
} = require("../utils/trackingSummary");

exports.carriersList = expressAsyncHandler(async (req, res) => {
  const result = await service.getList();
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "carrier list", data: result.data });
  }
});

exports.carrierInfo = expressAsyncHandler(async (req, res) => {
  const { carrierCode } = req.query;
  const result = await service.carrierInfo(carrierCode);
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "carrier Info", data: result.data });
  }
});
exports.pakagesList = expressAsyncHandler(async (req, res) => {
  const { carrierCode } = req.query;
  const result = await service.pakagesList(carrierCode);
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "packages List", data: result.data });
  }
});
exports.listServices = expressAsyncHandler(async (req, res) => {
  const { carrierCode } = req.query;
  const result = await service.listServices(carrierCode);
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "packages List", data: result.data });
  }
});
exports.addFund = expressAsyncHandler(async (req, res) => {
  const { carrierCode, amount } = req.body;
  if (!carrierCode || !amount) {
    return res
      .status(400)
      .send({ msg: "carrierCode field or amount field is missing" });
  }
  const result = await service.listServices(carrierCode, amount);
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "packages List", data: result.data });
  }
});

exports.CustomerInfo = expressAsyncHandler(async (req, res) => {
  const { customerId } = req.query;
  const result = await service.CustomerInfo(customerId);
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "packages List", data: result.data });
  }
});
exports.customerList = expressAsyncHandler(async (req, res) => {
  const {
    stateCode,
    countryCode,
    marketplaceId,
    tagId,
    sortBy,
    sortDir,
    page,
    pageSize,
  } = req.query;
  const result = await service.customerList(
    stateCode,
    countryCode,
    marketplaceId,
    tagId,
    sortBy,
    sortDir,
    page,
    pageSize
  );
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "packages List", data: result.data });
  }
});
exports.fullfillmentList = expressAsyncHandler(async (req, res) => {
  const {
    fulfillmentId,
    orderId,
    orderNumber,
    trackingNumber,
    recipientName,
    createDateStart,
    createDateEnd,
    shipDateStart,
    shipDateEnd,
    sortBy,
    sortDir,
    page,
    pageSize,
  } = req.query;
  const result = await service.fullfillmentList(
    fulfillmentId,
    orderId,
    orderNumber,
    trackingNumber,
    recipientName,
    createDateStart,
    createDateEnd,
    shipDateStart,
    shipDateEnd,
    sortBy,
    sortDir,
    page,
    pageSize
  );
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "packages List", data: result.data });
  }
});
exports.productDetails = expressAsyncHandler(async (req, res) => {
  const { productId } = req.query;
  const result = await service.productDetails(productId);
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "packages List", data: result.data });
  }
});
exports.productList = expressAsyncHandler(async (req, res) => {
  const {
    sku,
    name,
    productCategoryId,
    productTypeId,
    tagId,
    startDate,
    endDate,
  } = req.query;
  const result = await service.productList(
    sku,
    name,
    productCategoryId,
    productTypeId,
    tagId,
    startDate,
    endDate
  );
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "packages List", data: result.data });
  }
});
exports.updateProduct = expressAsyncHandler(async (req, res) => {
  const {
    sku,
    name,
    productCategoryId,
    productTypeId,
    tagId,
    startDate,
    endDate,
  } = req.query;
  const result = await service.updateProduct(
    sku,
    name,
    productCategoryId,
    productTypeId,
    tagId,
    startDate,
    endDate
  );
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "packages List", data: result.data });
  }
});
exports.createLabel = expressAsyncHandler(async (req, res) => {
  let {
    carrierCode,
    serviceCode,
    packageCode,
    confirmation,
    shipDate,
    weight,
    dimensions,
    shipFrom,
    shipTo,
    insuranceOptions,
    internationalOptions,
    advancedOptions,
    testLabel,
  } = req.body;
  //shipDate = Date.now();
  const result = await service.createLable(
    carrierCode,
    serviceCode,
    packageCode,
    confirmation,
    shipDate,
    weight,
    dimensions,
    shipFrom,
    shipTo,
    insuranceOptions,
    internationalOptions,
    advancedOptions,
    testLabel
  );
  if (result) {
    return res.status(result.status).send({ msg: "result", data: result.data });
  } else {
    return res.status(400).send({ msg: "error occured" });
  }
});
exports.getRates = expressAsyncHandler(async (req, res) => {
  let {
    carrierCode,
    serviceCode,
    fromPostalCode,
    fromCity,
    fromState,
    fromWarehouseId,
    toState,
    toCountry,
    toPostalCode,
    toCity,
    weight,
    dimensions,
    confirmation,
    residential,
  } = req.body;
  if (
    !carrierCode ||
    !fromPostalCode ||
    !toCountry ||
    !toPostalCode ||
    !weight
  ) {
    return res.status(400).send({
      msg: "carrierCode or fromPostalCode or toCountry or toPostalCode or weight is missing",
    });
  }
  const result = await service.createLable(
    carrierCode,
    serviceCode,
    fromPostalCode,
    fromCity,
    fromState,
    fromWarehouseId,
    toState,
    toCountry,
    toPostalCode,
    toCity,
    weight,
    dimensions,
    confirmation,
    residential
  );
  if (result) {
    return res.status(200).send({ msg: "order created", data: result });
  }
});
exports.shipmentList = expressAsyncHandler(async (req, res) => {
  let {
    recipientName,
    recipientCountryCode,
    orderNumber,
    orderId,
    carrierCode,
    serviceCode,
    trackingNumber,
    customsCountryCode,
    createDateStart,
    createDateEnd,
    shipDateStart,
    shipDateEnd,
    voidDateStart,
    voidDateEnd,
    storeId,
    includeShipmentItems,
    sortBy,
    sortDir,
    page,
    pageSize,
  } = req.query;

  const result = await service.shipmentList(
    recipientName,
    recipientCountryCode,
    orderNumber,
    orderId,
    carrierCode,
    serviceCode,
    trackingNumber,
    customsCountryCode,
    createDateStart,
    createDateEnd,
    shipDateStart,
    shipDateEnd,
    voidDateStart,
    voidDateEnd,
    storeId,
    includeShipmentItems,
    sortBy,
    sortDir,
    page,
    pageSize
  );

  if (result) {
    return res.status(result.status).send({ msg: "list", data: result.data });
  } else {
    return res.status(400).send({ msg: "order created" });
  }
});
exports.shipmentVoid = expressAsyncHandler(async (req, res) => {
  let { shipmentId } = req.query;

  const result = await service.shipmentVoid(shipmentId);
  if (result) {
    return res.status(200).send({ msg: "order created", data: result });
  } else {
    return res.status(400).send({ msg: "error" });
  }
});

//STORES
exports.deactivate = expressAsyncHandler(async (req, res) => {
  let { storeId } = req.body;

  const result = await service.deactivate(storeId);
  if (result) {
    return res.status(200).send({ msg: "store deactivated", data: result });
  } else {
    return res.status(400).send({ msg: "error" });
  }
});
exports.getRefreshStatus = expressAsyncHandler(async (req, res) => {
  let { storeId } = req.query;

  const result = await service.getRefreshStatus(storeId);
  if (result) {
    return res.status(200).send({ msg: "store status", data: result });
  } else {
    return res.status(400).send({ msg: "error" });
  }
});
exports.getStoreInfo = expressAsyncHandler(async (req, res) => {
  let { storeId } = req.query;

  const result = await service.getStoreInfo(storeId);
  if (result) {
    return res.status(200).send({ msg: "store status", data: result });
  } else {
    return res.status(400).send({ msg: "error" });
  }
});
exports.listMarketPlaces = expressAsyncHandler(async (req, res) => {
  const result = await service.listMarketPlaces();
  if (result) {
    return res.status(200).send({ msg: "store status", data: result });
  } else {
    return res.status(400).send({ msg: "error" });
  }
});
exports.listStores = expressAsyncHandler(async (req, res) => {
  const { showInactive, marketplaceId } = req.query;
  const result = await service.listStores(showInactive, marketplaceId);
  if (result) {
    return res.status(200).send({ msg: "store status", data: result });
  } else {
    return res.status(400).send({ msg: "error" });
  }
});
exports.reactivateStore = expressAsyncHandler(async (req, res) => {
  const { storeId } = req.body;
  const result = await service.reactivateStore(storeId);
  if (result) {
    return res.status(200).send({ msg: "store status", data: result });
  } else {
    return res.status(400).send({ msg: "error" });
  }
});
exports.RefreshAStore = expressAsyncHandler(async (req, res) => {
  const { storeId, refreshDate } = req.body;
  const result = await service.RefreshAStore(storeId, refreshDate);
  if (result) {
    return res.status(200).send({ msg: "store status", data: result });
  } else {
    return res.status(400).send({ msg: "error" });
  }
});
exports.listUsers = expressAsyncHandler(async (req, res) => {
  const { showInactive } = req.query;
  const result = await service.listUsers(showInactive);
  if (result) {
    return res.status(200).send({ msg: "store status", data: result });
  } else {
    return res.status(400).send({ msg: "error" });
  }
});

exports.packageTrack = expressAsyncHandler(async (req, res) => {
  //let tracking;
  let customers = await custModel.find({
    status: { $nin: ["delivered", "prospect"] },
  });
  console.log(customers.length);
  // Map all customer _ids
  const customerIds = customers.map((customer) => customer._id);

  console.log(customerIds); // Output the array of customer _ids
  // Find tracking numbers associated with the customers
  let trackingNumbers = await labelModel.find({
    customer: { $in: customerIds },
    testLabel: false,
  });

  console.log(trackingNumbers.length); // Output the array of tracking numbers
  // Iterate over each tracking number and send it to the trackStatus() function
  let results = [];
  for (const tracking of trackingNumbers) {
    const { customer, trackingNumber } = tracking;
    const result = await service.trackStatus(trackingNumber, customer);
    results.push(result);
  }
  res.status(201).send({ data: results });
});
exports.TrackingPackageDetails = expressAsyncHandler(async (req, res) => {
  //let tracking;
  let { customerId } = req.body;
  let customer = await custModel.findOne({
    _id: customerId,
  });
  // Find tracking numbers associated with the customers
  let trackingNumbers = await labelModel.findOne({
    customer: customer._id,
    testLabel: false,
  });
  if (!trackingNumbers) {
    return res.status(400).send({ msg: "No label found" });
  }

  const summary = await service.trackStatus(
    trackingNumbers.trackingNumber,
    customer
  );
  let updatedCustomer;
  if (summary.includes(DELIVERED1) || summary.includes(DELIVERED2)) {
    updatedCustomer = await custModel.findOneAndUpdate(
      { _id: customerId },
      { status: "delivered" },
      { new: true }
    );
  } else if (
    summary.includes(USPSFACILITY1) ||
    summary.includes(USPSFACILITY2)
  ) {
    updatedCustomer = await custModel.findOneAndUpdate(
      { _id: customerId },
      { status: "USPS_Facility" },
      { new: true }
    );
  } else if (summary.includes(INTRANSIT)) {
    updatedCustomer = await custModel.findOneAndUpdate(
      { _id: customerId },
      { status: "inTransit" },
      { new: true }
    );
  }
  res.status(201).send({ data: updatedCustomer });
});
