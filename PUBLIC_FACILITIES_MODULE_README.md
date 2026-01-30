# Public Facilities Module - Complete Documentation

## Overview

The Public Facilities Module is a comprehensive feature that allows hotels to manage and rent out public facilities such as event halls, pools, gyms, conference rooms, and other amenities. It includes full CRUD operations, booking management, availability checking, and payment integration.

## Features

- ✅ Complete CRUD operations for facilities
- ✅ Unique facility names per hotel
- ✅ Hotel-based facility management (selectable during creation)
- ✅ Booking system with availability checking
- ✅ Support for hourly and daily bookings
- ✅ Overlap prevention for bookings
- ✅ Payment integration
- ✅ Check-in/check-out functionality
- ✅ Email notifications
- ✅ Role-based access control

## Database Models

### 1. PublicFacility Model
**Location:** `src/models/PublicFacility.js`

**Fields:**
- `hotelId` (ObjectId, required) - Reference to Hotel
- `name` (String, required, unique per hotel) - Facility name
- `facilityType` (Enum, required) - Event Hall, Pool, Gym, Spa, Conference Room, Sports Court, Game Room, Other
- `description` (String) - Facility description
- `capacity` (Number, required) - Maximum number of guests
- `pricePerHour` (Number, required) - Hourly rate
- `pricePerDay` (Number, optional) - Daily rate
- `amenities` (Array of Strings) - List of amenities
- `images` (Array of Strings, 1-4 URLs required) - Facility images
- `operatingHours` (Object) - Start and end time in HH:MM format
- `status` (Enum) - available, unavailable, maintenance

**Indexes:**
- Compound unique index on `hotelId` and `name`
- Index on `hotelId` and `status`
- Index on `hotelId` and `facilityType`

### 2. PublicFacilityBooking Model
**Location:** `src/models/PublicFacilityBooking.js`

**Fields:**
- `hotelId` (ObjectId, required) - Reference to Hotel
- `guest` (ObjectId, optional) - Reference to User (guest role)
- `customerDetails` (Object) - Walk-in customer details (name, phone, email)
- `createdBy` (ObjectId) - User who created the booking
- `facility` (ObjectId, required) - Reference to PublicFacility
- `bookingType` (Enum, required) - hourly or daily
- `startDate` (Date, required) - Booking start date
- `endDate` (Date, required) - Booking end date
- `startTime` (String, HH:MM format) - For hourly bookings
- `endTime` (String, HH:MM format) - For hourly bookings
- `numberOfGuests` (Number, required) - Number of guests
- `purpose` (String) - Purpose of booking
- `specialRequests` (String) - Special requests
- `status` (Enum) - pending, confirmed, in_use, completed, cancelled
- `cancellationPenalty` (Number) - Penalty amount
- `cancelledBy` (ObjectId) - User who cancelled
- `cancellationReason` (String) - Reason for cancellation
- `cancellationDate` (Date) - When cancelled
- `isCheckedIn` (Boolean) - Check-in status
- `checkInDetails` (Object) - Check-in timestamp and user
- `isCheckedOut` (Boolean) - Check-out status
- `checkOutDetails` (Object) - Check-out timestamp and user
- `paymentStatus` (Enum) - unpaid, partially_paid, paid
- `payments` (Array) - Payment records
- `totalPaid` (Number) - Total amount paid
- `facilityCharges` (Number) - Facility rental charges
- `serviceCharges` (Number) - Additional service charges
- `totalAmount` (Number) - Total amount due

**Pre-save Hook:**
- Automatically checks for overlapping bookings
- Prevents double-booking of facilities

## API Endpoints

### Public Facility Management

#### 1. Create Facility
```
POST /api/public-facilities
Authorization: Required (Admin only)
```
**Request Body:**
```json
{
  "hotelId": "hotel_id_here",
  "name": "Grand Event Hall",
  "facilityType": "Event Hall",
  "description": "Spacious event hall perfect for weddings and conferences",
  "capacity": 200,
  "pricePerHour": 100,
  "pricePerDay": 1500,
  "amenities": ["Wi-Fi", "Air Conditioning", "Sound System"],
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "operatingHours": {
    "start": "08:00",
    "end": "22:00"
  },
  "status": "available"
}
```

#### 2. Get All Facilities
```
GET /api/public-facilities?hotelId=xxx&facilityType=xxx&status=xxx&minPrice=xxx&maxPrice=xxx&page=1&limit=10
Authorization: Not required (Public access)
```

#### 3. Get Facilities by Hotel
```
GET /api/public-facilities/hotel/:hotelId
Authorization: Not required (Public access)
```

#### 4. Get Facility by ID
```
GET /api/public-facilities/:id
Authorization: Not required (Public access)
```

#### 5. Update Facility
```
PATCH /api/public-facilities/:id
Authorization: Required (Admin only)
```

