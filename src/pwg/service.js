const { default: axios } = require("axios");
const xml2js = require("xml2js");
const clec = ` <clec>
             <id>${process.env.PWG_ID}</id>
            <agentUser>
                <username>${process.env.PWG_USERNAME}</username>
                <token>${process.env.PWG_TOKEN}</token>
                <pin>${process.env.PWG_PIN}</pin>
            </agentUser>
        </clec>`;
const service = {
  coverageInformation: async (carrier, zipCode) => {
    //console.log(carrier, zipCode);
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <session>
       ${clec}
    </session>
    <request type="GetCoverage">
        <carrier>${carrier}</carrier>
        <zip>${zipCode}</zip>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  serviceInformation: async (mdn) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
               ${clec}
    </session>
    <request type="GetServiceInfo">
        <mdn>${mdn}</mdn>
        <esn></esn>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      //       const xmlResponse = `<?xml version="1.0" encoding="utf-8"?>
      // <wholeSaleApi
      //     xmlns="http://www.oss.vcarecorporation.com/oss"
      //     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
      //     <session>
      //         <clec>
      //             <id>1004</id>
      //         </clec>
      //         <timestamp>20230622132508</timestamp>
      //     </session>
      //     <response timestamp="20230622132508" status="failure" type="GetServiceInfoResponse">
      //         <errors>
      //             <error>
      //                 <code>909</code>
      //                 <message>MDN does not belong to this vendor</message>
      //             </error>
      //         </errors>
      //     </response>
      // </wholeSaleApi>`;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      console.log(parsedResponse.wholeSaleApi.response);
      const status = parsedResponse.wholeSaleApi.response.$["status"];
      let responseObject;
      if (status === "success") {
        let serviceStatus = parsedResponse.wholeSaleApi.response.status;
        let planEffectiveDate =
          parsedResponse.wholeSaleApi.response.plan.planEffectiveDate;
        const socsArray = parsedResponse.wholeSaleApi.response.socs;

        // Extract 'soc' values from each 'socs' element
        let socValues = socsArray.map((soc) => soc.soc);
        const firstPurchaseBalances =
          parsedResponse.wholeSaleApi.response.BALANCEDETAIL.PURCHASE
            .BALANCES[0];

        // Fetch the 'VALIDTO' date from the first 'BALANCES' element
        let planExpirationDate = firstPurchaseBalances.VALIDTO;
        let talkBalance =
          parsedResponse.wholeSaleApi.response.BALANCEDETAIL.TOTALBALANCE.TALK;
        let textBalance =
          parsedResponse.wholeSaleApi.response.BALANCEDETAIL.TOTALBALANCE.TEXT;
        const dataValueInBytes =
          parsedResponse.wholeSaleApi.response.BALANCEDETAIL.TOTALBALANCE.DATA;
        // Convert DATA value from bytes to megabytes
        let dataBalance = dataValueInBytes / (1024 * 1024);
        console.log(
          `serviceStatus: ${serviceStatus}, \n planEffectiveDate: ${planEffectiveDate}, \n socsArray:${socsArray},\n planExpirationDate:${planExpirationDate},\n talkBalance:${talkBalance},\n textBalance:${textBalance}, \ndataBalance:${dataBalance}`
        );
        responseObject = {
          serviceStatus,
          planEffectiveDate,
          socValues,
          planExpirationDate,
          talkBalance,
          textBalance,
          dataBalance,
        };
        console.log("responseObject", responseObject);
        return responseObject;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(error);
    }
  },
  balanceInformation: async (mdn, pendingBalance) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
              ${clec}
    </session>
      <request type="GETSERVICEINFOONLYOCS">
        <mdn>${mdn}</mdn>
        <esn></esn>
        <pendingBalance>${pendingBalance}</pendingBalance>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  activeESN: async (esn, planId, zipCode, address1, address2, city, state) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
              ${clec}
    </session>
      <request type="Activate">
        <esn>${esn}</esn>
        <planId>${planId}</planId>
        <zip>${zipCode}</zip>
        <language>ENGL</language>
        <e911Address>
            <street1>${address1}</street1>
            <street2>${address2}</street2>
            <city>${city}</city>
            <state>${state}</state>
            <zip>${zipCode}</zip>
        </e911Address>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  requestNewSwapMDN: async (mdn, imei, sim, newZip) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
              ${clec}
    </session>
      <request type="SwapMDN">
        <mdn>${mdn}</mdn>
        <sim>${sim}</sim>
        <imei>${imei}</imei>
        <newZip>${newZip}</newZip>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  requestNewSwapMDN: async (mdn, imei, sim, newZip) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
      <request type="SwapMDN">
        <mdn>${mdn}</mdn>
        <sim>${sim}</sim>
        <imei>${imei}</imei>
        <newZip>${newZip}</newZip>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  swapESNSIM: async (mdn, newESN, oldESN, reuse) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
      <request type="SwapESN">
        <mdn>${mdn}</mdn>
        <newesn>${newESN}</newesn>
        <oldesn>${oldESN}</oldesn>
        <reuse>${reuse}</reuse>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  disconnectMDN: async (mdn, esn) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
       <request type="Disconnect">
        <mdn>${mdn}</mdn>
        <ESN>${esn}</ESN>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  reconnectESN: async (mdn, esn, plan, zipCode) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
        <request type="Reconnect">
        <mdn>${mdn}</mdn>
        <ESN>${esn}</ESN>
        <imei></imei>
        <plan>${plan}</plan>
        <zip>${zipCode}</zip>
        <stateCode></stateCode>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  hotline: async (mdn) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
        <request type="Hotline">
        <mdn>${mdn}</mdn>
        <hotlineNumber>8336527527</hotlineNumber>
        <!--(number you wish to hotline the number to)-->
        <hotlineChargeable>0</hotlineChargeable>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  removeHotline: async (mdn) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
        <request type="RemoveHotline">
        <mdn>${mdn}</mdn>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  purchasePlan: async (mdn, planId) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
       <request type="Purchase">
        <mdn>${mdn}</mdn>
        <planId>${planId}}</planId>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  changePlan: async (mdn, sim, newPlanId) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
       <request type="ChangePlan">
        <mdn>${mdn}</mdn>
        <sim>${sim}</sim>
        <newplanID>${newPlanId}</newplanID>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  cancelPurchase: async (mdn, purchaseId) => {
    try {
      const xmlRequest = `
      <?xml version="1.0" encoding="utf-8"?>
      <wholeSaleApi
          xmlns="http://www.oss.vcarecorporation.com/oss"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
          <session>
              <clec>
                  <id>1004</id>
                  <agentUser>
                      <username>username</username>
                      <token>token</token>
                      <pin>pin</pin>
                  </agentUser>
              </clec>
          </session>
          <request type="CancelPurchase">
              <mdn>${mdn}</mdn>
              <purchaseId>${purchaseId}</purchaseId>
          </request>
      </wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  queryLHR: async (mdn, sim) => {
    try {
      const xmlRequest = `
        <?xml version="1.0" encoding="utf-8"?>
        <wholeSaleApi
            xmlns="http://www.oss.vcarecorporation.com/oss"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
            <session>
            ${clec}
            </session>
              <request type="QueryHLR">
                <mdn>${mdn}</mdn>
                <sim>${sim}</sim>
            </request>
        </wholeSaleApi>
      `;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      console.log(parsedResponse.wholeSaleApi.response);
      const status = parsedResponse.wholeSaleApi.response.$["status"];
      console.log("queryLHR status", status);
      let responseObject;
      if (status === "success") {
        let simStatus = parsedResponse.wholeSaleApi.response.SIMSTATUS;
        console.log("queryLHR simStatus", simStatus);
        responseObject = {
          simStatus,
        };
        console.log("queryLHR responseObject", responseObject);
        return simStatus;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(error);
    }
  },
  voicePasswordReset: async (mdn, sim) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
       <request type="ResetVoicemailPassword">
        <mdn>${mdn}</mdn>
        <sim>${sim}</sim>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  validatePort: async (mdn, sim) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
         <request type="ValidatePort">
        <mdn>${mdn}</mdn>
        <sim>${sim}</sim>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  PortInMDN: async (
    esn,
    planId,
    mdn,
    firstName,
    lastName,
    streetNumber,
    streetName,
    city,
    state,
    zip,
    account,
    password
  ) => {
    try {
      const clec = `<clec>
                        <id>${process.env.PWG_ID}</id>
                        <agentUser>
                            <username>${process.env.PWG_USERNAME}</username>
                            <token>${process.env.PWG_TOKEN}</token>
                            <pin>${process.env.PWG_PIN}</pin>
                        </agentUser>
                    </clec>`;

      const xmlRequest = `
                    <wholeSaleApi xmlns="http://www.oss.vcarecorporation.com/oss" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
                      <session>
                        ${clec}
                      </session>
                      <request type="ActivatePortin">
                        <activityType>Conversion</activityType>
                        <esn>${esn}</esn>
                       
                      
                        <planId>${planId}</planId>
                        <portInfo>
                          <mdn>${mdn}</mdn>
                          <authorizedBy>self</authorizedBy>
                          <billing>
                            <firstName>${firstName}</firstName>
                            <lastName>${lastName}</lastName>
                            <address>
                              <streetNumber>${streetNumber}</streetNumber>
                              <streetName>${streetName}</streetName>
                             
                              
                              <city>${city}</city>
                              <state>${state}</state>
                              <zip>${zip}</zip>
                            </address>
                          </billing>
                          <oldProvider>
                            <account>${account}</account>
                            <password>${password}</password>
                            <esn>${esn}</esn>
                          </oldProvider>
                        </portInfo>
                      </request>
                    </wholeSaleApi>
                  `;

      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });

      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
      throw new Error("Error in PortIn");
    }
  },

  queryCheckOnPort: async (mdn, sim) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
        <request type="QueryPortInStatus">
        <mdn>${mdn}</mdn>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  modifyPort: async (
    mdn,
    esn,
    account,
    password,
    firstName,
    lastName,
    streetName,
    streetNumber,
    city,
    state,
    zip
  ) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
       <request type="ModifyPortIn">
        
        <portInputChanges>
            <mdn>${mdn}</mdn>
            <esn>${esn}</esn>
            <oldProvider>
                <account>${account}</account>
                <password>${password}</password>
               
            </oldProvider>
            <billing>
                <firstName>${firstName}</firstName>
                <lastName>${lastName}</lastName>
                <address>
                    <streetNumber>${streetNumber}</streetNumber>
                    <streetName>${streetName}</streetName>
                    
                    
                    <city>${city}</city>
                    <state>${state}</state>
                    <zip>${zip}</zip>
                </address>
            </billing>
        </portInputChanges>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  cancelPort: async (mdn, sim) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
       <request type="CancelPortIn">
        <mdn>${mdn}</mdn>
        <sim>${sim}</sim>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  adjustBalanceRequest: async (mdn, subscriptionId, amount, expiryDate) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
       <request type="AdjustBalance">
        <mdn>${mdn}</mdn>
        <subscriptionId>${subscriptionId}</subscriptionId>
        <uom>EVENT</uom> (event = sms, second = voice, byte = data)
        <amount>${amount}</amount>
        <expiryDate>${expiryDate}</expiryDate>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  cancelDeviceLocation: async (mdn, esn) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
       <request type="CancelDeviceLocation">
        <mdn>${mdn}</mdn>
        <esn>${esn}</esn>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  queryUsage: async (mdn, esn) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
      <request type="QueryUsage">
        <esn></esn>
        <mdn>${mdn}</mdn>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  validationPortOutEligibility: async (
    mdn,
    sim,
    name,
    ospAccountNumber,
    ospAccountPassword,
    street1,
    city,
    state,
    zip
  ) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
      <request type="ValidatePortOutEligibility">
        <MDN>${mdn}</MDN>
        <SIM>${sim}</SIM>
        <IMEI></IMEI>
        <name>${name}</name>
        <ospAccountNumber>${ospAccountNumber}</ospAccountNumber>
        <ospAccountPassword>${ospAccountPassword}</ospAccountPassword>
        <ospSubscriberAddress>
            <street1>${street1}</street1>
            <street2></street2>
            <city>${city}</city>
            <state>${state}</state>
            <zip>${zip}</zip>
        </ospSubscriberAddress>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  portInWithMSISDN: async (
    mdn,
    newmdn,
    esn,
    planId,
    zip,
    authorizedBy,
    firstName,
    lastName,
    city,
    state,
    addressLine1,
    account,
    password
  ) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
    ${clec}
    </session>
     <request type="PortInWithChangeMSISDN">
        <portInfo>
            <mdn>${mdn}</mdn>
            <newmdn>${newmdn}</newmdn>
            <esn>${esn}</esn>
            <planId>${planId}</planId>
            <zipcode>${zip}</zipcode>
            <authorizedBy>445445</authorizedBy>
            <billing>
                <firstName>${firstName}</firstName>
                <lastName>${lastName}</lastName>
                <address>
                    <addressLine1>${addressLine1}</addressLine1>
                    <addressLine2></addressLine2>
                    <city>${city}</city>
                    <state>${state}</state>
                    <zip>${zip}</zip>
                </address>
            </billing>
            <oldProvider>
                <account>${account}</account>
                <password>${password}</password>
            </oldProvider>
        </portInfo>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  partnerPortOutValidation: async (mdn, sim, MessageCode, Description) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
        <clec>
            <id>${process.env.PWG_ID}</id>
            <agentUser>
                <username>${process.env.PWG_USERNAME}</username>
                <token>${process.env.PWG_TOKEN}</token>
                <pin>${process.env.PWG_PIN}</pin>
                <source>CSR</source>
                <sourceby>${sourceby}</sourceby>
            </agentUser>
        </clec>
    </session>
    <request type="PortOutValidation">
        <mdn>${mdn}</mdn>
        <sim>${sim}</sim>
        <MessageCode>${MessageCode}</MessageCode>
        <Description>${Description}</Description>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  addWFC: async (mdn, street1, street2, city, state, esn, zip) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
        ${clec}
    </session>
    <request type="AddWFC">
        <mdn>${mdn}</mdn>
        <esn>${esn}</esn>
        <e911Address>
            <street1>${street1}</street1>
            <street2>${street2}</street2>
            <city>${city}</city>
            <state>${state}</state>
            <zip>${zip}</zip>
        </e911Address>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  updateE119Address: async (mdn, street1, street2, city, state, esn, zip) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
        ${clec}
    </session>
    <request type="UpdateE911Address">
        <mdn>${mdn}</mdn>
        <esn>${esn}</esn>
        <e911Address>
            <street1>${street1}</street1>
            <street2>${street2}</street2>
            <city>${city}</city>
            <state>${state}</state>
            <zip>${zip}</zip>
        </e911Address>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  getCoverage2: async (carrier, zip) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
        ${clec}
    </session>
     <request type="GetCoverage">
        <carrier>${carrier}</carrier>
        <zip>${zip}</zip>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  querySim: async (esn) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
        ${clec}
    </session>
      <request type="QuerySIM">
        <esn>${esn}</esn>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      console.log(parsedResponse.wholeSaleApi.response);
      const status = parsedResponse.wholeSaleApi.response.$["status"];
      console.log("queryLHR status", status);
      let responseObject;
      if (status === "success") {
        let PUK1 = parsedResponse.wholeSaleApi.response.PUK1;
        let PUK2 = parsedResponse.wholeSaleApi.response.PUK2;
        let ICCIDSTATUS = parsedResponse.wholeSaleApi.response.ICCIDSTATUS;
        responseObject = {
          PUK1,
          PUK2,
          ICCIDSTATUS,
        };
        console.log("queryLHR responseObject", responseObject);
        return responseObject;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(error);
    }
  },
  changeVoiceMailLanguage: async (mdn, esn, language) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi
    xmlns="http://www.oss.vcarecorporation.com/oss"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
        ${clec}
    </session>
       <request type="ResetVoicemailLanguage">
        <mdn>${mdn}</mdn>
        <sim>${sim}</sim>
        <language>${language}</language>
    </request>
</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  serviceInformations: async (mdn) => {
    try {
      const xmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<wholeSaleApi xmlns="http://www.oss.vcarecorporation.com/oss" 
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <session>
       ${clec}
    </session>
    <request type="GetServiceInfo">
<mdn>${mdn}</mdn>
<esn></esn>         
</request>

</wholeSaleApi>
`;
      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });

      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
  QueryNetwork: async (mdn, sim) => {
    try {
      const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
        <wholeSaleApi
            xmlns="http://www.oss.vcarecorporation.com/oss"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
            <session>
                <clec>
                    <id>1004</id>
                    <agentUser>
                        <username>username</username>
                        <token>token</token>
                        <pin>pin</pin>
                    </agentUser>
                </clec>
            </session>
            <request type="QueryNetwork">
                <mdn>${mdn}</mdn>
                <sim>${sim}</sim>
            </request>
        </wholeSaleApi>
      `;

      const response = await axios.post(process.env.PWGURL, xmlRequest, {
        headers: {
          "Content-Type": "text/xml",
        },
      });
      const xmlResponse = response.data;
      const parsedResponse = await xml2js.parseStringPromise(xmlResponse, {
        explicitArray: false,
      });
      return parsedResponse.wholeSaleApi.response;
    } catch (error) {
      console.log(error);
    }
  },
};
module.exports = service;
