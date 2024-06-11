const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
var morgan = require("morgan");
const cron = require("node-cron");
const swaggerAutogen = require("swagger-autogen")();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json"); // Corrected import statement

// Serve Swagger documentation
// Import the generated Swagger JSON file

var cors = require("cors");
const path = require("path");
const basicAuth = require("./src/middleware/authMiddleware");
const bannerRouter = require("./src/banners/router");
const moduleRouter = require("./src/rolePermission/ModuleRouter");
const subModuleRouter = require("./src/rolePermission/subModuleRouter");
const roleRouter = require("./src/rolePermission/roleRouter");
const adminUserRouter = require("./src/adminUser/adminUserRouter");
const userGroupRouter = require("./src/userGroup/userGroupRouter");
const userRouter = require("./src/user/router");
const serviceAreaRouter = require("./src/serviceArea/router");
const globalErrorHandler = require("./src/middleware/globalErrorHandler");
const acpProgramsRouter = require("./src/acpPrograms/router");
const planRouter = require("./src/plan/router");
const serviceRouter = require("./src/order/router");
const orderRouter = require("./src/order/router");
const superAdminPanelRole = require("./src/superAdminPanelRole/router");
const superAdminPanelUserRouter = require("./src/superAdminPanelUser/router");
const serviceProviderRouter = require("./src/serviceProvider/router");
const carrierRouter = require("./src/carrier/router");
const assignCarrierRouter = require("./src/assignCarrier/router");
const deviceInventoryRouter = require("./src/deviceInventory/router");
const simInventoryRouter = require("./src/simInventory/router");
const billingRouter = require("./src/billing/billingRouter");
const companyRouter = require("./src/company/router");
const middlewareCompanyRouter = require("./src/middlewareCompany/router");
const logs = require("./src/middleware/loggerMiddlerware");
const logModel = require("./src/logs/model");
const dashboardRouter = require("./src/dashboard/router");
const selfEnrollmentRouter = require("./src/userSelfEnrollment/router");
const SMSRouter = require("./src/SMS/SMSRouter");
const usaDataRouter = require("./src/utils/usaData");
const permissionRouter = require("./src/rolePermission/permissionRouter");
const mailerRoute = require("./src/companyMailCredential/companyMailRouter");
const networkTypeRouter = require("./src/network/networkRoutes");
const simTypeRouter = require("./src/SimType/simTypeRoutes");
const inventoryTypeRouter = require("./src/inventoryType/inventoryTypeRoutes");
const billingModelRouter = require("./src/billingModel/billingModelRoutes");
const deviceOSRouter = require("./src/operatingSystem/operatingSystemRoutes");
const dataCapableRouter = require("./src/deviceDataCapable/dataCapableRoutes");
const gradeRouter = require("./src/deviceGrade/gradeRoutes");
const deviceTypeRouter = require("./src/deviceType/deviceTypeRoutes");
const imeiTypeRouter = require("./src/imeiType/imeiTypeRoutes");
const addDeviceRouter = require("./src/addDeviceInventory/router");
const zipCodeRouter = require("./src/zipCodes/zipCodesRouter");
const roleHeirarchyRouter = require("./src/roleHeirarchy/roleHeirarchyRoute");
const deparmentRouter = require("./src/departments/departmentRoutes");
const eligibilityCodesRouter = require("./src/eligibilityProgramecode/router");
const sacNumberRouter = require("./src/sacNumber/sacRouter");
const esnNberRouter = require("./src/EsnNumbers/Routes");
const gsmNberRouter = require("./src/GsmInventory/Routes");
const teamRoute = require("./src/Office/router");
const noteTypeRoute = require("./src/NoteType/noteRoute");
const noteRoute = require("./src/notes/noteRoute");
const search = require("./src/search/searchRoutes");
const make = require("./src/makedevice/makeroutes");
const uploadfile = require("./src/uploadfiles/router");
const discount = require("./src/discount/router");
const shipment = require("./src/shipment/router");
const feature = require("./src/additionalFeatures/router");
const invoice = require("./src/invoices/invoicerouter");
const invoiceType = require("./src/invoiceType/invoiceTypeRoutes");
const paymentMethod = require("./src/paymentMethod/router");