#### 6. Delete Facility
```
DELETE /api/public-facilities/:id
Authorization: Required (Admin only)
```

### Facility Booking Management

#### 1. Check Availability
```
GET /api/public-facility-bookings/check-availability?facilityId=xxx&startDate=2026-02-01&endDate=2026-02-02&startTime=10:00&endTime=14:00
Authorization: Not required (Public access)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "facilityId": "facility_id",
    "startDate": "2026-02-01T00:00:00.000Z",
    "endDate": "2026-02-02T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "14:00"
  }
}
```

#### 2. Create Booking
```
POST /api/public-facility-bookings
Authorization: Required (Guest, Receptionist, Admin)
```

**Request Body (Guest):**
```json
{
  "facility": "facility_id",
  "bookingType": "hourly",
  "startDate": "2026-02-01",
  "endDate": "2026-02-01",
  "startTime": "10:00",
  "endTime": "14:00",
  "numberOfGuests": 50,
  "purpose": "Corporate Meeting",
  "specialRequests": "Need projector and whiteboard"
}
```

**Request Body (Staff for Walk-in):**
```json
{
  "facility": "facility_id",
  "bookingType": "daily",
  "startDate": "2026-02-01",
  "endDate": "2026-02-03",
  "numberOfGuests": 100,
  "purpose": "Wedding Event",
  "customerDetails": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  }
}
```

#### 3. Get All Bookings
```
GET /api/public-facility-bookings?status=xxx&facilityId=xxx&from=xxx&to=xxx&page=1&limit=10
Authorization: Required (Guest, Receptionist, Admin)
```

#### 4. Get Booking by ID
```
GET /api/public-facility-bookings/:id
Authorization: Required (Guest, Receptionist, Admin)
```

#### 5. Cancel Booking
```
PATCH /api/public-facility-bookings/:id/cancel
Authorization: Required (Guest, Receptionist, Admin)
```

**Request Body (Staff with penalty):**
```json
{
  "reason": "Customer requested cancellation",
  "penalty": 50
}
```

#### 6. Confirm Booking
```
PATCH /api/public-facility-bookings/:id/confirm
Authorization: Required (Receptionist, Admin)
```

#### 7. Check-in Booking
```
PATCH /api/public-facility-bookings/:id/check-in
Authorization: Required (Receptionist, Admin)
```

#### 8. Check-out Booking
```
PATCH /api/public-facility-bookings/:id/check-out
Authorization: Required (Receptionist, Admin)
```

### Payment Integration

#### 1. Add Payment to Facility Booking
```
POST /api/payments/bookings/:bookingId/payments
Authorization: Required (Guest, Receptionist, Admin)
```

**Request Body:**
```json
{
  "bookingType": "facility",
  "amount": 500,
  "paymentMethod": "card",
  "transactionId": "TXN123456",
  "notes": "Partial payment for event hall booking"
}
```

#### 2. Get Facility Booking Payments
```
GET /api/payments/facility-bookings/:bookingId/payments
Authorization: Required (Guest, Receptionist, Admin)
```

#### 3. Get Facility Booking Balance
```
GET /api/payments/facility-bookings/:bookingId/balance
Authorization: Required (Guest, Receptionist, Admin)
```

## Services

### 1. PublicFacilityService
**Location:** `src/services/publicFacilityService.js`

**Methods:**
- `createFacility(facilityData, currentUser)` - Create new facility
- `getAllFacilities(filters, pagination, currentUser)` - Get all facilities with filters
- `getFacilityById(facilityId, currentUser)` - Get single facility
- `updateFacility(facilityId, updateData, currentUser)` - Update facility
- `deleteFacility(facilityId, currentUser)` - Delete facility
- `getFacilitiesByHotel(hotelId)` - Get all facilities for a hotel

### 2. PublicFacilityBookingService
**Location:** `src/services/publicFacilityBookingService.js`

**Methods:**
- `checkAvailability(facilityId, startDate, endDate, startTime, endTime)` - Check availability
- `hasOverlappingBooking(facilityId, startDate, endDate, startTime, endTime, excludeBookingId)` - Check overlaps
- `createBooking(bookingData, currentUser)` - Create new booking
- `calculateCharges(facility, bookingType, startDate, endDate, startTime, endTime)` - Calculate charges
- `getAllBookings(filters, pagination, currentUser)` - Get all bookings
- `getBookingById(bookingId, currentUser)` - Get single booking
- `cancelBooking(bookingId, currentUser, penaltyData)` - Cancel booking
- `confirmBooking(bookingId, currentUser)` - Confirm booking
- `checkInBooking(bookingId, currentUser)` - Check-in booking
- `checkOutBooking(bookingId, currentUser)` - Check-out booking
- `sendBookingConfirmationEmail(booking)` - Send confirmation email
- `sendBookingCancellationEmail(booking)` - Send cancellation email

