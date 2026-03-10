const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, name, otp, purpose = 'verify') => {
  const transporter = createTransporter();

  const subject = purpose === 'verify'
    ? 'Verify your CalorieTrack account'
    : 'Reset your CalorieTrack password';

  const heading = purpose === 'verify'
    ? 'Verify Your Email'
    : 'Password Reset OTP';

  const message = purpose === 'verify'
    ? 'Use the OTP below to verify your email and activate your account.'
    : 'Use the OTP below to reset your password. Do not share this with anyone.';

  const isVerify = purpose === 'verify';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 28px;border-bottom:1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="width:38px;height:38px;background:#16a34a;border-radius:10px;display:inline-block;text-align:center;line-height:38px;">
                      <span style="color:#ffffff;font-size:18px;font-weight:700;">C</span>
                    </div>
                  </td>
                  <td style="vertical-align:middle;padding-left:10px;">
                    <span style="font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">CalorieTrack</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 32px;">

              <!-- Badge -->
              <div style="display:inline-block;background:${isVerify ? '#f0fdf4' : '#fff7ed'};border:1px solid ${isVerify ? '#bbf7d0' : '#fed7aa'};border-radius:100px;padding:4px 14px;margin-bottom:20px;">
                <span style="font-size:12px;font-weight:600;color:${isVerify ? '#15803d' : '#c2410c'};text-transform:uppercase;letter-spacing:0.8px;">
                  ${isVerify ? 'Email Verification' : 'Password Reset'}
                </span>
              </div>

              <h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.4px;line-height:1.2;">
                ${isVerify ? 'Verify your email address' : 'Reset your password'}
              </h1>

              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.7;">
                Hi <strong style="color:#0f172a;">${name}</strong>, ${message}
              </p>

              <!-- OTP Box -->
              <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:28px 24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Your one-time code</p>

                <!-- Individual digit boxes -->
                <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
                  <tr>
                    ${otp.split('').map(digit => `
                    <td style="padding:0 4px;">
                      <div style="width:44px;height:52px;background:#ffffff;border:2px solid #16a34a;border-radius:10px;text-align:center;line-height:52px;font-size:26px;font-weight:700;color:#0f172a;font-family:'Courier New',monospace;">
                        ${digit}
                      </div>
                    </td>`).join('')}
                  </tr>
                </table>

                <p style="margin:18px 0 0;font-size:13px;color:#94a3b8;">
                  This code expires in
                  <strong style="color:#f59e0b;font-weight:600;">10 minutes</strong>
                </p>
              </div>

              <!-- Steps -->
              <div style="background:#f8fafc;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.8px;">How to use this code</p>
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                  1. Go back to the CalorieTrack tab in your browser.<br/>
                  2. Enter the 6-digit code shown above.<br/>
                  3. ${isVerify ? 'Your account will be activated immediately.' : 'You can then set your new password.'}
                </p>
              </div>

              <!-- Warning -->
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                  <strong>Didn't request this?</strong> You can safely ignore this email. Your account will not be affected.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#cbd5e1;">
                Sent by <strong style="color:#94a3b8;">CalorieTrack</strong> · Your nutrition companion
              </p>
              <p style="margin:0;font-size:11px;color:#e2e8f0;">
                © ${new Date().getFullYear()} CalorieTrack. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html
  });
};

module.exports = { generateOTP, sendOTPEmail };
