/**
 * Email template for Password Reset OTP
 * @param {string} name - User's name
 * @param {string} otp - 6-digit OTP code
 * @returns {string} HTML email template
 */
export function resetOtpEmailTemplate(name, otp) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }
                .content {
                    background-color: white;
                    padding: 30px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .otp-box {
                    background-color: #f0f0f0;
                    padding: 20px;
                    text-align: center;
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #2c3e50;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .warning {
                    color: #e74c3c;
                    font-size: 14px;
                    margin-top: 20px;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 12px;
                    color: #777;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="content">
                    <h2>Password Reset Request</h2>
                    <p>Hello ${name},</p>
                    <p>We received a request to reset your password. Please use the following OTP (One-Time Password) to complete the password reset process:</p>
                    <div class="otp-box">${otp}</div>
                    <p><strong>This OTP is valid for 15 minutes.</strong></p>
                    <p>If you did not request a password reset, please ignore this email. Your account remains secure.</p>
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Our staff will never ask for your OTP.
                    </div>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Hotel Management System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