//manage vendors
const manageVendors = require("./src/manageVendors/routes");
// Bulk Downloads
const bulkDownloads = require("./src/bulkDownloads/routes");
const invoicesDownloads = require("./src/InvoicesDownloads/routes");
const inventoryDownloads = require("./src/inventoryDownloads/routes");
// Reports Download
const reportDownload = require("./src/reportDownload/router");
const apiAuthRoutes = require("./src/ApiAuth/apiAuthRoutes");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected");

  // Example: Listen for custom events
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    // Broadcast the message to all connected clients
    io.emit("chat message", msg);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
//app.use(basicAuth);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       callback(null, true);
//     },
//     credentials: true,
//   })
// );
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "X-Requested-With");
//   next();
// });
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE"); // Include PATCH here
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });
// app.enableCors();
dotenv.config();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(logs);
require("./src/config/db");
const port = process.env.PORT || 2023;
//hit routes
app.use((req, res, next) => {
  console.log(`Route called: ${req.originalUrl}`);
  next();
});
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "uploads")));
//app.use(decryptData);//Cipher
//app.use(limiter); //Limit IP Requests
//cors
// var corOptions = {
//   origin: "*",
// };
app.use(morgan("dev"));
//logger
// Set EJS as the view engine
app.set("view engine", "ejs");

// Set the views directory to your template file location
app.set("views", path.join(__dirname, "views"));
//web routes
app.use("/api/web/module", moduleRouter);
app.use("/api/web/subModule", subModuleRouter);
app.use("/api/web/role", roleRouter);
app.use("/api/web/user", adminUserRouter);
//app.use("/api/web/customer", userRouter);
app.use("/api/web/group", userGroupRouter);
app.use("/api/web/serviceArea", serviceAreaRouter);
app.use("/api/web/acpPrograms", acpProgramsRouter);
app.use("/api/web/plan", planRouter);
app.use("/api/web/service", serviceRouter);
app.use("/api/web/order", orderRouter);
app.use("/api/web/superAdminPanelRole", superAdminPanelRole);
app.use("/api/web/adminPanelUser", superAdminPanelUserRouter);
app.use("/api/web/serviceProvider", serviceProviderRouter);
app.use("/api/web/carrier", carrierRouter);
app.use("/api/web/assignCarrier", assignCarrierRouter);
app.use("/api/web/deviceInventory", deviceInventoryRouter);
app.use("/api/web/simInventory", simInventoryRouter);
app.use("/api/web/billing", billingRouter);
app.use("/api/web/company", companyRouter);
app.use("/api/web/middlewareCompany", middlewareCompanyRouter);
app.use("/api/web/dashboard", dashboardRouter);
app.use("/api/web/permission", permissionRouter);
app.use("/api", usaDataRouter);

app.use("/api/user", userRouter);
app.use("/api/enrollment", selfEnrollmentRouter);
app.use("/api/sms", SMSRouter);
app.use("/api/mailer", mailerRoute);
app.use("/api/network", networkTypeRouter);
app.use("/api/simType", simTypeRouter);
app.use("/api/billingModel", billingModelRouter);
app.use("/api/bannerRouter", bannerRouter);
app.use("/api/inventoryType", inventoryTypeRouter);
app.use("/api/deviceOS", deviceOSRouter);
app.use("/api/deviceData", dataCapableRouter);
app.use("/api/grade", gradeRouter);
app.use("/api/deviceType", deviceTypeRouter);
app.use("/api/imeiType", imeiTypeRouter);
app.use("/api/deviceinventory", addDeviceRouter);
app.use("/api/zipCode", zipCodeRouter);
app.use("/api/roleHeirarchy", roleHeirarchyRouter);
app.use("/api/deparments", deparmentRouter);
app.use("/api/eligibilityCodes", eligibilityCodesRouter);
app.use("/api/sac", sacNumberRouter);
app.use("/api/web/tabletInventory", esnNberRouter);
app.use("/api/web/phoneInventory", gsmNberRouter);
app.use("/api/web/team", teamRoute);
app.use("/api/noteType", noteTypeRoute);
app.use("/api/web/notes", noteRoute);
app.use("/api/web/search", search);
app.use("/api/web/make", make);
app.use("/api/web/discount", discount);
app.use("/api/web/uploadfiles", uploadfile);
app.use("/api/web/feature", feature);
app.use("/api/web/invoices", invoice);
app.use("/api/web/invoiceType", invoiceType);
app.use("/api/web/shipment", shipment);
app.use("/api/web/paymentMethod", paymentMethod);
//  manage vendors routes
app.use("/api/web/manageVendors", manageVendors);
// bulk Downloads
app.use("/api/web/bulkDownloads", bulkDownloads);
app.use("/api/web/invoicesDownloads", invoicesDownloads);
app.use("/api/web/inventoryDownloads", inventoryDownloads);
// Reports Download
app.use("/api/web/reportDownload", reportDownload);

