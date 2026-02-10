// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER, // your gmail
//     pass: process.env.EMAIL_PASS, // app password
//   },
//   debug: true,
// });

// export async function sendAssignmentEmail({
//   to,
//   employeeName,
//   ticketId,
//   note,
// }: {
//   to: string;
//   employeeName: string;
//   ticketId: number;
//   note?: string;
// }) {
//   await transporter.sendMail({
//     from: `"Hospital Support" <${process.env.EMAIL_USER}>`,
//     to,
//     subject: `🛠 New Ticket Assigned (#${ticketId})`,
//     html: `
//       <p>Hello <b>${employeeName}</b>,</p>

//       <p>You have been assigned a new service ticket.</p>

//       <p><b>Ticket ID:</b> ${ticketId}</p>
//       ${note ? `<p><b>Notes:</b> ${note}</p>` : ""}

//       <p>Please log in to the system for details.</p>

//       <br/>
//       <p>— Hospital Admin</p>
//     `,
//   });
// }
