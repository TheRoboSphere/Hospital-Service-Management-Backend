// import twilio from "twilio";

// const client = twilio(
//   process.env.TWILIO_SID!,
//   process.env.TWILIO_AUTH_TOKEN!
// );

// export async function sendAssignmentSMS({
//   phone,
//   ticketId,
// }: {
//   phone: string;
//   ticketId: number;
// }) {
//   await client.messages.create({
//     body: `🛠 New ticket assigned to you. Ticket ID: ${ticketId}. Please check dashboard.`,
//     from: process.env.TWILIO_PHONE!,
//     to: phone,
//   });
// }
