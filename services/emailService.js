const nodemailer = require('nodemailer');

// ── Transporter Setup (force IPv4 to avoid ECONNREFUSED on IPv6) ──────────────
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,          // STARTTLS on port 587
    family: 4,              // force IPv4
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// ── Shared HTML Wrapper ───────────────────────────────────────────────────────
const wrapHtml = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>WeLink</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6c63ff,#a855f7);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:2px;">WeLink</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:1px;">STARTUP ECOSYSTEM</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;text-align:center;border-top:1px solid #2a2a2a;">
              <p style="margin:0;color:#555;font-size:12px;">© ${new Date().getFullYear()} WeLink · All rights reserved</p>
              <p style="margin:6px 0 0;color:#555;font-size:12px;">This is an automated message. Please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ── Helper: send mail ─────────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from: `"WeLink" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`📧 Email sent → ${to} | Subject: ${subject}`);
    } catch (err) {
        console.error(`❌ Email failed → ${to} | ${err.message}`);
        // Non-fatal: never block the API response because of email failure
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 1 — Startup Submitted (Under Review)
// ─────────────────────────────────────────────────────────────────────────────
const sendStartupSubmittedEmail = async ({ to, startupName }) => {
    const html = wrapHtml(`
        <h2 style="color:#a855f7;margin:0 0 8px;">We've received your submission!</h2>
        <p style="color:#ccc;font-size:15px;margin:0 0 24px;">
            Hi there! Your startup <strong style="color:#fff;">${startupName}</strong> has been successfully submitted to WeLink and is currently <strong style="color:#a855f7;">under review</strong> by our team.
        </p>
        <div style="background:#111;border-left:4px solid #a855f7;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#aaa;font-size:14px;">⏱️ &nbsp;Our team typically reviews submissions within <strong style="color:#fff;">1–3 business days</strong>. We'll notify you as soon as a decision is made.</p>
        </div>
        <p style="color:#888;font-size:13px;margin:0;">Thank you for joining the WeLink ecosystem. We're excited to learn more about <strong style="color:#ccc;">${startupName}</strong>!</p>
    `);
    await sendMail({ to, subject: `We've received "${startupName}" – WeLink`, html });
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 2 — Startup Approved
// ─────────────────────────────────────────────────────────────────────────────
const sendStartupApprovedEmail = async ({ to, startupName }) => {
    const html = wrapHtml(`
        <h2 style="color:#22c55e;margin:0 0 8px;">🎉 Congratulations! You're live!</h2>
        <p style="color:#ccc;font-size:15px;margin:0 0 24px;">
            Great news! Your startup <strong style="color:#fff;">${startupName}</strong> has been <strong style="color:#22c55e;">approved</strong> and is now live on the WeLink platform.
        </p>
        <div style="background:#111;border-left:4px solid #22c55e;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 8px;color:#aaa;font-size:14px;">✅ &nbsp;Your startup is now visible to investors, partners, and the WeLink community.</p>
            <p style="margin:0;color:#aaa;font-size:14px;">📝 &nbsp;You can now create and publish posts to share updates, milestones, and news.</p>
        </div>
        <p style="color:#888;font-size:13px;margin:0;">Log in to your dashboard to manage your startup profile and start posting!</p>
    `);
    await sendMail({ to, subject: `🎉 "${startupName}" is now LIVE on WeLink!`, html });
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 3 — Startup Rejected
// ─────────────────────────────────────────────────────────────────────────────
const sendStartupRejectedEmail = async ({ to, startupName, reason }) => {
    const reasonBlock = reason
        ? `<div style="background:#111;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
               <p style="margin:0;color:#aaa;font-size:14px;"><strong style="color:#fff;">Reason:</strong> ${reason}</p>
           </div>`
        : `<div style="background:#111;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
               <p style="margin:0;color:#aaa;font-size:14px;">Our team reviewed your submission and found that it did not meet our current listing criteria. Please ensure your profile is complete and accurate before resubmitting.</p>
           </div>`;

    const html = wrapHtml(`
        <h2 style="color:#ef4444;margin:0 0 8px;">Update on your submission</h2>
        <p style="color:#ccc;font-size:15px;margin:0 0 24px;">
            Thank you for submitting <strong style="color:#fff;">${startupName}</strong> to WeLink. After careful review, we were unable to approve your startup at this time.
        </p>
        ${reasonBlock}
        <p style="color:#888;font-size:13px;margin:0;">You're welcome to update your profile and resubmit. If you have questions, please reach out to our support team.</p>
    `);
    await sendMail({ to, subject: `Update on your WeLink submission – "${startupName}"`, html });
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 4 — Post Submitted (Under Review)
// ─────────────────────────────────────────────────────────────────────────────
const sendPostSubmittedEmail = async ({ to, startupName, postTitle }) => {
    const html = wrapHtml(`
        <h2 style="color:#a855f7;margin:0 0 8px;">Your post is under review</h2>
        <p style="color:#ccc;font-size:15px;margin:0 0 24px;">
            Your post from <strong style="color:#fff;">${startupName}</strong> has been received and is currently being reviewed by the WeLink team.
        </p>
        <div style="background:#111;border-left:4px solid #a855f7;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 6px;color:#777;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Post Title</p>
            <p style="margin:0;color:#fff;font-size:15px;font-weight:600;">${postTitle || 'Untitled Post'}</p>
        </div>
        <p style="color:#888;font-size:13px;margin:0;">⏱️ We'll notify you once your post has been reviewed. This usually takes less than 24 hours.</p>
    `);
    await sendMail({ to, subject: `Your post is under review – WeLink`, html });
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 5 — Post Approved
// ─────────────────────────────────────────────────────────────────────────────
const sendPostApprovedEmail = async ({ to, startupName, postTitle }) => {
    const html = wrapHtml(`
        <h2 style="color:#22c55e;margin:0 0 8px;">✅ Your post is now live!</h2>
        <p style="color:#ccc;font-size:15px;margin:0 0 24px;">
            Great news! Your post from <strong style="color:#fff;">${startupName}</strong> has been <strong style="color:#22c55e;">approved</strong> and is now visible to the WeLink community.
        </p>
        <div style="background:#111;border-left:4px solid #22c55e;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 6px;color:#777;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Post Title</p>
            <p style="margin:0;color:#fff;font-size:15px;font-weight:600;">${postTitle || 'Untitled Post'}</p>
        </div>
        <p style="color:#888;font-size:13px;margin:0;">Log in to view engagement on your post — votes, comments, and more!</p>
    `);
    await sendMail({ to, subject: `✅ Your post is live on WeLink!`, html });
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL 6 — Post Rejected
// ─────────────────────────────────────────────────────────────────────────────
const sendPostRejectedEmail = async ({ to, startupName, postTitle, reason }) => {
    const reasonBlock = reason
        ? `<div style="background:#111;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
               <p style="margin:0 0 6px;color:#777;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Reason</p>
               <p style="margin:0;color:#aaa;font-size:14px;">${reason}</p>
           </div>`
        : `<div style="background:#111;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
               <p style="margin:0;color:#aaa;font-size:14px;">Your post did not meet our content guidelines. Please review and make the necessary changes before resubmitting.</p>
           </div>`;

    const html = wrapHtml(`
        <h2 style="color:#ef4444;margin:0 0 8px;">Your post could not be published</h2>
        <p style="color:#ccc;font-size:15px;margin:0 0 16px;">
            Your post from <strong style="color:#fff;">${startupName}</strong> was reviewed and could not be approved at this time.
        </p>
        <div style="background:#111;border-radius:8px;padding:16px 20px;margin-bottom:16px;border:1px solid #2a2a2a;">
            <p style="margin:0 0 6px;color:#777;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Post Title</p>
            <p style="margin:0;color:#fff;font-size:15px;font-weight:600;">${postTitle || 'Untitled Post'}</p>
        </div>
        ${reasonBlock}
        <p style="color:#888;font-size:13px;margin:0;">You can edit and resubmit your post from your startup dashboard.</p>
    `);
    await sendMail({ to, subject: `Your post could not be published – WeLink`, html });
};

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    sendStartupSubmittedEmail,
    sendStartupApprovedEmail,
    sendStartupRejectedEmail,
    sendPostSubmittedEmail,
    sendPostApprovedEmail,
    sendPostRejectedEmail,
};
