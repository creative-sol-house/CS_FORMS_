import nodemailer, { Transporter } from "nodemailer";

let cached: Transporter | null = null;

function getTransporter(): Transporter {
  if (cached) return cached;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP env vars missing (SMTP_HOST, SMTP_USER, SMTP_PASS)");
  }

  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user, pass },
  });

  return cached;
}

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(opts: MailOptions): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  const transporter = getTransporter();
  
  try {
    const info = await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || opts.html.replace(/<[^>]+>/g, ""),
    });
    console.log(`✅ Email sent to ${opts.to} (Message ID: ${info.messageId})`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${opts.to}:`, error);
    throw error; // Re-throw so the API route knows it failed
  }
}

/* ---------- Shared Layout Wrapper ---------- */
// This ensures every email has the same professional header/footer
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRM Notification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #0f172a; padding: 24px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">CRM Portal</h1>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f1f5f9; padding: 24px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                This is an automated message from your CRM system.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                &copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/* ---------- Template helpers ---------- */

export function passwordRequestAdminEmail(name: string, email: string) {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px; font-weight: 600;">Password Reset Request</h2>
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
      A user has requested a password reset for their account. Please review the details below and update their password in the admin dashboard.
    </p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
          <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">Name</span>
          <span style="display: block; color: #0f172a; font-size: 15px; font-weight: 500;">${name}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px;">
          <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">Email Address</span>
          <span style="display: block; color: #0f172a; font-size: 15px; font-weight: 500;">${email}</span>
        </td>
      </tr>
    </table>

    <a href="https://inquiry.cshouse.net/sol-ad-dash" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 24px; border-radius: 6px;">
      Go to Admin Dashboard
    </a>
  `;
  return {
    subject: `Action Required: Password reset requested by ${name}`,
    html: emailWrapper(content),
  };
}

export function welcomeEmail(name: string, email: string, password: string) {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px; font-weight: 600;">Welcome to the Team, ${name}!</h2>
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
      Your CRM account has been successfully created. Below are your login credentials.
    </p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
          <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">Login Email</span>
          <span style="display: block; color: #0f172a; font-size: 15px; font-weight: 500;">${email}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px;">
          <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;"> Password</span>
          <code style="display: inline-block; background-color: #e2e8f0; color: #0f172a; padding: 6px 10px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: 600;">${password}</code>
        </td>
      </tr>
    </table>

    <a href="https://inquiry.cshouse.net/sol-ad-dash" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 24px; border-radius: 6px;">
      Log In to Your Account
    </a>
  `;
  return {
    subject: "Welcome! Your CRM account is ready",
    html: emailWrapper(content),
  };
}

export function passwordChangedEmail(name: string, newPassword: string) {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px; font-weight: 600;">Password Updated</h2>
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
      Hi ${name}, an administrator has reset your CRM password. Your new  password is below.
    </p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px;">
          <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">New Password</span>
          <code style="display: inline-block; background-color: #e2e8f0; color: #0f172a; padding: 6px 10px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: 600;">${newPassword}</code>
        </td>
      </tr>
    </table>

    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 500;">
        Please log in immediately and change this password to something secure.
      </p>
    </div>

    <a href="https://inquiry.cshouse.net/sol-ad-dash" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 24px; border-radius: 6px;">
      Log In Now
    </a>
  `;
  return {
    subject: "Security Alert: Your password has been reset",
    html: emailWrapper(content),
  };
}

export function leadAssignedEmail(
  name: string,
lead: {
  fullName?: string;
  email?: string;
  phone: string;
  serviceCategory?: string;
  status?: string;
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px; font-weight: 600;">New Lead Assigned</h2>
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
      Hi ${name}, a new lead has been assigned to you. Please review the details below and reach out to the client as soon as possible.
    </p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; width: 50%;">
          <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">Client Name</span>
          <span style="display: block; color: #0f172a; font-size: 15px; font-weight: 500;">${lead.fullName || "Not provided"}</span>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; width: 50%;">
          <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">Service Requested</span>
          <span style="display: block; color: #0f172a; font-size: 15px; font-weight: 500;">${lead.serviceCategory || "N/A"}</span>
        </td>
      </tr>
      <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
  <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">Email</span>
  ${
    lead.email?.trim()
      ? `<a href="mailto:${lead.email}" style="color: #4f46e5; font-size: 15px; font-weight: 500; text-decoration: none;">${lead.email}</a>`
      : `<span style="color: #64748b; font-size: 15px;">Not provided</span>`
  }
</td>
        <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
          <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">Phone</span>
          <a href="tel:${lead.phone}" style="color: #4f46e5; font-size: 15px; font-weight: 500; text-decoration: none;">${lead.phone}</a>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 16px;">
          <span style="display: block; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">Current Status</span>
          <span style="display: inline-block; background-color: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600;">
            ${lead.status || "Pending"}
          </span>
        </td>
      </tr>
    </table>

    <a href="https://inquiry.cshouse.net/sol-ad-dash" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 24px; border-radius: 6px;">
      View Lead in Dashboard
    </a>
  `;
  return {
    subject: `New Lead: ${lead.fullName || "Name not provided"} (${lead.serviceCategory || "General"})`,
    html: emailWrapper(content),
  };
}



export function leadCreatedByDeveloperEmail(
  adminName: string,
  creatorName: string,
  lead: {
    fullName?: string;
    email?: string;
    phone: string;
    serviceCategory?: string;
  }
) {
  const clientName = lead.fullName?.trim() || "Not provided";

  const content = `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;font-weight:600;">New Lead Added by Team Member</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
      Hi ${adminName}, <strong>${creatorName}</strong> just added a new lead from the dashboard.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
      <tr><td style="padding:16px;border-bottom:1px solid #e2e8f0;">
        <span style="display:block;color:#64748b;font-size:12px;text-transform:uppercase;font-weight:600;">Client</span>
        <span style="color:#0f172a;font-size:15px;font-weight:500;">${clientName}</span>
      </td></tr>
  <tr>
  <td style="padding:16px;border-bottom:1px solid #e2e8f0;">
    <span style="display:block;color:#64748b;font-size:12px;text-transform:uppercase;font-weight:600;">Email</span>
    ${
      lead.email?.trim()
        ? `<a href="mailto:${lead.email}" style="color:#4f46e5;">${lead.email}</a>`
        : `<span style="color:#64748b;">Not provided</span>`
    }
  </td>
</tr>
      <tr><td style="padding:16px;border-bottom:1px solid #e2e8f0;">
        <span style="display:block;color:#64748b;font-size:12px;text-transform:uppercase;font-weight:600;">Phone</span>
        <a href="tel:${lead.phone}" style="color:#4f46e5;">${lead.phone}</a>
      </td></tr>
      <tr><td style="padding:16px;">
        <span style="display:block;color:#64748b;font-size:12px;text-transform:uppercase;font-weight:600;">Service</span>
        <span style="color:#0f172a;">${lead.serviceCategory || "N/A"}</span>
      </td></tr>
    </table>
    <a href="https://inquiry.cshouse.net/sol-ad-dash?tab=leads"
       style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;">
      Review in Dashboard
    </a>`;

  return {
    subject: `New lead from ${creatorName}: ${clientName}`,
    html: emailWrapper(content),
  };
}
