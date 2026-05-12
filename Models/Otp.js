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



























// import nodemailer from "nodemailer";

// const sendOtpMail = async (email, otp) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.MAIL_HOST,
//     port: Number(process.env.MAIL_PORT),
//     secure: false,
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: `"Zindalearn" <${process.env.MAIL_FROM}>`,
//     to: email,
//     subject: "OTP Verification",
//     text: `Your OTP is: ${otp}`,
//     html: `<h2>${otp}</h2>`,
//   });
// };

// export default sendOtpMail;
































// import nodemailer from "nodemailer";

// const sendOtpMail = async (email, otp) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: process.env.MAIL_HOST,
//       port: Number(process.env.MAIL_PORT),
//       secure: false,
//       auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASS,
//       },

//       connectionTimeout: 60000,
//       greetingTimeout: 60000,
//       socketTimeout: 60000,
//     });

//     await transporter.verify();

//     await transporter.sendMail({
//       from: `"Zindalearn" <${process.env.MAIL_FROM}>`,
//       to: email,
//       subject: "OTP Verification",
//       text: `Your OTP is: ${otp}`,
//       html: `
//         <div style="font-family: Arial, sans-serif;">
//           <h2>OTP Verification</h2>
//           <p>Your OTP is:</p>
//           <h1 style="color:#6c2bd9;">${otp}</h1>
//         </div>
//       `,
//     });

//     console.log("✅ OTP Mail Sent");
//   } catch (error) {
//     console.log("❌ MAIL ERROR:", error);
//     throw error;
//   }
// };

// export default sendOtpMail;




































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