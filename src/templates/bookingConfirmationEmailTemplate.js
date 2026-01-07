/**
 * Email template for Booking Confirmation
 * @param {string} guestName - Guest's name
 * @param {string} roomNumber - Room number
 * @param {string} roomType - Room type
 * @param {string} checkInDate - Check-in date (formatted string)
 * @param {string} checkOutDate - Check-out date (formatted string)
 * @param {string} status - Booking status (pending, confirmed, etc.)
 * @returns {string} HTML email template
 * 
 * NOTE: This template is used for BOTH initial booking creation AND confirmation
 * - Guest online bookings: sent with status="pending" (awaiting staff confirmation)
 * - Walk-in bookings: sent with status="confirmed" (created by staff directly)
 * - After staff confirmation: sent with status="confirmed"
 */
export function bookingConfirmationEmailTemplate(guestName, roomNumber, roomType, checkInDate, checkOutDate, status) {
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
                    color: #2c3e50;
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
                .status-badge {
                    display: inline-block;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                    text-transform: uppercase;
                    font-size: 12px;
                }
                .status-confirmed {
                    background-color: #27ae60;
                    color: white;
                }
                .status-pending {
                    background-color: #f39c12;
                    color: white;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 12px;
                    color: #777;
                    text-align: center;
                }
                .success-icon {
                    font-size: 48px;
                    text-align: center;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="content">
                    <div class="success-icon">✅</div>
                    <h2 class="header">${status === 'confirmed' ? 'Booking Confirmed' : 'Booking Created'}</h2>
                    <p>Hello ${guestName},</p>
                    <p>Thank you for choosing our hotel! ${status === 'confirmed'
            ? 'Your booking has been <strong>confirmed</strong> and is all set!'
            : 'Your booking request has been received and is currently <strong>pending confirmation</strong> from our staff.'
        }</p>
                    ${status === 'pending' ? '<p style="color: #f39c12; font-weight: bold;">⏳ Please note: Your booking will be confirmed by our staff shortly. You will receive another email once confirmed.</p>' : ''}
                    
                    <div class="booking-details">
                        <h3>Booking Details</h3>
                        <div class="detail-row">
                            <span class="detail-label">Room Number:</span>
                            <span class="detail-value">${roomNumber}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Room Type:</span>
                            <span class="detail-value">${roomType}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Check-in Date:</span>
                            <span class="detail-value">${checkInDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Check-out Date:</span>
                            <span class="detail-value">${checkOutDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value">
                                <span class="status-badge status-${status}">${status}</span>
                            </span>
                        </div>
                    </div>
                    
                    <p>We look forward to welcoming you to our hotel. If you have any questions or special requests, please don't hesitate to contact us.</p>
                    
                    <p><strong>Important:</strong> Please arrive after 2:00 PM on your check-in date. Check-out time is 11:00 AM.</p>
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

