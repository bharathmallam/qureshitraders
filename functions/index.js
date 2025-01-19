/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const https = require("https");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.sendSMS = onRequest({
  cors: ["https://erp-qt.web.app", "http://localhost:3000"],
  maxInstances: 10,
}, async (request, response) => {
  try {
    const {phone, name, amount, date} = request.query;
    logger.info("Sending SMS request", {phone, name, amount, date});

    // Create the params
    const params = new URLSearchParams({
      user: "QureshiTraders_BW",
      pass: "123456",
      sender: "BUZWAP",
      phone: phone,
      text: "transaction_alert",
      params: `${name},${amount},${date}`,
      priority: "wa",
      stype: "normal",
    }).toString();

    // Create a promise-based HTTPS request
    const makeRequest = () => new Promise((resolve, reject) => {
      const options = {
        protocol: "https:",
        hostname: "bhashsms.com",
        path: `/api/sendmsg.php?${params}`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*",
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP Status Code: ${res.statusCode}`));
          }
        });
      });

      req.on("error", (error) => {
        logger.error("Request error:", error);
        reject(error);
      });

      // Set timeout
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.end();
    });

    try {
      const result = await makeRequest();
      logger.info("SMS sent successfully", {response: result});
      response.status(200).json({
        success: true,
        message: "SMS sent successfully",
        data: result,
      });
    } catch (error) {
      throw new Error(`SMS API Error: ${error.message}`);
    }
  } catch (error) {
    logger.error("Error sending SMS:", error);
    response.status(500).json({
      success: false,
      error: error.message || "Failed to send SMS",
    });
  }
});
