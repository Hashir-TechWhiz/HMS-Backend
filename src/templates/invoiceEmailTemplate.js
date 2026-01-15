/**
 * Email template for Invoice
 * @param {Object} invoice - Invoice object
 * @returns {string} HTML email template
 */
export function invoiceEmailTemplate(invoice) {
    // Format dates
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return `LKR ${amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // Generate service charges rows
    const serviceChargesRows = invoice.serviceCharges
        .map(
            (service) => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${service.description}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${service.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(service.unitPrice)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${formatCurrency(service.total)}</td>
        </tr>
    `
        )
        .join("");

    const serviceChargesSection =
        invoice.serviceCharges.length > 0
            ? `
        <div style="margin-top: 30px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 16px;">Service Charges</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Unit Price</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${serviceChargesRows}
                </tbody>
            </table>
        </div>
    `
            : "";

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 700px;
                    margin: 20px auto;
                    background-color: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                }
                .header p {
                    margin: 10px 0 0 0;
                    opacity: 0.9;
                    font-size: 14px;
                }
                .content {
                    padding: 40px;
                }
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #f0f0f0;
                }
                .invoice-details {
                    text-align: right;
                }
                .invoice-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #667eea;
                    margin-bottom: 5px;
                }
                .invoice-date {
                    color: #666;
                    font-size: 14px;
                }
                .hotel-info h2 {
                    margin: 0 0 10px 0;
                    color: #2c3e50;
                    font-size: 20px;
                }
                .hotel-info p {
                    margin: 3px 0;
                    color: #555;
                    font-size: 14px;
                }
                .section {
                    margin: 30px 0;
                }
                .section-title {
                    color: #2c3e50;
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f0f0f0;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .info-item {
                    padding: 10px 0;
                }
                .info-label {
                    font-weight: 600;
                    color: #555;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 5px;
                }
                .info-value {
                    color: #2c3e50;
                    font-size: 15px;
                }
                .charges-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .charges-table th {
                    background-color: #f8f9fa;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    color: #2c3e50;
                    border-bottom: 2px solid #dee2e6;
                }
                .charges-table td {
                    padding: 12px;
                    border-bottom: 1px solid #eee;
                }
                .total-section {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #f0f0f0;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    font-size: 15px;
                }
                .total-row.grand-total {
                    font-size: 20px;
                    font-weight: bold;
                    color: #667eea;
                    padding: 15px 0;
                    border-top: 2px solid #667eea;
                    margin-top: 10px;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 30px;
                    text-align: center;
                    color: #666;
                    font-size: 13px;
                }
                .thank-you {
                    font-size: 18px;
                    color: #2c3e50;
                    margin-bottom: 10px;
                    font-weight: 600;
                }
                .status-badge {
                    display: inline-block;
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 12px;
                    text-transform: uppercase;
                    background-color: #27ae60;
                    color: white;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📄 Invoice</h1>
                    <p>Thank you for choosing ${invoice.hotelDetails.name}</p>
                </div>
                
                <div class="content">
                    <!-- Invoice Header -->
                    <div class="invoice-header">
                        <div class="hotel-info">
                            <h2>${invoice.hotelDetails.name}</h2>
                            <p>${invoice.hotelDetails.address}</p>
                            <p>${invoice.hotelDetails.city}, ${invoice.hotelDetails.country}</p>
                            <p>📧 ${invoice.hotelDetails.contactEmail}</p>
                            <p>📞 ${invoice.hotelDetails.contactPhone}</p>
                        </div>
                        <div class="invoice-details">
                            <div class="invoice-number">${invoice.invoiceNumber}</div>
                            <div class="invoice-date">Date: ${formatDate(invoice.createdAt)}</div>
                            <div style="margin-top: 10px;">
                                <span class="status-badge">${invoice.paymentStatus.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Guest Information -->
                    <div class="section">
                        <div class="section-title">Bill To</div>
                        <p style="margin: 5px 0; font-size: 16px; font-weight: 600; color: #2c3e50;">${invoice.guestDetails.name}</p>
                        <p style="margin: 3px 0; color: #666;">📧 ${invoice.guestDetails.email}</p>
                        ${invoice.guestDetails.phone ? `<p style="margin: 3px 0; color: #666;">📞 ${invoice.guestDetails.phone}</p>` : ""}
                    </div>

                    <!-- Stay Details -->
                    <div class="section">
                        <div class="section-title">Stay Information</div>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Room Number</div>
                                <div class="info-value">${invoice.stayDetails.roomNumber}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Room Type</div>
                                <div class="info-value">${invoice.stayDetails.roomType}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Check-in Date</div>
                                <div class="info-value">${formatDate(invoice.stayDetails.checkInDate)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Check-out Date</div>
                                <div class="info-value">${formatDate(invoice.stayDetails.checkOutDate)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Number of Nights</div>
                                <div class="info-value">${invoice.stayDetails.numberOfNights} night${invoice.stayDetails.numberOfNights > 1 ? "s" : ""}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Room Charges -->
                    <div class="section">
                        <div class="section-title">Room Charges</div>
                        <table class="charges-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th style="text-align: center;">Nights</th>
                                    <th style="text-align: right;">Rate/Night</th>
                                    <th style="text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${invoice.stayDetails.roomType} Room</td>
                                    <td style="text-align: center;">${invoice.roomCharges.numberOfNights}</td>
                                    <td style="text-align: right;">${formatCurrency(invoice.roomCharges.pricePerNight)}</td>
                                    <td style="text-align: right; font-weight: bold;">${formatCurrency(invoice.roomCharges.subtotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Service Charges (if any) -->
                    ${serviceChargesSection}

                    <!-- Total Summary -->
                    <div class="total-section">
                        <div class="total-row">
                            <span>Room Charges</span>
                            <span>${formatCurrency(invoice.summary.roomChargesTotal)}</span>
                        </div>
                        ${invoice.summary.serviceChargesTotal > 0
            ? `
                        <div class="total-row">
                            <span>Service Charges</span>
                            <span>${formatCurrency(invoice.summary.serviceChargesTotal)}</span>
                        </div>
                        `
            : ""
        }
                        <div class="total-row">
                            <span>Subtotal</span>
                            <span>${formatCurrency(invoice.summary.subtotal)}</span>
                        </div>
                        ${invoice.summary.tax > 0
            ? `
                        <div class="total-row">
                            <span>Tax</span>
                            <span>${formatCurrency(invoice.summary.tax)}</span>
                        </div>
                        `
            : ""
        }
                        <div class="total-row grand-total">
                            <span>GRAND TOTAL</span>
                            <span>${formatCurrency(invoice.summary.grandTotal)}</span>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <div class="thank-you">Thank You for Your Stay!</div>
                    <p>We hope you enjoyed your time with us at ${invoice.hotelDetails.name}.</p>
                    <p>The invoice is attached as a PDF for your records.</p>
                    <p style="margin-top: 20px; font-size: 12px; color: #999;">
                        This is an automated email. Please do not reply to this email.
                        <br>
                        For any queries, please contact us at ${invoice.hotelDetails.contactEmail}
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}
