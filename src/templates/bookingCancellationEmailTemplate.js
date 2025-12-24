/**
 * Email template for Booking Cancellation
 * @param {string} guestName - Guest's name
 * @param {string} roomNumber - Room number
 * @param {string} roomType - Room type
 * @param {string} checkInDate - Check-in date (formatted string)
 * @param {string} checkOutDate - Check-out date (formatted string)
 * @returns {string} HTML email template
 */
export function bookingCancellationEmailTemplate(guestName, roomNumber, roomType, checkInDate, checkOutDate) {
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
                .header {
                    text-align: center;
                    color: #e74c3c;
                    margin-bottom: 20px;
                }
                .booking-details {
                    background-color: #f0f0f0;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #ddd;
                }
                .detail-row:last-child {
                    border-bottom: none;
                }
                .detail-label {
                    font-weight: bold;
                    color: #555;
                }
                .detail-value {
                    color: #2c3e50;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 12px;
                    color: #777;
                    text-align: center;
                }
                .cancel-icon {
                    font-size: 48px;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .info-box {
                    background-color: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="content">
                    <div class="cancel-icon">❌</div>
                    <h2 class="header">Booking Cancellation Confirmation</h2>
                    <p>Hello ${guestName},</p>
                    <p>This email confirms that your booking has been successfully cancelled.</p>
                    
                    <div class="booking-details">
                        <h3>Cancelled Booking Details</h3>
                        <div class="detail-row">
                            <span class="detail-label">Room Number:</span>
                            <span class="detail-value">${roomNumber}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Room Type:</span>
                            <span class="detail-value">${roomType}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Original Check-in Date:</span>
                            <span class="detail-value">${checkInDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Original Check-out Date:</span>
                            <span class="detail-value">${checkOutDate}</span>
                        </div>
                    </div>
                    
                    <div class="info-box">
                        <strong>ℹ️ Note:</strong> If you paid for this booking, any applicable refunds will be processed according to our cancellation policy.
                    </div>
                    
                    <p>We're sorry to see your plans change. We hope to have the opportunity to welcome you in the future.</p>
                    
                    <p>If you have any questions or concerns about this cancellation, please don't hesitate to contact us.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Hotel Management System. All rights reserved.</p>
                    <p>This is an automated email. Please do not reply to this message.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

