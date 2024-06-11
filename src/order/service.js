const { default: mongoose } = require("mongoose");
const model = require("./model");
const labelModel = require("./labelModel");
const simModel = require("../simInventory/model");
const deviceModel = require("../deviceInventory/model");
const axios = require("axios");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const custModel = require("../user/model");
const companyModel = require("../serviceProvider/model");
module.exports = {
  provideSim: async (
    serviceProvider,
    user,
    esn,
    mdn,
    carrier,
    type,
    hasDevice
  ) => {
    const now = new Date();
    let cycleDate = now.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
    });
    cycleDate = new Date(cycleDate);
    cycleDate.setDate(cycleDate.getDate() + 1);
    const data = new model({
      serviceProvider: new mongoose.Types.ObjectId(serviceProvider),
      user: new mongoose.Types.ObjectId(user),
      carrier: new mongoose.Types.ObjectId(carrier),
      type,
      esn,
      mdn,
      hasDevice,
      date: cycleDate,
    });
    const result = await data.save();
    if (result && result.hasDevice === true) {
      await deviceModel.findOneAndUpdate(
        { mdn: mdn, carrier: carrier, serviceProvider: serviceProvider },
        { status: "in_use" },
        { new: true }
      );
    } else {
      await simModel.findOneAndUpdate(
        { mdn: mdn, carrier: carrier, serviceProvider: serviceProvider },
        { status: "in_use" },
        { new: true }
      );
    }
    return result;
  },
  getAll: async (serviceProvider) => {
    const result = await model
      .find({ serviceProvider: serviceProvider })
      .populate("user")
      .populate("carrier");
    return result;
  },
  getByESN: async (esn) => {
    const result = await model.findOne({ esn });
    return result;
  },
  getByMDN: async (mdn) => {
    const result = await model.findOne({ mdn });
    return result;
  },
  userServicesHistory: async (user) => {
    const result = await model.find({ user: { $in: user } });
    return result;
  },
  update: async (userId, esn, mdn, hasDevice) => {
    const result = await model.findOneAndUpdate(
      { user: userId },
      { esn, mdn, hasDevice },
      { new: true }
    );
  },
  order: async (
    customer,
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
  ) => {
    const orderDate = convertToISOFormat(Date.now());

    console.log(orderDate, Date.now());
    //return 0;
    const body = {
      orderNumber: orderNumber,
      orderKey: "",
      orderDate: orderDate,
      paymentDate: null,
      shipByDate: null,
      orderStatus: "awaiting_shipment",
      customerId: customerId,
      customerUsername: customerUsername,
      customerEmail: customerEmail,
      billTo: billTo,
      shipTo: shipTo,
      items: items,
      amountPaid: amountPaid,
      taxAmount: taxAmount,
      shippingAmount: shippingAmount,
      customerNotes: customerNotes,
      internalNotes: internalNotes,
      gift: gift,
      giftMessage: giftMessage,
      paymentMethod: paymentMethod,
      requestedShippingService: requestedShippingService,
      carrierCode: carrierCode,
      serviceCode: serviceCode,
      packageCode: packageCode,
      confirmation: confirmation,
      shipDate: shipDate,
      weight: weight,
      dimensions: dimensions,
      insuranceOptions: insuranceOptions,
      internationalOptions: internationalOptions,
      advancedOptions: advancedOptions,
      tagIds: tagIds,
    };
    console.log(body);
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://ssapi.shipstation.com/orders/createorder`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    //return 0;
    body.customer = customer;
    body.orderId = data.data.orderId;
    if (data.status === 200 || data.status === 201) {
      const order = new model(body);
      const result = await order.save();
      console.log(result);
    }
    return data;
  },
  updateOrder: async (
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
  ) => {
    const body = {
      orderId: orderId,
      orderNumber: orderNumber,
      orderKey: Date.now(),
      orderDate: Date.now(),
      paymentDate: Date.now(),
      shipByDate: Date.now(),
      orderStatus: "awaiting_shipment",
      customerId: customerId,
      customerUsername: customerUsername,
      customerEmail: customerEmail,
      billTo: billTo,
      shipTo: shipTo,
      items: items,
      amountPaid: amountPaid,
      taxAmount: taxAmount,
      shippingAmount: shippingAmount,
      customerNotes: customerNotes,
      internalNotes: internalNotes,
      gift: gift,
      giftMessage: giftMessage,
      paymentMethod: paymentMethod,
      requestedShippingService: requestedShippingService,
      carrierCode: carrierCode,
      serviceCode: serviceCode,
      packageCode: packageCode,
      confirmation: confirmation,
      shipDate: shipDate,
      weight: weight,
      dimensions: dimensions,
      insuranceOptions: insuranceOptions,
      internationalOptions: internationalOptions,
      advancedOptions: advancedOptions,
      tagIds: tagIds,
    };

    // const username = process.env.NLADID;
    // const password = process.env.NLADKEY;
    // Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
    //   "base64"
    // )}`;
    // url = `https://ssapi.shipstation.com/orders/updateorder`;
    // const options = {
    //   headers: {
    //     Authorization: Access_token,
    //     "Content-Type": "application/json",
    //   },
    // };
    // console.log(options);
    // const data = await axios
    //   .post(url, JSON.stringify(body), options)
    //   .then(async (response) => {
    //     console.log("response is", response.data);
    //     return response;
    //   })
    //   .catch((error) => {
    //     // Handle errors here
    //     return error?.response;
    //     //return res.status(500).send(error);
    //   });

    const order = new model({
      orderNumber,
      orderKey,
      orderDate,
      paymentDate,
      shipByDate,
      orderStatus,
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
    });

    const result = await order.save();
    return result;
  },
  createLable: async (
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
    advancedOptions,
    testLabel
  ) => {
    const cust = await custModel.findOne({ _id: customer });
    const company = await companyModel.findById({ _id: cust.serviceProvider });

    let confirmation;
    if (company.name === "Zisfone LLC") {
      if (cust.selectProduct === "SIM") {
        confirmation = "delivery";
      } else {
        confirmation = "signature";
      }
    } else {
      confirmation = "delivery";
    }
    const body = {
      orderId: orderId,
      carrierCode: carrierCode,
      serviceCode: serviceCode,
      packageCode: "package",
      confirmation: confirmation,
      shipDate: shipDate,
      weight: {
        value: 4,
        units: "ounces",
      },
      dimensions: {},
      insuranceOptions: {
        provider: "carrier",
        insureShipment: true,
        insuredValue: 100,
      },
      internationalOptions: null,
      advancedOptions: advancedOptions,
      testLabel: process.env.testLabel,
    };

    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://ssapi.shipstation.com/orders/createlabelfororder`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log("body", body);
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        console.log("response is", error?.response.data);
        return error?.response;
        //return res.status(500).send(error);
      });
    if (data.status === 200 || data.status === 201) {
      body.customer = customer;
      body.shipmentId = data.data.shipmentId;
      body.userId = data.data.userId;
      body.trackingNumber = data.data.trackingNumber;
      body.batchNumber = data.data.batchNumber;
      body.carrierCode = data.data.carrierCode;
      body.serviceCode = data.data.serviceCode;
      body.packageCode = data.data.packageCode;
      body.voided = data.data.voided;
      body.labelData = data.data.labelData;

      const label = new labelModel(body);

      const result = await label.save();
      console.log("saved data:", result);
      await convertionToPDF(data.data.labelData, customer, userId);
    }
    return data;
  },
  deleteOrder: async (orderId) => {
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://ssapi.shipstation.com/orders/${orderId}`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .delete(url, options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });

    const order = new model({
      orderId,
      carrierCode,
      serviceCode,
      confirmation,
      shipDate,
      weight,
      dimensions,
      insuranceOptions,
      internationalOptions,
      advancedOptions,
      tagIds,
    });

    const result = await order.save();
    return result;
  },
  getOrder: async (orderId) => {
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://ssapi.shipstation.com/orders/${orderId}`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .get(url, options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  getOrderByenrollmentId: async (enrollmentId) => {
    const result = await model.findOne({ orderNumber: enrollmentId });
    return result;
  },
  holdOrder: async (orderId, holdUntilDate) => {
    const body = {
      orderId: orderId,
      holdUntilDate: holdUntilDate,
    };
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://ssapi.shipstation.com/orders/holduntil`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  restoreHoldOrder: async (orderId) => {
    const body = {
      orderId: orderId,
    };
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://ssapi.shipstation.com/orders/restorefromhold`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  assignUser: async (orderId, userId) => {
    const body = {
      orderId: orderId,
      userId: userId,
    };
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://ssapi.shipstation.com/orders/assignuser`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  unassignUser: async (orderId) => {
    const body = {
      orderId: orderId,
    };
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://ssapi.shipstation.com/orders/unassignuser`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  listAccountTags: async () => {
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://ssapi.shipstation.com/accounts/listtags`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .get(url, options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  addTag: async (orderId, tagId) => {
    const body = {
      orderId: orderId,
      tagId: tagId,
    };
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://ssapi.shipstation.com/orders/addtag`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  removeTag: async (orderId, tagId) => {
    const body = {
      orderId: orderId,
      tagId: tagId,
    };
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://ssapi.shipstation.com/orders/removetag`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  listOrderByTag: async (orderStatus, tagId, page, pageSize) => {
    const addQueryParam = (param, value) => (value ? `${param}=${value}` : "");
    const url =
      `https://ssapi.shipstation.com/listbytag?` +
      `${addQueryParam("orderStatus", orderStatus)}` +
      `${addQueryParam("tagId", tagId)}` +
      `${addQueryParam("page", page)}` +
      `${addQueryParam("pageSize", pageSize)}`;
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .get(url, options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  listOrders: async (
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
  ) => {
    const addQueryParam = (param, value) => (value ? `${param}=${value}` : "");
    const url =
      `https://ssapi.shipstation.com/orders?` +
      `${addQueryParam("customerName", customerName)}` +
      `${addQueryParam("itemKeyword", itemKeyword)}` +
      `${addQueryParam("createDateStart", createDateStart)}` +
      `${addQueryParam("createDateEnd", createDateEnd)}` +
      `${addQueryParam("customsCountryCode", customsCountryCode)}` +
      `${addQueryParam("modifyDateStart", modifyDateStart)}` +
      `${addQueryParam("modifyDateEnd", modifyDateEnd)}` +
      `${addQueryParam("orderDateStart", orderDateStart)}` +
      `${addQueryParam("orderDateEnd", orderDateEnd)}` +
      `${addQueryParam("orderNumber", orderNumber)}` +
      `${addQueryParam("orderStatus", orderStatus)}` +
      `${addQueryParam("paymentDateStart", paymentDateStart)}` +
      `${addQueryParam("paymentDateEnd", paymentDateEnd)}` +
      `${addQueryParam("storeId", storeId)}` +
      `${addQueryParam("sortBy", sortBy)}` +
      `${addQueryParam("sortDir", sortDir)}` +
      `${addQueryParam("page", page)}` +
      `${addQueryParam("pageSize", pageSize)}`;
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .get(url, options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  listOrders: async (
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
  ) => {
    const url =
      `https://ssapi.shipstation.com/orders?` +
      `${addQueryParam("customerName", customerName)}` +
      `${addQueryParam("itemKeyword", itemKeyword)}` +
      `${addQueryParam("createDateStart", createDateStart)}` +
      `${addQueryParam("createDateEnd", createDateEnd)}` +
      `${addQueryParam("customsCountryCode", customsCountryCode)}` +
      `${addQueryParam("modifyDateStart", modifyDateStart)}` +
      `${addQueryParam("modifyDateEnd", modifyDateEnd)}` +
      `${addQueryParam("orderDateStart", orderDateStart)}` +
      `${addQueryParam("orderDateEnd", orderDateEnd)}` +
      `${addQueryParam("orderNumber", orderNumber)}` +
      `${addQueryParam("orderStatus", orderStatus)}` +
      `${addQueryParam("paymentDateStart", paymentDateStart)}` +
      `${addQueryParam("paymentDateEnd", paymentDateEnd)}` +
      `${addQueryParam("storeId", storeId)}` +
      `${addQueryParam("sortBy", sortBy)}` +
      `${addQueryParam("sortDir", sortDir)}` +
      `${addQueryParam("page", page)}` +
      `${addQueryParam("pageSize", pageSize)}`;
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .get(url, options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
  markShipped: async (
    orderId,
    carrierCode,
    shipDate,
    trackingNumber,
    notifyCustomer,
    notifySalesChannel
  ) => {
    const body = {
      orderId: orderId,
      carrierCode: carrierCode,
      shipDate: shipDate,
      trackingNumber: trackingNumber,
      notifyCustomer: notifyCustomer,
      notifySalesChannel: notifySalesChannel,
    };
    const username = process.env.SHIP_Key;
    const password = process.env.SHIP_Secret;
    Access_token = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;
    url = `https://ssapi.shipstation.com/orders/markasshipped`;
    const options = {
      headers: {
        Authorization: Access_token,
        "Content-Type": "application/json",
      },
    };
    console.log(options);
    const data = await axios
      .post(url, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("response is", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return data;
  },
};

function convertSIDateToYYYYMMDD(date) {
  if (date) {
    const timestamp = new Date(date);

    const year = timestamp.getFullYear();
    const month = (timestamp.getMonth() + 1).toString().padStart(2, "0");
    const day = timestamp.getDate().toString().padStart(2, "0");
    const hours = timestamp.getHours().toString().padStart(2, "0");
    const minutes = timestamp.getMinutes().toString().padStart(2, "0");
    const seconds = timestamp.getSeconds().toString().padStart(2, "0");

    return `${year}-${day}-${month} ${hours}:${minutes}:${seconds}`;
  } else {
    return "";
  }
}

function convertToISOFormat(date) {
  if (date) {
    const timestamp = new Date(date);
    return timestamp.toISOString();
  } else {
    return "";
  }
}

async function convertionToPDF(b64, customerId, userId) {
  try {
    const base64String = b64; // Replace this with your actual Base64 string

    // Output directory for saving the PDF file
    const outputDirectory = "uploads";

    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory);
    }

    // Generate a unique filename for the PDF
    const fileName = `label_${Date.now()}.pdf`;

    // Specify the path to save the PDF
    const outputPath = `${outputDirectory}/${fileName}`;

    // Decode Base64 to a buffer
    const pdfBuffer = Buffer.from(base64String, "base64");

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Create a new buffer to store the modified PDF
    const modifiedBuffer = await pdfDoc.save();

    // Write the modified PDF buffer to the file
    fs.writeFileSync(outputPath, modifiedBuffer);

    console.log(`PDF saved successfully at ${outputPath}`);
    console.log("hereeeeee");
    // Save the PDF path in the database
    const updatedCustomer = await custModel.findOneAndUpdate(
      { _id: customerId },
      {
        $push: {
          files: {
            filetype: "pdf", // Adjust as needed
            filepath: outputPath,
            uploadedBy: userId, // Replace with the actual user ID
            uploadDate: new Date(),
          },
        },
        label: outputPath,
        labelCreatedAt: new Date(),
      },
      { new: true } // To return the updated document
    );

    console.log("Database updated:", updatedCustomer);
  } catch (error) {
    console.error("Error processing PDF:", error);
  }
}
