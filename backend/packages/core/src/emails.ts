import nodemailer from "nodemailer";
import { getSMTPCredentials } from "./secrets";

let transporter: any;
async function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport(await getSMTPCredentials());
  return transporter;
}

type Email = {
  to: string;
  subject: string;
  html: string;
};
export async function sendEmail(email: Email) {
  const creds = await getSMTPCredentials();
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: creds.from,
    to: email.to,
    subject: email.subject,
    html: email.html,
  });
  console.log("Message sent: %s", info.messageId);
}
