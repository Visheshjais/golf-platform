// ============================================================
// services/emailService.js
// Sends transactional emails via Nodemailer (Gmail or any SMTP)
// ============================================================

const nodemailer = require('nodemailer');

// ── Create reusable transport ─────────────────────────────────
// Using Gmail with App Password (see README for setup)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS, // Gmail App Password (not your real password)
  },
});

/**
 * sendEmail — generic email sender
 * @param {string} to       - recipient email
 * @param {string} subject  - email subject
 * @param {string} html     - HTML body
 */
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from:    `"Golf Charity Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    // Log but don't throw — email failure shouldn't crash the server
    console.error('Email send error:', error.message);
  }
};

// ─── Email templates ──────────────────────────────────────────

/**
 * sendWelcomeEmail — sent after successful registration
 */
const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #C4FF47; background: #050B18; padding: 20px; border-radius: 8px;">
        Welcome to Golf Charity Platform 🏆
      </h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>You're now registered. Subscribe to start entering draws and supporting your chosen charity.</p>
      <a href="${process.env.CLIENT_URL}/subscribe"
         style="background:#C4FF47;color:#050B18;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
        Choose a Plan
      </a>
      <p style="color: #888; margin-top: 30px; font-size: 12px;">Golf Charity Platform</p>
    </div>
  `;
  await sendEmail(user.email, 'Welcome to Golf Charity Platform!', html);
};

/**
 * sendDrawResultsEmail — sent when monthly draw is published
 * @param {object} user
 * @param {object} draw - the Draw document
 * @param {number|null} winAmount - null if didn't win
 */
const sendDrawResultsEmail = async (user, draw, winAmount) => {
  const wonText = winAmount
    ? `🎉 You won <strong>£${winAmount}</strong> this month!`
    : `Better luck next month — keep playing!`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #C4FF47; background: #050B18; padding: 20px; border-radius: 8px;">
        Monthly Draw Results — ${draw.drawMonth}/${draw.drawYear}
      </h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>This month's drawn numbers: <strong>${draw.drawnNumbers.join(' · ')}</strong></p>
      <p>${wonText}</p>
      <a href="${process.env.CLIENT_URL}/draws"
         style="background:#C4FF47;color:#050B18;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
        View Full Results
      </a>
    </div>
  `;
  await sendEmail(user.email, `Draw Results — ${draw.drawMonth}/${draw.drawYear}`, html);
};

/**
 * sendWinnerVerificationEmail — prompts winner to upload proof
 */
const sendWinnerVerificationEmail = async (user, prizeAmount) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #C4FF47; background: #050B18; padding: 20px; border-radius: 8px;">
        🏆 You're a Winner! Upload Your Proof
      </h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Congratulations! You've won <strong>£${prizeAmount}</strong>.</p>
      <p>To claim your prize, please upload a screenshot of your golf platform scores.</p>
      <a href="${process.env.CLIENT_URL}/dashboard?tab=winnings"
         style="background:#C4FF47;color:#050B18;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
        Upload Proof Now
      </a>
    </div>
  `;
  await sendEmail(user.email, '🏆 Claim Your Prize — Upload Proof', html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendDrawResultsEmail,
  sendWinnerVerificationEmail,
};
