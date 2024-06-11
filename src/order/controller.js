const expressAsyncHandler = require("express-async-handler");
const service = require("./service");
const { provideSimValidation } = require("./validator");
const ApiError = require("../helpers/apiError");
const userService = require("../user/service");
const deviceServices = require("../deviceInventory/service");
const simServices = require("../simInventory/service");
const userStatus = require("../utils/userStatus");
const billServices = require("../billing/billingServices");
const customer = require("../user/model");
const model = require("./model");
const labelmodel = require("./labelModel");
const company = require("../serviceProvider/model");
const shipment = require("../shipment/service");
const inventoryModel = require("../simInventory/model");

exports.provideSim = expressAsyncHandler(async (req, res, next) => {
  const { serviceProvider, user, esn, mdn, carrier, type, invoiceType } =
    req.body;
  const { error } = provideSimValidation.validate(req.body);
  if (error) {
    return next(new ApiError(error.details[0].message, 400));
  }

  let hasDevice;
  let availabilityMsg;
  const isEnrolled = await userService.completeEnrollmentUser(user);
  if (!isEnrolled) {
    return res.status(400).send({ msg: "Please fist complete enrollment!" });
  }
  if (mdn) {
    const checkDevice = await deviceServices.checkAvailability(
      serviceProvider,
      carrier,
      mdn
    );
    if (!checkDevice) {
      availabilityMsg = "This device is currently not available!";
    } else {
      hasDevice = true;
    }
  } else {
    const checkSim = await simServices.checkAvailability(
      serviceProvider,
      carrier,
      esn
    );
    if (!checkSim) {
      availabilityMsg = "This SIM is currently not available!";
    } else {
      hasDevice = false;
    }
  }
  if (availabilityMsg) {
    return res.status(200).send({ msg: availabilityMsg });
  }
  // console.log(serviceProvider, user, esn, mdn, carrier, type, hasDevice);
  // return;
  const result = await service.provideSim(
    serviceProvider,
    user,
    esn,
    mdn,
    carrier,
    type,
    hasDevice
  );

  if (result) {
    const updateUser = await userService.updateStatus(
      serviceProvider,
      user,
      userStatus.ACTIVE
    );
    if (updateUser) {
      await billServices.createBill(
        serviceProvider,
        user,
        invoiceType,
        updateUser.plan
      );
    }
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

// get by serial number
exports.getByESN = expressAsyncHandler(async (req, res) => {
  const { esn } = req.query;
  const result = await service.getByESN(esn);
  if (result) {
    res.status(200).send({ msg: "Details", data: result });
  } else {
    res.status(404).send({ msg: "Not found" });
  }
});
//device inventory
exports.getByMDN = expressAsyncHandler(async (req, res) => {
  const { mdn } = req.query;
  const result = await deviceServices.getByMDN(mdn);
  if (result) {
    res.status(200).send({ msg: "Details", data: result });
  } else {
    res.status(404).send({ msg: "Not Found!" });
  }
});
// update device by id
exports.updateOrderInfo = expressAsyncHandler(async (req, res) => {
  const { userId, esn, mdn, hasDevice } = req.body;
  const result = await service.update(userId, esn, mdn, hasDevice);
  if (result) {
    res.status(200).send({ msg: "Details updated", data: result });
  } else {
    res.status(400).send({ msg: "Failed!" });
  }
});

exports.userServicesHistory = expressAsyncHandler(async (req, res) => {
  let { userId } = req.query;
  const result = await service.userServicesHistory(userId);
  return res.status(200).send({ msg: "Services history", data: result });
});

exports.order = expressAsyncHandler(async (req, res) => {
  let {
    orderNumber,
    orderKey,
    //orderDate,
    //paymentDate,
    //shipByDate,
    //orderStatus,
    customerId,
    customerUsername,
    customerEmail,
    billTo,
    shipTo,
    items,
    amountPaid,
    taxAmount,
    shippingAmount,
    customerNotes,
    internalNotes,
    gift,
    giftMessage,
    paymentMethod,
    requestedShippingService,
    carrierCode,
    serviceCode,
    packageCode,
    confirmation,
    shipDate,
    weight,
    dimensions,
    insuranceOptions,
    internationalOptions,
    advancedOptions,
    tagIds,
  } = req.body;
  if (!orderNumber) {
    return res.status(400).send({
      msg: "orderNumber required",
    });
  }
  const enrollment = await customer.findOne({ enrollmentId: orderNumber });
  const inventory = await inventoryModel.findOne({ SimNumber: enrollment.esn });
  shipTo = {
    name: `${enrollment.firstName} ${enrollment.lastName}`,
    company: "",
    street1: `${enrollment.address1}`,
    street2: `${enrollment.address2}`,
    street3: "",
    city: `${enrollment.city}`,
    state: `${enrollment.state}`,
    postalCode: `${enrollment.zip}`,
    country: "US",
    phone: `${enrollment.contact}`,
    residential: false,
    addressVerified: "",
  };
  console.log(shipTo);
  const serviceProvider = await company.findById(enrollment.serviceProvider);
  console.log(serviceProvider);
  const addressParts = serviceProvider.address.split(", ");
  const street1 = addressParts[0]; // "1225 Franklin Ave, Suite 325"
  const city = addressParts[2];
  const street2 = addressParts[1];
  billTo = {
    name: serviceProvider.name,
    company: serviceProvider.name,
    street1: street1,
    street2: street2,
    street3: "",
    city: city,
    state: serviceProvider.state,
    postalCode: serviceProvider.zipCode,
    country: serviceProvider.country,
    phone: serviceProvider.phone,
    residential: true,
  };
  advancedOptions = {
    customField1: inventory?.box,
    customField2: inventory?.IMEI ? inventory?.IMEI : enrollment?.esn,
  };
  console.log(advancedOptions);
  const result = await service.order(
    enrollment._id,
    orderNumber,
    // orderKey,
    // orderDate,
    // paymentDate,
    // shipByDate,
    //orderStatus,
    customerId,
    customerUsername,
    customerEmail,
    billTo,
    shipTo,
    items,
    amountPaid,
    taxAmount,
    shippingAmount,
    customerNotes,
    internalNotes,
    gift,
    giftMessage,
    paymentMethod,
    requestedShippingService,
    carrierCode,
    serviceCode,
    packageCode,
    confirmation,
    shipDate,
    weight,
    dimensions,
    insuranceOptions,
    internationalOptions,
    advancedOptions,
    tagIds
  );
  if (result) {
    return res.status(200).send({ msg: "order created", data: result.data });
  } else {
    return res.status(400).send({ msg: "order created", data: result });
  }
});
exports.deleteOrder = expressAsyncHandler(async (req, res) => {
  let { orderId } = req.query;

  const result = await service.deleteOrder(orderId);
  if (result) {
    return res.status(200).send({ msg: "order deleted", data: result });
  } else {
    return res.status(400).send({ msg: "error in deletion", data: result });
  }
});
exports.getOrderById = expressAsyncHandler(async (req, res) => {
  let { orderId } = req.query;

  const result = await service.getOrder(orderId);
  if (result) {
    return res.status(200).send({ msg: "order", data: result.data });
  } else {
    return res.status(400).send({ msg: "error occured" });
  }
});
exports.getOrderByenrollmentId = expressAsyncHandler(async (req, res) => {
  let { enrollmentId } = req.query;

  const result = await service.getOrderByenrollmentId(enrollmentId);
  if (result) {
    return res.status(200).send({ msg: "order", data: result });
  } else {
    return res.status(400).send({ msg: "error occured" });
  }
});
exports.updateOrder = expressAsyncHandler(async (req, res) => {
  let {
    orderId,
    orderNumber,
    orderKey,
    //orderDate,
    //paymentDate,
    //shipByDate,
    //orderStatus,
    customerId,
    customerUsername,
    customerEmail,
    billTo,
    shipTo,
    items,
    amountPaid,
    taxAmount,
    shippingAmount,
    customerNotes,
    internalNotes,
    gift,
    giftMessage,
    paymentMethod,
    requestedShippingService,
    carrierCode,
    serviceCode,
    packageCode,
    confirmation,
    shipDate,
    weight,
    dimensions,
    insuranceOptions,
    internationalOptions,
    advancedOptions,
    tagIds,
  } = req.body;

  const result = await service.updateOrder(
    orderId,
    orderNumber,
    orderKey,
    //orderDate,
    //paymentDate,
    //shipByDate,
    //orderStatus,
    customerId,
    customerUsername,
    customerEmail,
    billTo,
    shipTo,
    items,
    amountPaid,
    taxAmount,
    shippingAmount,
    customerNotes,
    internalNotes,
    gift,
    giftMessage,
    paymentMethod,
    requestedShippingService,
    carrierCode,
    serviceCode,
    packageCode,
    confirmation,
    shipDate,
    weight,
    dimensions,
    insuranceOptions,
    internationalOptions,
    advancedOptions,
    tagIds
  );
  if (result) {
    return res.status(200).send({ msg: "order created", data: result });
  }
});
exports.holdOrder = expressAsyncHandler(async (req, res) => {
  let { orderId, holdUntilDate } = req.body;
  if (!orderId || !holdUntilDate) {
    return res.status.send({ msg: "field missing" });
  }
  if (!isValidDateFormat(holdUntilDate)) {
    holdUntilDate = convertToYYYYMMDD(holdUntilDate);
  }
  const result = await service.holdOrder(orderId, holdUntilDate);
  if (result) {
    return res.status(result.status).send({ msg: "msg", data: result });
  } else {
    return res.status(400).send({ msg: "error" });
  }
});
exports.restoreHoldOrder = expressAsyncHandler(async (req, res) => {
  let { orderId } = req.body;
  if (!orderId) {
    return res.status.send({ msg: "orderId field is missing" });
  }
  const result = await service.restoreHoldOrder(orderId);
  if (result) {
    return res.status(result.status).send({ msg: "msg", data: result });
  } else {
    return res.status(400).send({ msg: "error" });
  }
});
exports.createLable = expressAsyncHandler(async (req, res) => {
  let {
    userId,
    orderId,
    carrierCode,
    serviceCode,
    packageCode,
    confirmation,
    shipDate,
    weight,
    dimensions,
    insuranceOptions,
    internationalOptions,
    advancedOptions,
    testLabel,
  } = req.body;
  console.log(req.body);
  if (!orderId || !userId || testLabel === undefined) {
    return res.status(400).send({ msg: " field is missing" });
  }

  // let label = await labelmodel.findOne({ orderId });
  // if (label) {
  //   return res
  //     .status(400)
  //     .send({ msg: `label already created for orderId ${orderId}` });
  // }
  let order = await model.findOne({ orderId });
  let customer = order.customer;
  if (!carrierCode && !serviceCode) {
    let stampsComCarrier = await shipment.getList();
    carrierCode = stampsComCarrier.data.find(
      (carrier) => carrier.code === "stamps_com"
    );

    carrierCode = carrierCode.code;

    let desiredService = await shipment.listServices(carrierCode);
    serviceCode = desiredService.data.find(
      (service) => service.code === "usps_first_class_mail"
    );
    serviceCode = serviceCode.code;
    console.log("serviceCode", serviceCode);
    console.log("carrierCode", carrierCode);
  }
  const currentDate = new Date(); // or provide a date string, e.g., '2024-02-05'
  shipDate = formatDateToYYYYMMDD(currentDate);

  console.log(shipDate);
  const result = await service.createLable(
    userId,
    customer,
    orderId,
    carrierCode,
    serviceCode,
    // packageCode,
    // confirmation,
    shipDate,
    // weight,
    // dimensions,
    // insuranceOptions,
    // internationalOptions,
    order.advancedOptions,
    testLabel
  );
  if (result) {
    if (result.data.Message === "An error has occurred") {
      return res.status(400).send({
        msg: "An error has occurred",
        data: result.data.ExceptionMessage,
      });
    }
    return res
      .status(result.status)
      .send({ msg: "Label Created Successfully", data: result.data });
  } else {
    return res.status(400).send({ msg: "order created", data: result });
  }
});
exports.assignUser = expressAsyncHandler(async (req, res) => {
  let { orderId, userId } = req.body;

  const result = await service.assignUser(orderId, userId);
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "user assigned", data: result.data });
  } else {
    return res.status(400).send({ msg: "error occured" });
  }
});
exports.unassignUser = expressAsyncHandler(async (req, res) => {
  let { orderId } = req.body;

  const result = await service.unassignUser(orderId);
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "user unassigned", data: result.data });
  } else {
    return res.status(400).send({ msg: "error occured" });
  }
});
exports.listAccountTags = expressAsyncHandler(async (req, res) => {
  const result = await service.listAccountTags();
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "user assigned", data: result.data });
  } else {
    return res.status(400).send({ msg: "error occured" });
  }
});
exports.addTag = expressAsyncHandler(async (req, res) => {
  const { orderId, tagId } = req.body;
  const result = await service.addTag(orderId, tagId);
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "user assigned", data: result.data });
  } else {
    return res.status(400).send({ msg: "error occured" });
  }
});
exports.listOrderByTag = expressAsyncHandler(async (req, res) => {
  const { orderStatus, tagId, page, pageSize } = req.query;
  if (!orderStatus || !tagId) {
    return res.status(400).send({ msg: "orderStatus and tagId required" });
  }
  const result = await service.listOrderByTag(
    orderStatus,
    tagId,
    page,
    pageSize
  );
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "order list by tag", data: result.data });
  } else {
    return res.status(400).send({ msg: "error occured" });
  }
});
exports.listOrders = expressAsyncHandler(async (req, res) => {
  const {
    customerName,
    itemKeyword,
    createDateStart,
    createDateEnd,
    customsCountryCode,
    modifyDateStart,
    modifyDateEnd,
    orderDateStart,
    orderDateEnd,
    orderNumber,
    orderStatus,
    paymentDateStart,
    paymentDateEnd,
    storeId,
    sortBy,
    sortDir,
    page,
    pageSize,
  } = req.query;
  const result = await service.listOrders(
    customerName,
    itemKeyword,
    createDateStart,
    createDateEnd,
    customsCountryCode,
    modifyDateStart,
    modifyDateEnd,
    orderDateStart,
    orderDateEnd,
    orderNumber,
    orderStatus,
    paymentDateStart,
    paymentDateEnd,
    storeId,
    sortBy,
    sortDir,
    page,
    pageSize
  );
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "order list by tag", data: result.data });
  } else {
    return res.status(400).send({ msg: "error occured" });
  }
});
exports.markShipped = expressAsyncHandler(async (req, res) => {
  const {
    orderId,
    carrierCode,
    shipDate,
    trackingNumber,
    notifyCustomer,
    notifySalesChannel,
  } = req.query;
  const result = await service.markShipped(
    orderId,
    carrierCode,
    shipDate,
    trackingNumber,
    notifyCustomer,
    notifySalesChannel
  );
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "marked shiped", data: result.data });
  } else {
    return res.status(400).send({ msg: "error occured" });
  }
});
exports.removeTag = expressAsyncHandler(async (req, res) => {
  const { orderId, tagId } = req.query;
  const result = await service.removeTag(orderId, tagId);
  if (result) {
    return res
      .status(result.status)
      .send({ msg: "tag removed", data: result.data });
  } else {
    return res.status(400).send({ msg: "error occured" });
  }
});
exports.getTrackingNumber = expressAsyncHandler(async (req, res) => {
  try {
    const { customerId } = req.query;
    const result = await labelmodel.findOne({ customer: customerId });
    if (result) {
      return res
        .status(200)
        .send({ msg: "success", data: result.trackingNumber });
    } else {
      return res.status(400).send({ msg: "error occurred" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: "internal server error" });
  }
});

function isValidDateFormat(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateString);
}

function convertToYYYYMMDD(dateString) {
  const timestamp = new Date(dateString);
  const year = timestamp.getFullYear();
  const month = (timestamp.getMonth() + 1).toString().padStart(2, "0");
  const day = timestamp.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateToYYYYMMDD(date) {
  // Ensure the input is a Date object
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  // Get the components of the date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(date.getDate()).padStart(2, "0");

  // Concatenate components to form the "yyyy-mm-dd" format
  const formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}
