/**
 * Script to recalculate booking amounts and payment status
 * Run this to fix bookings with incorrect totals
 * 
 * Usage: node RECALCULATE_BOOKING_SCRIPT.js <bookingId>
 */

import mongoose from 'mongoose';
import Booking from './src/models/Booking.js';
import ServiceRequest from './src/models/ServiceRequest.js';
import dotenv from 'dotenv';

dotenv.config();

async function recalculateBooking(bookingId) {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database');

        // Find the booking
        const booking = await Booking.findById(bookingId).populate('room');
        if (!booking) {
            console.error('Booking not found!');
            process.exit(1);
        }

        console.log('\n=== BEFORE RECALCULATION ===');
        console.log(`Room Charges: ${booking.roomCharges || 0}`);
        console.log(`Service Charges: ${booking.serviceCharges || 0}`);
        console.log(`Total Amount: ${booking.totalAmount || 0}`);
        console.log(`Total Paid: ${booking.totalPaid || 0}`);
        console.log(`Balance: ${(booking.totalAmount || 0) - (booking.totalPaid || 0)}`);
        console.log(`Payment Status: ${booking.paymentStatus}`);

        // Calculate room charges if not set
        if (!booking.roomCharges) {
            const checkIn = new Date(booking.checkInDate);
            const checkOut = new Date(booking.checkOutDate);
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            booking.roomCharges = nights * (booking.room.pricePerNight || 0);
        }

        // Fetch all completed service requests
        const completedServices = await ServiceRequest.find({
            booking: bookingId,
            status: 'completed'
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

        // Update booking
        booking.serviceCharges = totalServiceCharges;
        booking.totalAmount = booking.roomCharges + totalServiceCharges;

        // Update payment status
        const totalPaid = booking.totalPaid || 0;
        if (totalPaid === 0) {
            booking.paymentStatus = 'unpaid';
        } else if (totalPaid >= booking.totalAmount) {
            booking.paymentStatus = 'paid';
        } else {
            booking.paymentStatus = 'partially_paid';
        }

        await booking.save();

        console.log('\n=== AFTER RECALCULATION ===');
        console.log(`Room Charges: ${booking.roomCharges}`);
        console.log(`Service Charges: ${booking.serviceCharges}`);
        console.log(`Total Amount: ${booking.totalAmount}`);
        console.log(`Total Paid: ${booking.totalPaid}`);
        console.log(`Balance: ${booking.totalAmount - booking.totalPaid}`);
        console.log(`Payment Status: ${booking.paymentStatus}`);

        console.log('\n✅ Booking recalculated successfully!');
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Get booking ID from command line
const bookingId = process.argv[2];
if (!bookingId) {
    console.error('Usage: node RECALCULATE_BOOKING_SCRIPT.js <bookingId>');
    process.exit(1);
}

recalculateBooking(bookingId);
