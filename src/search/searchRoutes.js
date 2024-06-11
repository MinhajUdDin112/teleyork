const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const customerService = require("../user/service");
const custModel = require("../user/model");
const searchModel = require("./searchModel");
const simInventory = require("../simInventory/model");
const adminService = require("../adminUser/adminUserServices");
const searchService = require("./searchService");
const rolemodel = require("../rolePermission/roleModel");
const router = express.Router();

// router.post("/advancesearch", async (req, res) => {
//     try {
//       const { firstName, lastName, email, phoneNumber, address1, address2, city, state, zip, DOB, SSN, esnId, status, carrier, esn, IMEI, applicationId, subscriberId } = req.body;

//       // Build the search query based on the provided fields
//       const searchQuery = {};
//       if (firstName) searchQuery.firstName = firstName;
//       if (lastName) searchQuery.lastName = lastName;
//       if (email) searchQuery.email = email;
//       if (phoneNumber) searchQuery.phoneNumber = phoneNumber;
//       if (address1) searchQuery.address1 = address1;
//       if (address2) searchQuery.address2 = address2;
//       if (city) searchQuery.city = city;
//       if (state) searchQuery.state = state;
//       if (zip) searchQuery.zip = zip;
//       if (DOB) searchQuery.DOB = DOB;
//       if (SSN) searchQuery.SSN = SSN;
//       if (esnId) searchQuery.esnId = esnId;
//       if (status) searchQuery.status = status;
//       if (carrier) searchQuery.carrier = carrier;
//       if (esn) searchQuery.esn = esn;
//       if (IMEI) searchQuery.IMEI = IMEI;
//       if (applicationId) searchQuery.applicationId = applicationId;
//       if (subscriberId) searchQuery.subscriberId = subscriberId;

//       // Add more fields as needed

//       // Perform the search using the built query
//       const searchResults = await custModel.find(searchQuery);

//       res.status(200).json({ msg: "Search results", data: searchResults });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ msg: "Internal Server Error" });
//     }
//   });
router.get(
  "/recent",
  expressAsyncHandler(async (req, res) => {
    try {
      let { userId } = req.query;
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const recentSearches = await searchModel
        .find({
          userId,
          createdAt: { $gte: twentyFourHoursAgo },
        })
        .populate("serviceProvider")
        .populate("customerId")
        .populate("userId")
        .sort({ createdAt: -1 });

      res.status(200).send({ msg: "Recent searches", data: recentSearches });
    } catch (error) {
      console.error(error);
      res.status(500).send({ msg: "Internal Server Error" });
    }
  })
);
router.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    let { query, userId } = req.query;
    let { permissions } = req.body;
    let customerResults;
    const User = await adminService.getByUserID(userId);
    const userRole = User.role.role; //get user role
    // Define the modules to fetch
    const modulesToFetch = [
      "Lifeline Orders",
      "Prepaid Orders",
      "Postpaid Orders",
    ];

    // Call the filterPermissions function to get permissions for the specified modules
    const fetchedPermissions = filterPermissions(permissions, modulesToFetch);

    console.log(fetchedPermissions);
    //return 0;

    const trimmedQuery = query.replace(/\s/g, "");

    if (query.includes("ETC") || query.includes("etc")) {
      console.log("here");
      // If the query includes "ETC," assume it's an enrollmentId
      customerResults = await searchService.getsearchData(User, query);
    } else if (trimmedQuery.length === 10 && !isNaN(trimmedQuery)) {
      // If the query is a 10-digit number, assume it's a phoneNumber
      customerResults = await searchService.getsearchData(User, query);
    } else if (trimmedQuery.length === 6 && !isNaN(trimmedQuery)) {
      // If the query is a 10-digit number, assume it's a phoneNumber
      customerResults = await searchService.getsearchData(User, query);
    } else if (query.length > 0) {
      // If the query is not empty, determine whether to search for both names or just one
      const isFullName = query.includes(" ");

      if (isFullName) {
        // Search for both first and last names
        customerResults = await searchService.getsearchData(User, query);
      } else {
        // Search for either first name or last name
        customerResults = await searchService.getsearchData(User, query);
      }
      if (!customerResults && trimmedQuery.length > 0) {
        // If no results found, and the query is not empty, assume it's an esn
        customerResults = await searchService.getsearchData(User, query);
      }
      if (!customerResults && trimmedQuery.length > 0) {
        // If no results found, and the query is not empty, assume it's an esn
        customerResults = await searchService.getsearchData(User, query);
      }
      let customersWithPermission = [];

      // Check if customers are found
      if (customerResults && customerResults.length > 0) {
        // Mapping object for account types to module names
        const accountTypeToModule = {
          ACP: "Lifeline Orders",
          Prepaid: "Prepaid Orders",
          Postpaid: "Postpaid Orders",
        };

        // Loop through each customer
        for (const customer of customerResults) {
          const accountType = customer.accountType;

          // Check if the account type is supported
          if (accountType in accountTypeToModule) {
            const moduleName = accountTypeToModule[accountType];

            // Check if the fetched permissions include the corresponding module
            const hasPermission = fetchedPermissions.some(
              (permission) =>
                permission.module === moduleName &&
                permission.subModule.some(
                  (subModule) =>
                    subModule.actions && subModule.actions.length > 0
                )
            );

            // If the customer has the required account type and permission, push it to the array
            if (hasPermission) {
              customersWithPermission.push(customer);
            } else {
              // Customer does not have the required permission or has empty actions array
              console.log(
                `Customer ${customer._id} does not have the required permission or has empty actions array`
              );
            }
          } else {
            // Account type is not supported
            console.log(
              `Customer ${customer._id} account type is not supported`
            );
          }
        }
      }

      // Send the array of customers with permission in the response
      res.status(200).send({
        msg: "Customers with permission",
        data: customersWithPermission,
      });
    }
    if (!customerResults) {
      return res.status(404).send({ msg: "Customer not found" });
    }

    let customersWithPermission = [];

    // Check if customers are found
    if (customerResults && customerResults.length > 0) {
      // Mapping object for account types to module names
      const accountTypeToModule = {
        ACP: "Lifeline Orders",
        Prepaid: "Prepaid Orders",
        Postpaid: "Postpaid Orders",
      };

      // Loop through each customer
      for (const customer of customerResults) {
        const accountType = customer.accountType;

        // Check if the account type is supported
        if (accountType in accountTypeToModule) {
          const moduleName = accountTypeToModule[accountType];

          // Check if the fetched permissions include the corresponding module
          const hasPermission = fetchedPermissions.some(
            (permission) =>
              permission.module === moduleName &&
              permission.subModule.some(
                (subModule) => subModule.actions && subModule.actions.length > 0
              )
          );

          // If the customer has the required account type and permission, push it to the array
          if (hasPermission) {
            customersWithPermission.push(customer);
          } else {
            // Customer does not have the required permission or has empty actions array
            console.log(
              `Customer ${customer._id} does not have the required permission or has empty actions array`
            );
          }
        } else {
          // Account type is not supported
          console.log(`Customer ${customer._id} account type is not supported`);
        }
      }
    }

    // Send the array of customers with permission in the response
    res.status(200).send({
      msg: "Customers with permission",
      data: customersWithPermission,
    });
  })
);

