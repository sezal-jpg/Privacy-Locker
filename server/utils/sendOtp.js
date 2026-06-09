const axios = require("axios");

const sendOtp = async (email, otp) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Privacy Locker",
          email: "sezaldhiman701@gmail.com",
        },

        to: [
          {
            email,
          },
        ],

        subject:
          "Privacy Locker Verification Code",

        htmlContent: `
          <h2>Email Verification</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        `,
      },
      {
        headers: {
          accept: "application/json",
          "api-key":
            process.env.BREVO_API_KEY,
          "content-type":
            "application/json",
        },
      }
    );

    console.log(
      "BREVO RESPONSE:",
      response.data
    );

    return response.data;

  } catch (err) {
    console.error(
      "BREVO ERROR:",
      err.response?.data || err.message
    );

    throw err;
  }
};

module.exports = sendOtp;