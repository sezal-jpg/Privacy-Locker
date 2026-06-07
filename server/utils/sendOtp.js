const { Resend } = require("resend");

const sendOtp = async (email, otp) => {
  const resend = new Resend(
    process.env.RESEND_API_KEY
  );

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Privacy Locker Verification Code",
    html: `
      <h2>Email Verification</h2>
      <h1>${otp}</h1>
      <p>Valid for 10 minutes.</p>
    `,
  });
};

module.exports = sendOtp;