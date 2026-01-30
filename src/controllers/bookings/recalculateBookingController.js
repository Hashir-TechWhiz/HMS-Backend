import Booking from "../../models/Booking.js";
import ServiceRequest from "../../models/ServiceRequest.js";

/**
 * Recalculate booking amounts (for fixing incorrect totals)
 * @route POST /api/bookings/:id/recalculate
 * @access Private (Admin, Receptionist)
 */
export const recalculateBookingAmounts = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        // Only admin and receptionist can recalculate
        if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admin and receptionist can recalculate booking amounts"
            });
        }

        // Find booking
        const booking = await Booking.findById(id).populate("room");
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // For receptionist, check hotel authorization
        if (currentUser.role === "receptionist") {
            if (!currentUser.hotelId || booking.hotelId.toString() !== currentUser.hotelId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You can only recalculate bookings from your assigned hotel"
                });
            }
        }

        console.log(`\n=== RECALCULATING BOOKING ${id} ===`);
        console.log("BEFORE:");
        console.log(`  Room Charges: ${booking.roomCharges || 0}`);
        console.log(`  Service Charges: ${booking.serviceCharges || 0}`);
        console.log(`  Total Amount: ${booking.totalAmount || 0}`);
        console.log(`  Total Paid: ${booking.totalPaid || 0}`);
        console.log(`  Payment Status: ${booking.paymentStatus}`);

        // Calculate room charges if not set
        if (!booking.roomCharges) {
            const checkIn = new Date(booking.checkInDate);
            const checkOut = new Date(booking.checkOutDate);
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            booking.roomCharges = nights * (booking.room.pricePerNight || 0);
        }

        // Fetch all completed service requests
        const completedServices = await ServiceRequest.find({
            booking: id,
            status: "completed"
        });

        console.log(`\nFound ${completedServices.length} completed services:`);
        completedServices.forEach((service, index) => {
            const price = service.finalPrice || service.fixedPrice || 0;
            console.log(`  ${index + 1}. ${service.serviceType}: LKR ${price}`);
        });

        // Calculate total service charges
        const totalServiceCharges = completedServices.reduce((sum, sr) => {
            const price = sr.finalPrice || sr.fixedPrice || 0;
            return sum + price;
        }, 0);

        // Update booking amounts
        booking.serviceCharges = totalServiceCharges;
        booking.totalAmount = booking.roomCharges + totalServiceCharges;

        // Update payment status
        const totalPaid = booking.totalPaid || 0;
        if (totalPaid === 0) {
            booking.paymentStatus = "unpaid";
        } else if (totalPaid >= booking.totalAmount) {
            booking.paymentStatus = "paid";
        } else {
            booking.paymentStatus = "partially_paid";
        }

        await booking.save();

        console.log("\nAFTER:");
        console.log(`  Room Charges: ${booking.roomCharges}`);
        console.log(`  Service Charges: ${booking.serviceCharges}`);
        console.log(`  Total Amount: ${booking.totalAmount}`);
        console.log(`  Total Paid: ${booking.totalPaid}`);
        console.log(`  Balance: ${booking.totalAmount - booking.totalPaid}`);
        console.log(`  Payment Status: ${booking.paymentStatus}`);
        console.log("=== RECALCULATION COMPLETE ===\n");

        res.status(200).json({
            success: true,
            message: "Booking amounts recalculated successfully",
            data: {
                bookingId: booking._id,
                roomCharges: booking.roomCharges,
                serviceCharges: booking.serviceCharges,
                totalAmount: booking.totalAmount,
                totalPaid: booking.totalPaid,
                balance: booking.totalAmount - booking.totalPaid,
                paymentStatus: booking.paymentStatus,
                completedServicesCount: completedServices.length
            }
        });
    } catch (error) {
        console.error("Error recalculating booking:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to recalculate booking amounts"
        });
    }
};
