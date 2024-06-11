const nodemailer = require("nodemailer");
const Queue = require("bull");
const SMSModel = require("../SMS/SMSModel");
const templateModel = require("../SMS/templateModel");
const credentialsModel = require("../companyMailCredential/companyMailModel");
const { model } = require("mongoose");
// const mailService = async (processedData, sentBy, count) => {
//   console.log("count: ", count);
//   console.log("processedData: ", processedData);
//   try {
//     const credentials = await credentialsModel.findOne({
//       _id: processedData[0].company,
//       //serviceProvider: processedData[0].company,

//     });
//     if (!credentials) {
//        // if credentisal not exist then send from by-default use credentials from env file
//        console.log("here")
//       const transporter = nodemailer.createTransport({
//         host: process.env.MAILHOST,
//         port: process.env.MAILPORT,
//         secure: false,
//         auth: {
//           user: process.env.MAIL,
//           pass: process.env.MAILPASS,
//         },
//       });

//       let send=0;
//       for (const message of processedData) {
//         console.log("message",message)
//         const mailOptions = {
//           from: process.env.MAIL,
//           to: message.email,
//           subject: message.notification_subject,
//           z: message.message,
//         };
//         const result = await transporter.sendMail(mailOptions);
//         console.log("result: ", result);
//         if (result.accepted.length > 0) {
//           send++; // Increment 'send' only for successfully sent emails
//           await SMSModel.findOneAndUpdate(
//             { _id: message._id },
//             { isSent: true, sentBy: sentBy, status: "Sent" }
//           );
//           console.log("Email sent:", result);
//         } else {
//           console.log("Email not sent:", result);
//         }
//       }
//       console.log("send: ", send);
//       if(count===send){
//         console.log("temeplateId", processedData[0].templateId);
//         await templateModel.findOneAndUpdate({templateId:processedData[0].templateId},{status:"Sent"})
//       }
//       return true;
//     }else{
//       const transporter = nodemailer.createTransport({
//         host: credentials.host,
//         port: credentials.port,
//         secure: false,
//         auth: {
//           user: credentials.email,
//           pass: credentials.password,
//         },
//       });
//       let send = 0;
//       for (const message of processedData) {
//         const mailOptions = {
//           from: credentials.email,
//           to: message.email,
//           subject: "Sim Dispatched",
//           text: message.message,
//         };
//         const result = await transporter.sendMail(mailOptions);
//         console.log("result: ", result);
//         if (result.accepted.length > 0) {
//           send++; // Increment 'send' only for successfully sent emails
//           await SMSModel.findOneAndUpdate(
//             { _id: message._id },
//             { isSent: true, sentBy: sentBy, status: "Sent" }
//           );
//           console.log("Email sent:", result);
//         } else {
//           console.log("Email not sent:", result);
//         }
//       }
//       console.log("send: ", send);
//       if (count === send) {
//         console.log("temeplateId", processedData[0].templateId);
//         await templateModel.findOneAndUpdate(
//           { templateId: processedData[0].templateId },
//           { status: "Sent" }
//         );
//       }
//       return true;
//     }
//   } catch (error) {
//     return false;
//   }
// };

const emailQueue = new Queue("emailQueue", {
  redis: "localhost:6379",
});

// Function to send an email
const sendEmail = async (message) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILHOST,
      port: process.env.MAILPORT,
      secure: false,
      auth: {
        user: process.env.MAIL,
        pass: process.env.MAILPASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL,
      to: message.email,
      subject: message.notification_subject,
      html: message.message,
    };

    const result = await transporter.sendMail(mailOptions);

    return result.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// Function to update SMS status
const updateSMSStatus = async (message, sentBy) => {
  try {
    await SMSModel.findOneAndUpdate(
      { _id: message._id },
      { isSent: true, sentBy: sentBy, status: "Sent" }
    );
    return true;
  } catch (error) {
    console.error("Error updating SMS status:", error);
    return false;
  }
};

// Function to update template status
const updateTemplateStatus = async (templateId) => {
  try {
    await templateModel.findOneAndUpdate(
      { templateId: templateId },
      { status: "Sent" }
    );
    return true;
  } catch (error) {
    console.error("Error updating template status:", error);
    return false;
  }
};

// Process email jobs from the queue
emailQueue.process(async (job) => {
  const { message, sentBy } = job.data;
  const emailSent = await sendEmail(message);
  if (emailSent) {
    await updateSMSStatus(message, sentBy);
  }
});

// Your mailService function that enqueues email sending jobs
const mailService = async (processedData, sentBy, count) => {
  console.log("count:", count);
  console.log("processedData:", processedData);

  try {
    // Enqueue email jobs for processing
    const jobs = processedData.map((message) => {
      return emailQueue.add({ message, sentBy });
    });

    // Wait for all jobs to complete
    await Promise.all(jobs);

    console.log("send:", jobs.length);

    if (count === jobs.length) {
      console.log("templateId:", processedData[0].templateId);
      await updateTemplateStatus(processedData[0].templateId);
    }

    return true;
  } catch (error) {
    console.error("Mail service error:", error);
    return false;
  }
};

module.exports = mailService;
