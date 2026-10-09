import 'server-only';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { company, config } from './config';

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
 * One interface, four transports, chosen by what is configured:
 *
 *   graph   — Microsoft 365 via the Graph API (MS_GRAPH_TENANT_ID / CLIENT_ID /
 *             CLIENT_SECRET). The primary: Microsoft has retired password
 *             (SMTP AUTH) sending on tenants, and this needs no DNS changes.
 *   smtp    — SMTP_HOST/PORT/USER/PASS, for a server that still allows it.
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
    case 'graph':
      return sendViaGraph(input);
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
    from: `${company.tradingName} <${config.email.fromAddress}>`,
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
    from: `${company.tradingName} <${config.email.fromAddress}>`,
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

/**
 * Microsoft Graph, app-only (client credentials). The app registration needs
 * the APPLICATION permission Mail.Send with admin consent; the message is sent
 * as the mailbox named by EMAIL_FROM (a shared mailbox is fine).
 */
async function sendViaGraph(input: SendEmailInput): Promise<void> {
  const { tenantId, clientId, clientSecret } = config.email.graph;
  const from = config.email.fromAddress;

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    }
  );
  if (!tokenResponse.ok) {
    throw new Error(`Graph sign-in failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
  }
  const { access_token: token } = (await tokenResponse.json()) as { access_token: string };

  const sendResponse = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject: input.subject,
          body: { contentType: 'HTML', content: input.html },
          from: { emailAddress: { address: from, name: company.tradingName } },
          toRecipients: [{ emailAddress: { address: input.to } }],
          attachments: input.attachments?.map((a) => ({
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: a.filename,
            contentBytes: a.content.toString('base64'),
          })),
        },
        saveToSentItems: true,
      }),
    }
  );
  if (!sendResponse.ok) {
    throw new Error(`Graph send failed: ${sendResponse.status} ${await sendResponse.text()}`);
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
