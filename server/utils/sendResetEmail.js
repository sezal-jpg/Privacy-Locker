const axios = require("axios");

const sendResetEmail = async (
  email,
  resetToken
) => {
  const resetLink =
    `https://privacy-locker.onrender.com/reset-password?token=${resetToken}`;

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: "Privacy Locker",
        email: "sezaldhiman701@gmail.com",
      },

      to: [{ email }],

      subject: "Reset Your Password",

      htmlContent: `
        <h2>Password Reset</h2>

        <p>Click below to reset your password:</p>

        <a href="${resetLink}">
          Reset Password
        </a>

        <p>Link expires in 15 minutes.</p>
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
};

module.exports = sendResetEmail;