import PDFDocument from "pdfkit";

/**
 * Generate professional invoice PDF
 * @param {Object} invoice - Invoice object
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateInvoicePDF(invoice) {
    return new Promise((resolve, reject) => {
        try {
            // Create a PDF document
            const doc = new PDFDocument({
                size: "A4",
                margin: 50,
            });

            // Buffer to store PDF
            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));

            // Helper functions
            const formatCurrency = (amount) => {
                return `LKR ${amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`;
            };

            const formatDate = (date) => {
                return new Date(date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            };

            // Colors
            const primaryColor = "#667eea";
            const darkColor = "#2c3e50";
            const lightGray = "#95a5a6";
            const borderColor = "#ecf0f1";

            // Page width
            const pageWidth = doc.page.width;

            // Header Section
            doc.fontSize(28)
                .fillColor(primaryColor)
                .text("INVOICE", 50, 50, { align: "left" });

            // Hotel Information (Top Left)
            doc.fontSize(14)
                .fillColor(darkColor)
                .text(invoice.hotelDetails.name, 50, 90);

            doc.fontSize(9)
                .fillColor(lightGray)
                .text(invoice.hotelDetails.address, 50, 110)
                .text(`${invoice.hotelDetails.city}, ${invoice.hotelDetails.country}`, 50, 125)
                .text(`Email: ${invoice.hotelDetails.contactEmail}`, 50, 140)
                .text(`Phone: ${invoice.hotelDetails.contactPhone}`, 50, 155);

            // Invoice Details (Top Right)
            const rightColumnX = 350;
            doc.fontSize(16)
                .fillColor(primaryColor)
                .text(invoice.invoiceNumber, rightColumnX, 90, { align: "right" });

            doc.fontSize(9)
                .fillColor(lightGray)
                .text(`Date: ${formatDate(invoice.createdAt)}`, rightColumnX, 115, { align: "right" })
                .text(`Status: ${invoice.paymentStatus.toUpperCase()}`, rightColumnX, 130, { align: "right" });

            // Draw separator line
            doc.strokeColor(borderColor)
                .lineWidth(2)
                .moveTo(50, 180)
                .lineTo(pageWidth - 50, 180)
                .stroke();

            // Bill To Section
            let currentY = 200;
            doc.fontSize(11)
                .fillColor(darkColor)
                .text("BILL TO", 50, currentY);

            currentY += 20;
            doc.fontSize(12)
                .fillColor(darkColor)
                .text(invoice.guestDetails.name, 50, currentY);

            currentY += 18;
            doc.fontSize(9)
                .fillColor(lightGray)
                .text(`Email: ${invoice.guestDetails.email}`, 50, currentY);

            if (invoice.guestDetails.phone) {
                currentY += 15;
                doc.text(`Phone: ${invoice.guestDetails.phone}`, 50, currentY);
            }

            // Stay Information Section (Right side)
            let stayInfoY = 200;
            doc.fontSize(11)
                .fillColor(darkColor)
                .text("STAY INFORMATION", rightColumnX, stayInfoY, { align: "right" });

            stayInfoY += 20;
            doc.fontSize(9)
                .fillColor(lightGray)
                .text(`Room: ${invoice.stayDetails.roomNumber} (${invoice.stayDetails.roomType})`, rightColumnX, stayInfoY, { align: "right" });

            stayInfoY += 15;
            doc.text(`Check-in: ${formatDate(invoice.stayDetails.checkInDate)}`, rightColumnX, stayInfoY, { align: "right" });

            stayInfoY += 15;
            doc.text(`Check-out: ${formatDate(invoice.stayDetails.checkOutDate)}`, rightColumnX, stayInfoY, { align: "right" });

            stayInfoY += 15;
            doc.text(`Nights: ${invoice.stayDetails.numberOfNights}`, rightColumnX, stayInfoY, { align: "right" });

            // Charges Table
            currentY = Math.max(currentY, stayInfoY) + 40;

            // Table Header Background
            doc.rect(50, currentY, pageWidth - 100, 25)
                .fillColor("#f8f9fa")
                .fill();

            // Table Headers
            doc.fontSize(10)
                .fillColor(darkColor)
                .text("Description", 60, currentY + 8)
                .text("Qty", 280, currentY + 8, { width: 50, align: "center" })
                .text("Unit Price", 350, currentY + 8, { width: 80, align: "right" })
                .text("Total", 450, currentY + 8, { width: 90, align: "right" });

            currentY += 25;

            // Room Charges
            doc.fontSize(9)
                .fillColor(darkColor)
                .text(`${invoice.stayDetails.roomType} Room`, 60, currentY + 8)
                .text(invoice.roomCharges.numberOfNights.toString(), 280, currentY + 8, { width: 50, align: "center" })
                .text(formatCurrency(invoice.roomCharges.pricePerNight), 350, currentY + 8, { width: 80, align: "right" })
                .fillColor(darkColor)
                .font("Helvetica-Bold")
                .text(formatCurrency(invoice.roomCharges.subtotal), 450, currentY + 8, { width: 90, align: "right" })
                .font("Helvetica");

            currentY += 25;

            // Draw line after room charges
            doc.strokeColor(borderColor)
                .lineWidth(1)
                .moveTo(50, currentY)
                .lineTo(pageWidth - 50, currentY)
                .stroke();

            // Service Charges
            if (invoice.serviceCharges && invoice.serviceCharges.length > 0) {
                invoice.serviceCharges.forEach((service) => {
                    currentY += 8;
                    doc.fontSize(9)
                        .fillColor(darkColor)
                        .text(service.description, 60, currentY + 8, { width: 200 })
                        .text(service.quantity.toString(), 280, currentY + 8, { width: 50, align: "center" })
                        .text(formatCurrency(service.unitPrice), 350, currentY + 8, { width: 80, align: "right" })
                        .fillColor(darkColor)
                        .font("Helvetica-Bold")
                        .text(formatCurrency(service.total), 450, currentY + 8, { width: 90, align: "right" })
                        .font("Helvetica");

                    currentY += 25;
                });

                // Draw line after services
                doc.strokeColor(borderColor)
                    .lineWidth(1)
                    .moveTo(50, currentY)
                    .lineTo(pageWidth - 50, currentY)
                    .stroke();
            }

            // Summary Section
            currentY += 30;
            const summaryX = 350;
            const summaryValueX = 450;

            // Room Charges Total
            doc.fontSize(10)
                .fillColor(lightGray)
                .text("Room Charges:", summaryX, currentY, { width: 90, align: "right" })
                .fillColor(darkColor)
                .text(formatCurrency(invoice.summary.roomChargesTotal), summaryValueX, currentY, { width: 90, align: "right" });

            // Service Charges Total (if any)
            if (invoice.summary.serviceChargesTotal > 0) {
                currentY += 20;
                doc.fillColor(lightGray)
                    .text("Service Charges:", summaryX, currentY, { width: 90, align: "right" })
                    .fillColor(darkColor)
                    .text(formatCurrency(invoice.summary.serviceChargesTotal), summaryValueX, currentY, { width: 90, align: "right" });
            }

            // Subtotal
            currentY += 20;
            doc.fillColor(lightGray)
                .text("Subtotal:", summaryX, currentY, { width: 90, align: "right" })
                .fillColor(darkColor)
                .text(formatCurrency(invoice.summary.subtotal), summaryValueX, currentY, { width: 90, align: "right" });

            // Tax (if any)
            if (invoice.summary.tax > 0) {
                currentY += 20;
                doc.fillColor(lightGray)
                    .text("Tax:", summaryX, currentY, { width: 90, align: "right" })
                    .fillColor(darkColor)
                    .text(formatCurrency(invoice.summary.tax), summaryValueX, currentY, { width: 90, align: "right" });
            }

            // Grand Total
            currentY += 25;
            doc.strokeColor(primaryColor)
                .lineWidth(2)
                .moveTo(summaryX, currentY)
                .lineTo(pageWidth - 50, currentY)
                .stroke();

            currentY += 15;
            doc.fontSize(14)
                .fillColor(primaryColor)
                .font("Helvetica-Bold")
                .text("GRAND TOTAL:", summaryX, currentY, { width: 90, align: "right" })
                .text(formatCurrency(invoice.summary.grandTotal), summaryValueX, currentY, { width: 90, align: "right" })
                .font("Helvetica");

            // Footer
            const footerY = doc.page.height - 100;
            doc.fontSize(12)
                .fillColor(darkColor)
                .text("Thank You for Your Stay!", 50, footerY, { align: "center" });

            doc.fontSize(9)
                .fillColor(lightGray)
                .text(`We hope you enjoyed your time at ${invoice.hotelDetails.name}.`, 50, footerY + 20, { align: "center" })
                .text(`For any queries, please contact us at ${invoice.hotelDetails.contactEmail}`, 50, footerY + 35, { align: "center" });

            // Finalize PDF
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
