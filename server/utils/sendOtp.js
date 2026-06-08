const SibApiV3Sdk = require("@getbrevo/brevo");

const sendOtp = async (email, otp) => {
  try {
    const apiInstance =
      new SibApiV3Sdk.TransactionalEmailsApi();

    apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const sendSmtpEmail =
      new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject =
      "Privacy Locker Verification Code";

    sendSmtpEmail.htmlContent = `
      <h2>Email Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This code expires in 10 minutes.</p>
    `;

    sendSmtpEmail.sender = {
      name: "Privacy Locker",
      email: 'sezaldhiman701@gmail.com',
    };

    sendSmtpEmail.to = [
      {
        email,
      },
    ];

    const result =
      await apiInstance.sendTransacEmail(
        sendSmtpEmail
      );

    console.log(
      "BREVO RESPONSE:",
      result
    );

  } catch (err) {
    console.error(
      "BREVO ERROR:",
      err
    );
  }
};

module.exports = sendOtp;