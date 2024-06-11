const { RestClient } = require("@signalwire/compatibility-api");
const SMSModel = require("../SMS/SMSModel");
const templateModel = require("../SMS/templateModel");
const Queue = require("bull");
const cheerio = require("cheerio");
const twilio = require("twilio");

//  const serviceSMS = async (processedData, sentBy, count) => {
//     try {

//         // Initialize Twilio client with your Twilio Account SID and Auth Token
//         const twilioClient = twilio(process.env.SMSSID,process.env.SMSTOKEN );

//         let send = 0;
//         for (const message of processedData) {
//           try {
//             // Send SMS using Twilio
//             await twilioClient.messages.create({
//               body: message.message,
//               from:  '+18444510543', // Twilio phone number
//               to:  '+16192691813', // Recipient's phone number
//             });

//             // Increment 'send' only for successfully sent SMS
//             send++;

//             // Update SMSModel to mark it as sent
//             await SMSModel.findOneAndUpdate(
//               { _id: message._id },
//               { isSent: true, sentBy: sentBy, status: "Sent" }
//             );

//             console.log("SMS sent successfully.");
//           } catch (smsError) {
//             console.error("Error sending SMS:", smsError);
//           }

//           // Similar email sending logic (as in your original code) can be kept here
//         }

//         console.log("send: ", send);

//         if (count === send) {
//           console.log("templateId", processedData[0].templateId);
//           await templateModel.findOneAndUpdate(
//             { templateId: processedData[0].templateId },
//             { status: "Sent" }
//           );
//         }

//         return true;
//       } catch (error) {
//         console.error("Error in mailService:", error);
//         return false;
//       }
// }

const signalwireClient = new RestClient(
  process.env.SW_PROJECT_ID,
  process.env.SW_AUTH_TOKEN,
  { signalwireSpaceUrl: process.env.SPACE_URL }
);
// Create an SMS queue
const smsQueue = new Queue("smsQueue", {
  redis: "localhost:6379", // Replace with your Redis connection URL
});

// Function to send an SMS
const sendSMS = async (message) => {
  console.log("asd");
  try {
    const $ = cheerio.load(message.message);

    let textContent = $("body")
      .html()
      .replace(/<br\s*\/?>/gi, "\n") // Replace <br> tags with newlines
      .replace(/<\/p>/gi, "\n") // Replace closing </p> tags with newlines
      .replace(/(<([^>]+)>)/gi, "") // Remove any remaining HTML tags
      .replace(/(\r\n|\n|\r)/gm, "\n") // Normalize line breaks
      .trim(); // Trim leading and trailing spaces;
    console.log(`+1${message.phone}`);
    await signalwireClient.messages.create({
      from: "+18334358883",
      to: `+1${message.phone}`,
      body: textContent,
    });

    return true;
  } catch (smsError) {
    console.error("Error sending SMS:", smsError);
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

// Process SMS jobs from the queue
smsQueue.process(async (job) => {
  const { message, sentBy } = job.data;

  const smsSent = await sendSMS(message);
  if (smsSent) {
    await updateSMSStatus(message, sentBy);
  }
});

// Your SMS service function that enqueues SMS sending jobs
const serviceSMS = async (processedData, sentBy, count) => {
  try {
    let send = 0;

    for (const message of processedData) {
      try {
        // Enqueue SMS sending jobs
        await smsQueue.add({ message, sentBy });

        // Increment 'send' only for successfully enqueued SMS jobs
        send++;

        console.log("SMS job enqueued successfully.");
      } catch (smsError) {
        console.error("Error enqueuing SMS job:", smsError);
      }

      // Similar logic for updating SMSModel and template status as in your original code
    }

    console.log("send: ", send);

    if (count === send) {
      console.log("templateId", processedData[0].templateId);
      await updateTemplateStatus(processedData[0].templateId);
    }

    return true;
  } catch (error) {
    console.error("Error in smsService:", error);
    return false;
  }
};
module.exports = serviceSMS;