app.use("/api/web/auth", apiAuthRoutes);

app.get("/", (req, res, next) => {
  res.status(200).send({ msg: "Welcome To CRM " });
});
const doc = {
  info: {
    title: "CRM",
    description: "CRM API Documentation",
  },
  host: "localhost:2023", // Define your host here
  basePath: "/api/user/",
};

const outputFile = "./swagger-output.json";
const routes = [
  "./src/rolePermission/ModuleRouter.js",
  "./src/rolePermission/subModuleRouter.js",
  "./src/rolePermission/roleRouter.js",
  "./src/adminUser/adminUserRouter.js",
  "./src/userGroup/userGroupRouter.js",
  "./src/user/router.js",
  "./src/serviceArea/router.js",
  "./src/middleware/globalErrorHandler.js",
  "./src/acpPrograms/router.js",
  "./src/plan/router.js",

  "./src/order/router.js",
  "./src/superAdminPanelRole/router.js",
  "./src/superAdminPanelUser/router.js",
  "./src/serviceProvider/router.js",
  "./src/carrier/router.js",
  "./src/deviceInventory/router.js",
  "./src/billing/billingRouter.js",
  "./src/company/router.js",
  "./src/dashboard/router.js",
  "./src/userSelfEnrollment/router.js",
  "./src/SMS/SMSRouter.js",
  "./src/utils/usaData.js",
  "./src/rolePermission/permissionRouter.js",
  "./src/companyMailCredential/companyMailRouter.js",
  "./src/network/networkRoutes.js",
  "./src/SimType/simTypeRoutes.js",
  "./src/inventoryType/inventoryTypeRoutes.js",
  "./src/billingModel/billingModelRoutes.js",
  "./src/operatingSystem/operatingSystemRoutes.js",
  "./src/deviceDataCapable/dataCapableRoutes.js",
  "./src/deviceGrade/gradeRoutes.js",
  "./src/deviceType/deviceTypeRoutes.js",
  "./src/imeiType/imeiTypeRoutes.js",
  "./src/addDeviceInventory/router.js",
  "./src/zipCodes/zipCodesRouter.js",
  "./src/roleHeirarchy/roleHeirarchyRoute.js",
  "./src/departments/departmentRoutes.js",
  "./src/eligibilityProgramecode/router.js",
  "./src/sacNumber/sacRouter.js",
  "./src/EsnNumbers/Routes.js",
  "./src/GsmInventory/Routes.js",
  "./src/Office/router.js",
  "./src/NoteType/noteRoute.js",
  "./src/notes/noteRoute.js",
  "./src/search/searchRoutes.js",
  "./src/makedevice/makeroutes.js",
  "./src/uploadfiles/router.js",
  "./src/discount/router.js",
  "./src/shipment/router.js",
  "./src/additionalFeatures/router.js",
  "./src/invoices/invoicerouter.js",
  "./src/invoiceType/invoiceTypeRoutes.js",
  "./src/paymentMethod/router.js",

  //manage vendors
  "./src/manageVendors/routes.js",
  "./src/bulkDownloads/routes.js",
  // Reports Download
  "./src/reportDownload/router.js",
];

function generateSwaggerDocumentation() {
  try {
    console.log("Generating Swagger documentation...");
    swaggerAutogen(outputFile, routes, doc);
    console.log("Swagger documentation generated successfully.");
  } catch (error) {
    console.error("Error generating Swagger documentation:", error);
  }
}

// Schedule the cron job to run once after every 5 hours
cron.schedule(
  "0 */10 * * *",
  () => {
    generateSwaggerDocumentation();
  },
  { scheduled: true, timezone: "UTC" }
);

// Generate Swagger documentation immediately on server start
// generateSwaggerDocumentation();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use((req, res, next) => {
  res.status(404).send({ msg: "Route Not found" });
});

app.use(globalErrorHandler);
app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
// Export the io instance for use in other modules
module.exports.io = io;
module.exports.server = server;
