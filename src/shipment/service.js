const mongoose = require("mongoose");
const axios = require("axios");
const xml2js = require("xml2js");

const service = {
  getList: async () => {
    const url = "https://ssapi.shipstation.com/carriers";
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
  carrierInfo: async (carrierCode) => {
    const url = `https://ssapi.shipstation.com/carriers/getcarrier?carrierCode=${carrierCode}`;
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
  pakagesList: async (carrierCode) => {
    const url = `https://ssapi.shipstation.com/carriers/listpackages?carrierCode=${carrierCode}`;
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
  listServices: async (carrierCode) => {
    const url = `https://ssapi.shipstation.com/carriers/listservices?carrierCode=${carrierCode}`;
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
  addFund: async (carrierCode, amount) => {
    const body = {
      carrierCode: carrierCode,
      amount: amount,
    };
    const url = `https://ssapi.shipstation.com/carriers/addfunds`;
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
  customerList: async (
    stateCode,
    countryCode,
    marketplaceId,
    tagId,
    sortBy,
    sortDir,
    page,
    pageSize
  ) => {
    const addQueryParam = (param, value) => (value ? `${param}=${value}` : "");

    // Construct the URL with the required parameters
    const url =
      `https://ssapi.shipstation.com/customers?` +
      `${addQueryParam("stateCode", stateCode)}` +
      `${addQueryParam("countryCode", countryCode)}` +
      `${addQueryParam("tagId", tagId)}` +
      `${addQueryParam("marketplaceId", marketplaceId)}` +
      `${addQueryParam("sortBy", sortBy)}` +
      `${addQueryParam("sortDir", sortDir)}` +
      `${addQueryParam("page", page)}` +
      `${addQueryParam("pageSize", pageSize)}`;

    console.log(url);
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
  CustomerInfo: async (customerId) => {
    const body = {
      carrierCode: carrierCode,
      amount: amount,
    };
    const url = `https://ssapi.shipstation.com/customers/${customerId}`;
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
  fullfillmentList: async (
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
  ) => {
    const addQueryParam = (param, value) => (value ? `${param}=${value}` : "");

    // Construct the URL with the required parameters
    const url =
      `https://ssapi.shipstation.com/fulfillments?` +
      `${addQueryParam("fulfillmentId", fulfillmentId)}` +
      `${addQueryParam("orderId", orderId)}` +
      `${addQueryParam("orderNumber", orderNumber)}` +
      `${addQueryParam("trackingNumber", trackingNumber)}` +
      `${addQueryParam("recipientName", recipientName)}` +
      `${addQueryParam("createDateStart", createDateStart)}` +
      `${addQueryParam("shipDateStart", shipDateStart)}` +
      `${addQueryParam("sortBy", sortBy)}` +
      `${addQueryParam("sortDir", sortDir)}`;
    `${addQueryParam("pageSize", pageSize)}`;

    console.log(url);
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
  productDetails: async (productId) => {
    const url = `https://ssapi.shipstation.com/products/${productId}`;

    console.log(url);
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
  productList: async (
    sku,
    name,
    productCategoryId,
    productTypeId,
    tagId,
    startDate,
    endDate,
    sortBy,
    sortDir,
    page,
    pageSize,
    showInactive
  ) => {
    const addQueryParam = (param, value) => (value ? `${param}=${value}` : "");

    // Construct the URL with the required parameters
    const url =
      `https://ssapi.shipstation.com/products?` +
      `${addQueryParam("sku", sku)}` +
      `${addQueryParam("name", name)}` +
      `${addQueryParam("productCategoryId", productCategoryId)}` +
      `${addQueryParam("productTypeId", productTypeId)}` +
      `${addQueryParam("tagId", tagId)}` +
      `${addQueryParam("startDate", startDate)}` +
      `${addQueryParam("endDate", endDate)}` +
      `${addQueryParam("sortBy", sortBy)}` +
      `${addQueryParam("endDate", endDate)}` +
      `${addQueryParam("sortDir", sortDir)}` +
      `${addQueryParam("page", page)}` +
      `${addQueryParam("pageSize", pageSize)}` +
      `${addQueryParam("showInactive", showInactive)}`;

    console.log(url);
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
  createLable: async (
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
  ) => {
    const body = {
      carrierCode: carrierCode,
      serviceCode: serviceCode,
      packageCode: packageCode,
      confirmation: confirmation,
      shipDate: shipDate,
      weight: weight,
      dimensions: dimensions,
      shipFrom: shipFrom,
      shipTo: shipTo,
      insuranceOptions: insuranceOptions,
      internationalOptions: internationalOptions,
      advancedOptions: advancedOptions,
      testLabel: testLabel,
    };
    console.log(body);
    const url = `https://ssapi.shipstation.com/shipments/createlabel`;
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
  shipmentList: async (
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
  ) => {
    const addQueryParam = (param, value) => (value ? `&${param}=${value}` : "");

    // Construct the URL with the required parameters
    const url =
      `https://ssapi.shipstation.com/shipments?` +
      `${addQueryParam("recipientName", recipientName)}` +
      `${addQueryParam("recipientCountryCode", recipientCountryCode)}` +
      `${addQueryParam("orderNumber", orderNumber)}` +
      `${addQueryParam("orderId", orderId)}` +
      `${addQueryParam("carrierCode", carrierCode)}` +
      `${addQueryParam("serviceCode", serviceCode)}` +
      `${addQueryParam("trackingNumber", trackingNumber)}` +
      `${addQueryParam("customsCountryCode", customsCountryCode)}` +
      `${addQueryParam("createDateStart", createDateStart)}` +
      `${addQueryParam("createDateEnd", createDateEnd)}` +
      `${addQueryParam("shipDateStart", shipDateStart)}` +
      `${addQueryParam("shipDateEnd", shipDateEnd)}` +
      `${addQueryParam("voidDateStart", voidDateStart)}` +
      `${addQueryParam("voidDateEnd", voidDateEnd)}` +
      `${addQueryParam("storeId", storeId)}` +
      `${addQueryParam("includeShipmentItems", includeShipmentItems)}` +
      `${addQueryParam("sortBy", sortBy)}` +
      `${addQueryParam("sortDir", sortDir)}` +
      `${addQueryParam("page", page)}` +
      `${addQueryParam("pageSize", pageSize)}`;

    console.log(url);
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
  shipmentVoid: async (shipmentId) => {
    const body = {
      shipmentId: shipmentId,
    };
    // Construct the URL with the required parameters
    const url = `https://ssapi.shipstation.com/shipments/voidlabel`;

    console.log(url);
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
  deactivate: async (storeId) => {
    const body = {
      shipmentId: storeId,
    };
    // Construct the URL with the required parameters
    const url = `https://ssapi.shipstation.com/stores/deactivate`;

    console.log(url);
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
  getRefreshStatus: async (storeId) => {
    // Construct the URL with the required parameters
    const url = `https://ssapi.shipstation.com/stores/getrefreshstatus?storeId=${storeId}`;

    console.log(url);
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
  getStoreInfo: async (storeId) => {
    // Construct the URL with the required parameters
    const url = `https://ssapi.shipstation.com/stores/${storeId}`;

    console.log(url);
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
  listMarketPlaces: async () => {
    // Construct the URL with the required parameters
    const url = `https://ssapi.shipstation.com/stores/marketplaces`;

    console.log(url);
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
  listStores: async (showInactive, marketplaceId) => {
    const addQueryParam = (param, value) => (value ? `${param}=${value}` : "");

    // Construct the URL with the required parameters
    const url =
      `https://ssapi.shipstation.com/stores?` +
      `${addQueryParam("showInactive", showInactive)}` +
      `${addQueryParam("marketplaceId", marketplaceId)}`;

    console.log(url);
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
  reactivateStore: async (storeId) => {
    const body = {
      storeId: storeId,
    };
    // Construct the URL with the required parameters
    const url = `https://ssapi.shipstation.com/stores/reactivate`;

    console.log(url);
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
  reactivateStore: async (storeId, refreshDate) => {
    const body = {
      storeId: storeId,
      refreshDate: refreshDate,
    };
    // Construct the URL with the required parameters
    const url = `https://ssapi.shipstation.com/stores/reactivate`;

    console.log(url);
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
  listUsers: async (showInactive) => {
    const addQueryParam = (param, value) => (value ? `${param}=${value}` : "");

    // Construct the URL with the required parameters
    const url =
      `https://ssapi.shipstation.com/users?` +
      `${addQueryParam("showInactive", showInactive)}`;

    console.log(url);
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
  trackStatus: async (trackingNumber) => {
    const userId = process.env.TRACKING_USERID;
    const trackId = trackingNumber;

    // Construct the XML request
    const xmlData = `<TrackRequest USERID="${userId}" PASSWORD=""><TrackID ID="${trackId}"></TrackID></TrackRequest>`;

    // URL-encode only the XML part of the data
    const encodedXmlData = encodeURIComponent(xmlData);
    const fixedEncodedXmlData = encodedXmlData.replace(/%3D/g, "=");

    // Construct the URL with the fixed encoded XML data
    const apiUrl = `https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=${fixedEncodedXmlData}`;

    console.log(apiUrl);
    //return 0;
    const response = await axios.post(apiUrl);
    console.log(response.data);
    const xmlResponse = response.data;
    const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
      explicitArray: false,
    });
    console.log("summary", parsedResponse.TrackResponse.TrackInfo.TrackSummary);
    return parsedResponse.TrackResponse.TrackInfo.TrackSummary;
  },
};

module.exports = service;
