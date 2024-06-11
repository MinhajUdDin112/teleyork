const xlsx = require("xlsx");
const CustModel = require("../user/model");
const Report = require("./model");

exports.add = async (req, res) => {
  const {
    reportName,
    startDate,
    endDate,
    dates,
    personalInformation,
    planInformation,
    miscellaneous,
  } = req.body;

  const newReport = new Report({
    reportName,
    startDate,
    endDate,
    dates,
    personalInformation,
    planInformation,
    miscellaneous,
  });

  try {
    const result = await newReport.save();
    const sortedReports = await Report.find().sort({ createdAt: -1 });
    res
      .status(201)
      .json({ msg: "Template Saved Successfully", result, sortedReports });
  } catch (error) {
    res.status(400).json({ error: "Error Saving Template" });
  }
};

exports.getAllData = async (req, res) => {
  try {
    const result = await Report.find().sort({ createdAt: -1 });
    res.status(200).json({ msg: "Data fetched successfully", data: result });
  } catch (error) {
    res.status(400).json({ error: "Error Fetching Data" });
  }
};

exports.getOne = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Report.findById(id);
    if (!data) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.status(200).json({ msg: "Data fetched successfully", data });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.edit = async (req, res) => {
  const {
    reportName,
    startDate,
    endDate,
    dates,
    personalInformation,
    planInformation,
    miscellaneous,
  } = req.body;
  const { id } = req.params;
  try {
    const result = await Report.findByIdAndUpdate(
      id,
      {
        reportName,
        startDate,
        endDate,
        dates,
        personalInformation,
        planInformation,
        miscellaneous,
      },
      { new: true },
      { updatedAt: -1 }
    );
    res.status(200).json({ msg: "Template Updated Successfully" });
  } catch (error) {
    res.status(400).json({ error: "Error updating Template" });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Report.findByIdAndDelete(id);
    res.status(200).json({ msg: "Template Deleted Successfully" });
  } catch (error) {
    res.status(400).json({ error: "Error Deleting Tempalte" });
  }
};

exports.getAllEnrollments = async (req, res) => {
  try {
    let {
      startDate,
      endDate,
      dates = [],
      personalInformation = [],
      planInformation = [],
      miscellaneous = [],
    } = req.body;
    const currentDate = new Date();
    if (startDate && new Date(startDate) > currentDate) {
      return res
        .status(400)
        .send({ error: "Start date cannot be in the future." });
    }

    // Check if endDate is less than startDate
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      return res
        .status(400)
        .send({ error: "End date cannot be earlier than start date." });
    }
    // If endDate is provided but startDate is not, set startDate to a default value
    if (!startDate && endDate) {
      startDate = new Date(0); // Set startDate to the beginning of time
    }

    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Populate the "plan" field
    const enrollments = await CustModel.find(query)
      .populate("plan")
      .populate("createdBy")
      .populate("assignToQa")
      .populate("approvedBy")
      .populate("rejectedBy")
      .populate("carrier")
      .populate("approvedAt")
      .populate("esnId");

    // if (!enrollments || enrollments.length === 0) {
    //   return res
    //     .status(404)
    //     .json({ error: "No enrollments found for the specified criteria." });
    // }

    // console.log("enrollments", enrollments);
    const worksheet = xlsx.utils.book_new();
    const sheetName = "Enrollments";

    const headers = [
      ...dates,
      ...personalInformation,
      ...planInformation,
      ...miscellaneous,
    ];

    const data = [headers];

    enrollments.forEach((enrollment) => {
      const rowData = [
        ...dates.map((field) => {
          // Check if the field belongs to dates or approval
          if (field === "createdAt" && enrollment.createdAt) {
            const createdAt = enrollment.createdAt || "";
            // console.log("createdAt value:", enrollment.createdAt);
            return createdAt;
          } else if (field === "approvedAt" && enrollment.approvedAt) {
            const approvedAt = enrollment.approvedAt || "";
            // console.log("ApprovedAt value:", enrollment.approvedAt);
            return approvedAt;
          } else {
            return enrollment[field] || "";
          }
        }),
        ...personalInformation.map((field) => enrollment[field] || ""),
        ...(enrollment.plan
          ? planInformation.map((field) => {
              if (field === "ESN Number" && enrollment.esn) {
                return enrollment.esn;
              } else if (field === "IMEI Number" && enrollment.IMEI) {
                return enrollment.IMEI;
              } else if (field === "customerId" && enrollment.customerId) {
                return enrollment.customerId;
              } else if (field === "status" && enrollment.status) {
                return enrollment.status;
              } else if (field === "MDN" && enrollment.phoneNumber) {
                return enrollment.phoneNumber;
              } else {
                return enrollment.plan[field] || "";
              }
            })
          : Array(planInformation.length).fill("")),
        ...(enrollment.carrier ? enrollment.carrier.name : ""), // Extract carrier value
        ...(enrollment.assignToQa
          ? miscellaneous.map((field) => {
              if (field === "assignToQa" && enrollment.assignToQa.name) {
                return enrollment.assignToQa.name;
              } else if (field === "createdBy" && enrollment.createdBy.name) {
                return enrollment.createdBy.name;
              } else if (
                field === "approvedBy" &&
                enrollment.approvedBy &&
                enrollment.approvedBy.name
              ) {
                return enrollment.approvedBy.name;
              } else if (
                field === "rejectedBy" &&
                enrollment.rejectedBy &&
                enrollment.rejectedBy.length > 0
              ) {
                return enrollment.rejectedBy
                  .map((rejected) => rejected.name)
                  .join(", ");
              } else {
                return "";
              }
            })
          : ""),
      ];

      // Extracting and populating miscellaneous fields
      const miscellaneousData = miscellaneous
        .filter((field) => field !== "approval") // Exclude "approval" field
        .map((field) => enrollment[field] || "");

      data.push([
        ...rowData,
        ...miscellaneousData, // Add miscellaneous data to the row
      ]);
    });

    const ws = xlsx.utils.aoa_to_sheet(data);
    xlsx.utils.book_append_sheet(worksheet, ws, sheetName);

    const excelFile = xlsx.write(worksheet, { type: "buffer" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Enrollments.xlsx"
    );

    res.send(excelFile);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate Excel file" });
  }
};
