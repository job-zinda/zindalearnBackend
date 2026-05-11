// import nodemailer from "nodemailer";

// const sendOtpMail = async (email, otp) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: process.env.EMAIL,
//     to: email,
//     subject: "OTP Verification",

//     // 🔹 Minimal text
//     text: `Your OTP is: ${otp}`,

//     // 🔹 Minimal HTML
//     html: `<h2>${otp}</h2>`,
//   });
// };

// export default sendOtpMail;

















































// import nodemailer from "nodemailer";

// const sendOtpMail = async (email, otp) => {
//   const mailUser = process.env.MAIL_USER || process.env.EMAIL;
//   const mailPass = process.env.MAIL_PASS || process.env.EMAIL_PASS;

//   if (!mailUser || !mailPass) {
//     throw new Error("Mail credentials missing");
//   }

//   const transporter = nodemailer.createTransport({
//     host: process.env.MAIL_HOST || "smtp.gmail.com",
//     port: Number(process.env.MAIL_PORT || 587),
//     secure: false,
//     auth: {
//       user: mailUser,
//       pass: mailPass,
//     },
//     tls: {
//       rejectUnauthorized: false,
//     },
//   });

//   await transporter.sendMail({
//     from: `"Zindalearn" <${mailUser}>`,
//     to: email,
//     subject: "OTP Verification",
//     text: `Your OTP is: ${otp}`,
//     html: `<h2>${otp}</h2>`,
//   });
// };

// export default sendOtpMail;






































// import nodemailer from "nodemailer";

// const sendOtpMail = async (email, otp) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.MAIL_HOST || "smtp-relay.brevo.com",
//     port: Number(process.env.MAIL_PORT || 587),
//     secure: false,
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: `"Zindalearn" <${process.env.MAIL_FROM || process.env.EMAIL}>`,
//     to: email,
//     subject: "OTP Verification",
//     text: `Your OTP is: ${otp}`,
//     html: `<h2>${otp}</h2>`,
//   });
// };

// export default sendOtpMail;



























import nodemailer from "nodemailer";

const sendOtpMail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Zindalearn" <${process.env.MAIL_FROM}>`,
    to: email,
    subject: "OTP Verification",
    text: `Your OTP is: ${otp}`,
    html: `<h2>${otp}</h2>`,
  });
};

export default sendOtpMail;