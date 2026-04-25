import nodemailer from "nodemailer";

const sendOtpMail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "OTP Verification",

    // 🔹 Minimal text
    text: `Your OTP is: ${otp}`,

    // 🔹 Minimal HTML
    html: `<h2>${otp}</h2>`,
  });
};

export default sendOtpMail;