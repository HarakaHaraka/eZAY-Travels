import 'server-only';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { config } from './config';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

/**
 * One interface, three transports, chosen by what is configured:
 *
 *   smtp    — Microsoft 365 (SMTP_HOST/PORT/USER/PASS). The primary.
 *   resend  — RESEND_API_KEY, as the alternative.
 *   console — neither configured: logs, and writes the message to
 *             .mail-outbox/ so local development can see what would have gone.
 *
 * The console transport still counts as a successful delivery; a failure to
 * write does not. That matters because the confirmation-document invariant
 * keys off whether delivery threw.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  switch (config.email.transport) {
    case 'smtp':
      return sendViaSmtp(input);
    case 'resend':
      return sendViaResend(input);
    default:
      return sendToOutbox(input);
  }
}

async function sendViaSmtp(input: SendEmailInput): Promise<void> {
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.default.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    // 587 is STARTTLS, not implicit TLS.
    secure: config.email.smtpPort === 465,
    auth: { user: config.email.smtpUser, pass: config.email.smtpPass },
  });

  await transporter.sendMail({
    from: config.email.smtpUser,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });
}

async function sendViaResend(input: SendEmailInput): Promise<void> {
  const { Resend } = await import('resend');
  const resend = new Resend(config.email.resendApiKey);
  const { error } = await resend.emails.send({
    from: config.email.smtpUser || config.email.notifyEmail,
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content.toString('base64'),
    })),
  });
  if (error) {
    throw new Error(`Resend failed: ${error.message ?? JSON.stringify(error)}`);
  }
}

async function sendToOutbox(input: SendEmailInput): Promise<void> {
  const outbox = path.join(process.cwd(), '.mail-outbox');
  await mkdir(outbox, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const slug = input.subject.replace(/[^a-z0-9]+/gi, '-').slice(0, 60);

  await writeFile(
    path.join(outbox, `${stamp}--${slug}.html`),
    `<!-- to: ${input.to} -->\n<!-- subject: ${input.subject} -->\n${input.html}`,
    'utf8'
  );
  for (const attachment of input.attachments ?? []) {
    await writeFile(path.join(outbox, `${stamp}--${attachment.filename}`), attachment.content);
  }
  console.info(`[email:console] to=${input.to} subject="${input.subject}" -> .mail-outbox/`);
}
