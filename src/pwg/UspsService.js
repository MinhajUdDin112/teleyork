const { default: axios } = require("axios");

const service = {
  uspsAccessToken: async () => {
    const baseURL = "https://api.usps.com/oauth2/v3/token";
    const body = {
      client_id: process.env.USPS_CLIENT_ID,
      client_secret: process.env.USPS_CLIENT_SECRET,
      grant_type: "client_credentials",
    };
    const options = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const apiResponse = await axios
      .post(baseURL, JSON.stringify(body), options)
      .then(async (response) => {
        console.log("usps api response", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return apiResponse;
  },
  uspsStateCity: async (zipCode, access_token) => {
    const baseURL = `https://api.usps.com/addresses/v3/city-state?ZIPCode=${zipCode}`;
    const options = {
      headers: {
        Accept: "application/json",
        "X-User-Id": process.env.USPS_CLIENT_SECRET,
        Authorization: `Bearer ${access_token}`,
      },
    };
    const apiResponse = await axios
      .get(baseURL, options)
      .then(async (response) => {
        console.log("usps api response", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return apiResponse;
  },
  uspsAddressVerify: async (
    access_token,
    streetAddress,
    city,
    state,
    secondaryAddress
  ) => {
    const baseURL = `https://api.usps.com/addresses/v3/zipcode?streetAddress=${streetAddress}&city=${city}&state=${state}&secondaryAddress=${secondaryAddress}`;
    const options = {
      headers: {
        Accept: "application/json",
        "X-User-Id": process.env.USPS_CLIENT_SECRET,
        Authorization: `Bearer ${access_token}`,
      },
    };
    const apiResponse = await axios
      .get(baseURL, options)
      .then(async (response) => {
        console.log("usps api response", response.data);
        return response;
      })
      .catch((error) => {
        // Handle errors here
        return error?.response;
        //return res.status(500).send(error);
      });
    return apiResponse;
  },
};

module.exports = service;
