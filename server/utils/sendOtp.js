const { Resend } = require("resend");

const resend = new Resend(
  process.env.RESEND_API_KEY
);

const sendOtp = async (
  email,
  otp
) => {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Privacy Locker Verification Code",
    html: `
      <h2>Your OTP Code</h2>
      <p>${otp}</p>
      <p>Valid for 10 minutes.</p>
    `,
  });
};

module.exports = sendOtp;