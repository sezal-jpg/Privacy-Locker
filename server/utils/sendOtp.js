const axios = require("axios");

const sendOtp = async (email, otp) => {
  try {
     const verifyLink =
  `https://privacy-locker-backend.onrender.com/verify-email?email=${email}&otp=${otp}`;
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
<h2>Welcome to Privacy Locker</h2>

<p>Click the button below to verify your email:</p>

<a
  href="${verifyLink}"
  style="
    background:#2563eb;
    color:white;
    padding:12px 24px;
    border-radius:6px;
    text-decoration:none;
    display:inline-block;
  "
>
  Verify Email
</a>

<p>Or use this OTP:</p>

<h1>${otp}</h1>

<p>This OTP expires in 10 minutes.</p>
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