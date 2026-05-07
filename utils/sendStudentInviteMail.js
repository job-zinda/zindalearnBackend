import nodemailer from "nodemailer";

export default async function sendStudentInviteMail({ to, name, inviteLink }) {
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
    from: `"Zindalearn" <${process.env.MAIL_USER}>`,
    to,
    subject: "You are invited to Zindalearn",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${name},</h2>
        <p>You have been invited to join Zindalearn.</p>
        <p>Click the button below to open your login page.</p>
        <a href="${inviteLink}"
          style="display:inline-block;background:#5c2bc7;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Accept Invite
        </a>
        <p>This invite link will expire in 7 days.</p>
      </div>
    `,
  });
}






























































// import nodemailer from "nodemailer";

// export default async function sendStudentInviteMail({ to, name, inviteLink }) {
//   const mailUser = process.env.MAIL_USER || process.env.EMAIL;
//   const mailPass = process.env.MAIL_PASS || process.env.EMAIL_PASS;

//   const transporter = nodemailer.createTransport({
//     host: process.env.MAIL_HOST || "smtp.gmail.com",
//     port: Number(process.env.MAIL_PORT || 587),
//     secure: false,
//     auth: {
//       user: mailUser,
//       pass: mailPass,
//     },
//   });

//   await transporter.sendMail({
//     from: `"Zindalearn" <${mailUser}>`,
//     to,
//     subject: "You are invited to Zindalearn",
//     html: `
//       <div style="font-family: Arial, sans-serif; line-height: 1.6;">
//         <h2>Hello ${name},</h2>
//         <p>You have been invited to join Zindalearn.</p>
//         <p>Click the button below to open your login page.</p>
//         <a href="${inviteLink}"
//           style="display:inline-block;background:#5c2bc7;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
//           Accept Invite
//         </a>
//         <p>This invite link will expire in 7 days.</p>
//       </div>
//     `,
//   });
// }