const brevo = require("@getbrevo/brevo");

const sendOtp = async (email, otp) => {
  try {
    const apiInstance =
      new brevo.TransactionalEmailsApi();

    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const response =
      await apiInstance.sendTransacEmail({
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
      });

    console.log(
      "BREVO RESPONSE:",
      response
    );

  } catch (err) {
    console.error(
      "BREVO ERROR:",
      err
    );

    throw err;
  }
};

module.exports = sendOtp;