router.get("/searchInventory/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;

    // Check if the identifier is a phone number or ESN number
    const isPhoneNumber = !isNaN(identifier); // Check if the identifier is a number

    let customer;
    if (isPhoneNumber) {
      // Find customer by phone number
      customer = await custModel.findOne({ phoneNumber: identifier });
    } else {
      // Find customer by ESN number
      customer = await custModel.findOne({ esn: identifier });
    }

    if (!customer) {
      return res.status(404).json({ msg: "Inventory not found" });
    }

    const esnId = customer.esnId;

    if (!esnId) {
      return res.status(404).json({ msg: "ESN ID not found for the customer" });
    }

    // Find SIM Inventory by ESN ID
    const esnDetails = await simInventory.findOne({ _id: esnId });

    if (!esnDetails) {
      return res.status(404).json({ msg: "SIM Inventory not found" });
    }

    res.status(200).json({ customer, esnDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.post("/advancesearch", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      contact,
      address1,
      address2,
      city,
      state,
      zip,
      DOB,
      SSN,
      esnId,
      status,
      carrier,
      esn,
      IMEI,
      applicationId,
      accountId,
      subscriberId,
      permissions,
    } = req.body;
    let { userId } = req.query;
    let searchResults;
    console.log(req.body);
    const User = await adminService.getByUserID(userId);
    const userRole = User.role.role; //get user role
    const modulesToFetch = [
      "Lifeline Orders",
      "Prepaid Orders",
      "Postpaid Orders",
    ];

    // Call the filterPermissions function to get permissions for the specified modules
    const fetchedPermissions = filterPermissions(permissions, modulesToFetch);

    console.log(fetchedPermissions);
    // Build the search query based on the provided fields
    const searchQuery = {};

    const addFieldToQuery = (fieldName, value) => {
      console.log(`Adding field to query: ${fieldName}=${value}`);
      if (value) {
        // Handle special cases for ObjectId fields
        if (
          (fieldName === "createdBy" || fieldName === "assignedToUser") &&
          mongoose.Types.ObjectId.isValid(value)
        ) {
          searchQuery[fieldName] = new mongoose.Types.ObjectId(value);
        } else {
          // Use a case-insensitive regex for string fields
          searchQuery[fieldName] =
            typeof value === "string"
              ? { $regex: new RegExp(value, "i") }
              : value;
        }
        console.log("searchQuery", searchQuery);
      }
    };

    const addDateFieldToQuery = (fieldName, value) => {
      console.log(`Original value: ${value}`);
      if (value) {
        // Assuming DOB is an exact match, adjust the date format if needed
        const formattedDOB = convertDateToISOString(value);
        console.log(`Formatted DOB: ${formattedDOB}`);

        // Use MongoDB's date operators for exact match
        searchQuery[fieldName] = { $eq: new Date(formattedDOB) };
      }
    };

    // Add fields to the search query dynamically
    addFieldToQuery("firstName", firstName);
    addFieldToQuery("accountId", accountId);
    addFieldToQuery("lastName", lastName);
    addFieldToQuery("email", email);
    // Direct comparison for contact field
    addFieldToQuery("contact", contact);
    addFieldToQuery("address1", address1);
    addFieldToQuery("address2", address2);
    addFieldToQuery("city", city);
    addFieldToQuery("state", state);
    addFieldToQuery("zip", zip);
    addDateFieldToQuery("DOB", DOB);
    addFieldToQuery("SSN", SSN);
    addFieldToQuery("accountId", esnId);
    addFieldToQuery("status", status);
    addFieldToQuery("carrier", carrier);
    addFieldToQuery("esn", esn);
    addFieldToQuery("IMEI", IMEI);
    addFieldToQuery("applicationId", applicationId);
    addFieldToQuery("subscriberId", subscriberId);
    if (userRole.toUpperCase() === "CSR") {
      //addFieldToQuery("createdBy", userId);
      const userObjectId = new mongoose.Types.ObjectId(User._id);
      const combinedSearchQuery = {
        $or: [
          //{ createdBy: { $in: csrIds } }, // Include CSR enrollments
          { createdBy: userObjectId }, // Include Team Lead's own enrollments
          { isUploaded: true },
        ],
        $and: [
          searchQuery, // Add your existing searchQuery
        ],
      };
      console.log(combinedSearchQuery);
      searchResults = await custModel
        .find(combinedSearchQuery)
        .populate("createdBy", "name")
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });

      // Perform the search using the built query
      //res.status(200).json({ msg: "Search results", data: searchResults });
    } else if (
      userRole.toUpperCase() === "TEAM LEAD" ||
      userRole.toUpperCase() === "CS MANAGER"
    ) {
      const csrUsers = await adminService.getUserReportingTo(userId);
      if (csrUsers.length === 0) {
        return res.status(201).send({
          msg: "enrolments not found as no csr is reporting to this teamlead",
        });
      }
      const userObjectId = new mongoose.Types.ObjectId(User._id);
      const csrIds = csrUsers.map((csr) => csr._id);
      console.log(csrIds);
      const combinedSearchQuery = {
        $or: [
          { createdBy: { $in: csrIds } }, // Include CSR enrollments
          { createdBy: userObjectId }, // Include Team Lead's own enrollments
          { isUploaded: true },
        ],
        $and: [
          searchQuery, // Add your existing searchQuery
        ],
      };

      searchResults = await custModel
        .find(combinedSearchQuery)
        .populate("createdBy", "name")
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });

      // Perform the search using the combined query
      //res.status(200).send({ msg: "Search results", data: searchResults });
    } else if (userRole.toUpperCase() === "QA MANAGER") {
      searchResults = await custModel
        .find({
          $and: [
            searchQuery,
            {
              $or: [
                { isUploaded: true },
                { assignToQa: userId },
                {
                  approval: {
                    $elemMatch: {
                      approved: { $in: [true, false] },
                      level: { $in: [1, 2, 3, 4] },
                    },
                  },
                },
                { approval: { $size: 0 }, level: { $in: [1, 2, 3, 4] } },
              ],
            },
          ],
        })
        .populate("createdBy", "name")
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });
      //const filterResult = filter
      // Perform the search using the built query
      //res.status(200).json({ msg: "Search results", data: searchResults });
    } else if (userRole.toUpperCase() === "PROVISION MANAGER") {
      searchResults = await custModel
        .find({
          $and: [
            searchQuery,
            {
              $or: [
                { assignToQa: userId },
                { isUploaded: true },
                {
                  approval: {
                    $elemMatch: {
                      approved: true,
                      level: { $in: [3, 5, 6] },
                    },
                  },
                },
                { approval: { $size: 0 }, level: { $in: [5, 6] } },
              ],
            },
          ],
        })
        .populate("createdBy", "name")
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });
      //const filterResult = filter
      // Perform the search using the built query
      //res.status(200).json({ msg: "Search results", data: searchResults });
    } else if (userRole.toUpperCase() === "PROVISION AGENT") {
      searchResults = await custModel
        .find({
          $and: [
            searchQuery,
            {
              $or: [
                { assignToQa: userId },
                { isUploaded: true },
                { "approval.approvedBy": userId },
              ],
            },
          ],
        })
        .populate("createdBy", "name")
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });
      //const filterResult = filter
      // Perform the search using the built query
      //res.status(200).json({ msg: "Search results", data: searchResults });
    } else if (userRole.toUpperCase() === "QA AGENT") {
      searchResults = await custModel
        .find({
          $and: [
            searchQuery,
            {
              $or: [
                { assignToQa: userId },
                { "approval.approvedBy": userId },
                { isUploaded: true },
              ],
            },
          ],
        })
        .populate("createdBy", "name")
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });
      //const filterResult = filter
      // Perform the search using the built query
      //res.status(200).json({ msg: "Search results", data: searchResults });
    } else if (
      userRole.toUpperCase() === "CS" ||
      userRole.toUpperCase() === "CS MANAGER"
    ) {
      //addFieldToQuery("createdBy", userId);
      searchResults = await custModel
        .find(searchQuery)
        .populate("createdBy", "name")
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });

      // Perform the search using the built query
      //res.status(200).json({ msg: "Search results", data: searchResults });
    } else {
      searchResults = await custModel
        .find(searchQuery)
        .populate("createdBy", "name")
        .populate({
          path: "assignedToUser",
          populate: { path: "role", select: "role" },
          populate: { path: "department", select: "department" },
          select: "_id name role department",
        });

      // Perform the search using the built query
      //res.status(200).json({ msg: "Search results", data: searchResults });
    }
    if (searchResults) {
      let customersWithPermission = [];

      // Check if customers are found
      if (searchResults && searchResults.length > 0) {
        // Mapping object for account types to module names
        const accountTypeToModule = {
          ACP: "Lifeline Orders",
          Prepaid: "Prepaid Orders",
          Postpaid: "Postpaid Orders",
        };

        // Loop through each customer
        for (const customer of searchResults) {
          const accountType = customer.accountType;

          // Check if the account type is supported
          if (accountType in accountTypeToModule) {
            const moduleName = accountTypeToModule[accountType];

            // Check if the fetched permissions include the corresponding module
            const hasPermission = fetchedPermissions.some(
              (permission) =>
                permission.module === moduleName &&
                permission.subModule.some(
                  (subModule) =>
                    subModule.actions && subModule.actions.length > 0
                )
            );

            // If the customer has the required account type and permission, push it to the array
            if (hasPermission) {
              customersWithPermission.push(customer);
            } else {
              // Customer does not have the required permission or has empty actions array
              console.log(
                `Customer ${customer._id} does not have the required permission or has empty actions array`
              );
            }
          } else {
            // Account type is not supported
            console.log(
              `Customer ${customer._id} account type is not supported`
            );
          }
        }
      }
      res
        .status(200)
        .json({ msg: "Search results", data: customersWithPermission });
    } else {
      res.status(400).json({ msg: "not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

// function convertDateToISOString(dateString) {
//   if (dateString) {
//     const dateObject = new Date(dateString);

//     // Check if the dateObject is a valid date
//     if (!isNaN(dateObject.getTime())) {
//       // Adjust the date format to ensure consistency
//       return dateObject.toISOString().split('T')[0];
//     }
//   }

//   return "";
// }

function convertDateToISOString(dateString) {
  if (dateString) {
    const dateParts = dateString.split("-");

    if (dateParts.length === 3) {
      const [month, day, year] = dateParts;

      // Validate the components of the date
      if (isFinite(year) && isFinite(month) && isFinite(day)) {
        const dateObject = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

        // Check if the dateObject is a valid date
        if (!isNaN(dateObject.getTime())) {
          return dateObject.toISOString(); // Format as "YYYY-MM-DD"
        }
      }
    }
  }

  return "";
}

// Function to filter permissions for specific modules
function filterPermissions(permissions, modulesToFetch) {
  const filteredPermissions = [];

  // Iterate through the permissions array
  permissions.forEach((permission) => {
    // Check if the module is included in the modulesToFetch array
    if (modulesToFetch.includes(permission.module)) {
      // If yes, add it to the filteredPermissions array
      filteredPermissions.push(permission);
    }
  });

  return filteredPermissions;
}

module.exports = router;
