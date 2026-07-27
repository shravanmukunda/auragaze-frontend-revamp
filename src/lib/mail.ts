import nodemailer from "nodemailer";

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT ?? "587");
  return nodemailer.createTransport({
    host: requireEnv("SMTP_HOST"),
    port,
    secure: port === 465,
    auth: {
      user: requireEnv("SMTP_USER"),
      pass: requireEnv("SMTP_PASS"),
    },
  });
}

export async function sendMail({ to, subject, html }: SendMailInput) {
  const from = process.env.SMTP_FROM?.trim() || requireEnv("SMTP_USER");
  const transport = createTransport();
  await transport.sendMail({ from, to, subject, html });
}

export function appOrigin() {
  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://localhost:3000"
  );
}