### 3. PaymentService (Extended)
**Location:** `src/services/paymentService.js`

**New Methods:**
- `addFacilityPayment(bookingId, paymentData, currentUser)` - Add payment to facility booking
- `getFacilityBookingPayments(bookingId, currentUser)` - Get facility booking payments
- `getFacilityBookingBalance(bookingId, currentUser)` - Get facility booking balance

## Controllers

### 1. PublicFacilityController
**Location:** `src/controllers/publicFacilities/publicFacilityController.js`

### 2. PublicFacilityBookingController
**Location:** `src/controllers/publicFacilities/publicFacilityBookingController.js`

## Routes

### 1. Public Facility Routes
**Location:** `src/routes/publicFacilityRoutes.js`

### 2. Public Facility Booking Routes
**Location:** `src/routes/publicFacilityBookingRoutes.js`

## Authorization & Access Control

### Roles:
- **Guest**: Can view facilities, create bookings for themselves, view their own bookings, make payments
- **Receptionist**: Can manage facilities in their hotel, create bookings for guests/walk-ins, manage all bookings in their hotel
- **Admin**: Full access to all facilities and bookings across all hotels

### Hotel Scoping:
- All operations are scoped to hotels
- Receptionist can only access data for their assigned hotel
- Admin can access data across all hotels
- Facility names must be unique per hotel (not globally)

## Email Notifications

The module sends automated emails for:
1. **Booking Confirmation** - When a booking is created
2. **Booking Cancellation** - When a booking is cancelled

Email templates include:
- Facility details
- Booking dates and times
- Guest count
- Total amount
- Booking status

## Charge Calculation

### Hourly Bookings:
```
Hours = (endHour - startHour) + (endMinute - startMinute) / 60
Charges = Hours × pricePerHour
```

### Daily Bookings:
```
Days = ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
Charges = Days × (pricePerDay || pricePerHour × 24)
```

## Overlap Prevention

The system prevents double-booking through:
1. Pre-save hooks in the model
2. Real-time availability checking
3. Transaction-safe database operations

### For Hourly Bookings:
Checks for overlapping dates AND times

### For Daily Bookings:
Checks for overlapping date ranges

## Testing the Module

### 1. Create a Facility:
```bash
curl -X POST http://localhost:5000/api/public-facilities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "hotelId": "hotel_id",
    "name": "Event Hall A",
    "facilityType": "Event Hall",
    "capacity": 150,
    "pricePerHour": 100,
    "pricePerDay": 1500,
    "images": ["https://example.com/image.jpg"],
    "operatingHours": {
      "start": "08:00",
      "end": "22:00"
    }
  }'
```

### 2. Check Availability:
```bash
curl "http://localhost:5000/api/public-facility-bookings/check-availability?facilityId=facility_id&startDate=2026-02-01&endDate=2026-02-02&startTime=10:00&endTime=14:00"
```

### 3. Create a Booking:
```bash
curl -X POST http://localhost:5000/api/public-facility-bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "facility": "facility_id",
    "bookingType": "hourly",
    "startDate": "2026-02-01",
    "endDate": "2026-02-01",
    "startTime": "10:00",
    "endTime": "14:00",
    "numberOfGuests": 50,
    "purpose": "Corporate Meeting"
  }'
```

### 4. Add Payment:
```bash
curl -X POST http://localhost:5000/api/payments/bookings/booking_id/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bookingType": "facility",
    "amount": 400,
    "paymentMethod": "card"
  }'
```

## Integration with Existing System

The module integrates seamlessly with:
- **Hotel Management** - Facilities are scoped to hotels
- **User Management** - Role-based access control
- **Payment System** - Unified payment processing
- **Email System** - Automated notifications

## Future Enhancements (Optional)

Potential future additions:
- Recurring bookings
- Equipment rental
- Catering integration
- Custom pricing rules (weekday/weekend)
- Booking calendar view
- Reports and analytics
- Facility reviews and ratings
- Multi-facility package bookings

## Files Created

1. `src/models/PublicFacility.js`
2. `src/models/PublicFacilityBooking.js`
3. `src/services/publicFacilityService.js`
4. `src/services/publicFacilityBookingService.js`
5. `src/controllers/publicFacilities/publicFacilityController.js`
6. `src/controllers/publicFacilities/publicFacilityBookingController.js`
7. `src/routes/publicFacilityRoutes.js`
8. `src/routes/publicFacilityBookingRoutes.js`

## Files Modified

1. `src/app.js` - Added route registrations
2. `src/services/paymentService.js` - Extended for facility bookings
3. `src/controllers/payments/paymentController.js` - Added facility payment endpoints
4. `src/routes/paymentRoutes.js` - Added facility payment routes

---

**Module Status:** ✅ Complete and Production-Ready

**Created:** January 30, 2026
