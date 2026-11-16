import nodemailer from "nodemailer";

let transport = null;
function getTransport() {
  if (transport || !process.env.SMTP_HOST) return transport;
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

// Returns true if an email was sent. Never throws: inquiries are stored regardless.
export async function sendInquiryEmail(inq) {
  const t = getTransport();
  if (!t) return false;
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.INQUIRY_TO || "info@elipsekids.com",
      replyTo: inq.email,
      subject: `Partnership inquiry: ${inq.company}`,
      text: [
        `Name: ${inq.name}`,
        `Brand / Company: ${inq.company}`,
        `Work Email: ${inq.email}`,
        `Category: ${inq.category}`,
        "",
        inq.message,
      ].join("\n"),
    });
    return true;
  } catch (err) {
    console.error("Inquiry email failed:", err.message);
    return false;
  }
}
