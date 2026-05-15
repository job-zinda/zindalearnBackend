

import nodemailer from "nodemailer";

const sendOtpMail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"Zindalearn" <${process.env.MAIL_FROM}>`,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`,
      html: `
        <div style="font-family: Arial">
          <h2>Your OTP</h2>
          <h1>${otp}</h1>
        </div>
      `,
    });

    console.log("MAIL SENT:", info.messageId);

    return true;
  } catch (err) {
    console.log("MAIL ERROR:", err);
    return false;
  }
};

export default sendOtpMail;