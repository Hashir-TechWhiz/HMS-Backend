# Smart Hotel Management System - Backend API

A comprehensive backend API for hotel management operations including room management, bookings, service requests, and administrative functions with role-based access control.

---

## User Roles & Permissions

### Guest

- Register and login to the system
- Browse available rooms
- Create and manage own bookings
- View own booking history
- Submit service requests for their bookings
- View status of own service requests
- Update own profile

### Receptionist

- Login to the system
- View and manage all bookings (create, view, cancel)
- View all service requests
- Access booking reports
- Access room reports
- Access service request reports
- View guest information
- Update own profile

### Housekeeping

- Login to the system
- View service requests assigned to housekeeping role
- Accept and manage service requests
- Update service request status (pending, in_progress, completed)
- Update own profile

### Administrator

- Full system access
- Manage all users (view, create, update, activate/deactivate)
- Manage rooms (create, update, delete)
- View and manage all bookings
- View and manage all service requests
- Access all reports and statistics
- Create staff accounts (receptionist, housekeeping, admin)

---

## API Routes

All API routes are prefixed with `/api`

### Authentication & User Account

| Method | Endpoint                 | Access  | Description                           |
| ------ | ------------------------ | ------- | ------------------------------------- |
| POST   | `/auth/register`         | Public  | Register as a guest user              |
| POST   | `/auth/login`            | Public  | Login with email and password         |
| POST   | `/auth/logout`           | Public  | Logout (clears authentication cookie) |
| POST   | `/auth/forgot-password`  | Public  | Request password reset OTP via email  |
| POST   | `/auth/verify-reset-otp` | Public  | Verify the password reset OTP         |
| POST   | `/auth/reset-password`   | Public  | Reset password using verified OTP     |
| GET    | `/auth/me`               | Private | Get current user profile              |
| PATCH  | `/auth/me`               | Private | Update current user profile           |
| POST   | `/auth/users`            | Admin   | Create new user with role assignment  |

---

### Admin User Management

All routes require Admin role and are prefixed with `/admin/users`

| Method | Endpoint      | Access | Description                                                  |
| ------ | ------------- | ------ | ------------------------------------------------------------ |
| GET    | `/statistics` | Admin  | Get user statistics (total, active, by role)                 |
| GET    | `/`           | Admin  | Get all users (supports filters: role, isActive, pagination) |
| GET    | `/:id`        | Admin  | Get single user by ID                                        |
| PATCH  | `/:id/status` | Admin  | Activate or deactivate user account                          |
| PATCH  | `/:id`        | Admin  | Update user details (name, role, status)                     |

**Query Parameters for GET /**:

- `role`: Filter by role (guest, receptionist, housekeeping, admin)
- `isActive`: Filter by status (true/false)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

---

### Room Management

| Method | Endpoint     | Access | Description                                           |
| ------ | ------------ | ------ | ----------------------------------------------------- |
| GET    | `/rooms`     | Public | Get all rooms (supports filters: type, status, price) |
| GET    | `/rooms/:id` | Public | Get single room details                               |
| POST   | `/rooms`     | Admin  | Create a new room                                     |
| PATCH  | `/rooms/:id` | Admin  | Update room details                                   |
| DELETE | `/rooms/:id` | Admin  | Delete a room                                         |

**Query Parameters for GET /rooms**:

- `roomType`: Filter by room type
- `status`: Filter by status (available, occupied, maintenance)
- `minPrice`: Filter by minimum price
- `maxPrice`: Filter by maximum price

---

### Booking Management

All routes require authentication

| Method | Endpoint                | Access                     | Description                         |
| ------ | ----------------------- | -------------------------- | ----------------------------------- |
| POST   | `/bookings`             | Guest, Receptionist, Admin | Create a new booking                |
| GET    | `/bookings/my-bookings` | Guest                      | Get own bookings (paginated)        |
| GET    | `/bookings`             | Guest, Receptionist, Admin | Get all bookings (filtered by role) |
| GET    | `/bookings/:id`         | Guest, Receptionist, Admin | Get single booking details          |
| PATCH  | `/bookings/:id/cancel`  | Guest, Receptionist, Admin | Cancel a booking                    |

**Query Parameters for GET /bookings**:

- `status`: Filter by status (pending, confirmed, cancelled)
- `guestId`: Filter by guest user ID
- `roomId`: Filter by room ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Booking Status Lifecycle**:

- `pending`: Booking created, awaiting confirmation
- `confirmed`: Booking confirmed
- `cancelled`: Booking cancelled

Active bookings are determined by check-in and check-out dates. The system does not use explicit `checked-in` or `checked-out` status values.

**Notes**:

- Guests can only view and manage their own bookings
- Receptionists and Admins can view and manage all bookings
- Booking confirmation emails are sent automatically
- Cancellation emails are sent when booking is cancelled

---

### Service Requests

All routes require authentication

| Method | Endpoint                        | Access                  | Description                              |
| ------ | ------------------------------- | ----------------------- | ---------------------------------------- |
| POST   | `/service-requests`             | Guest                   | Create a service request for own booking |
| GET    | `/service-requests/my-requests` | Guest                   | Get own service requests (paginated)     |
| GET    | `/service-requests/assigned`    | Housekeeping            | Get service requests for housekeeping    |
| GET    | `/service-requests`             | Admin, Receptionist     | Get all service requests (filtered)      |
| GET    | `/service-requests/:id`         | All authenticated users | Get single service request details       |
| PATCH  | `/service-requests/:id/status`  | Housekeeping, Admin     | Update service request status            |

**Service Types**:

- `housekeeping`: Room cleaning
- `room_service`: Food/beverage delivery to room
- `maintenance`: Repair and maintenance requests

**Service Request Status**:

- `pending`: Newly created, awaiting acceptance
- `in_progress`: Currently being handled by staff
- `completed`: Service completed

**Service Request Assignment**:

- `housekeeping` and `room_service` requests are assigned to housekeeping role
- `maintenance` requests are assigned to maintenance role
- Housekeeping staff can view all pending requests assigned to housekeeping
- When a housekeeping staff member updates status to `in_progress`, the request is automatically assigned to them
- Once assigned, only that specific staff member can update the request
- Other housekeeping staff cannot view or modify requests assigned to others

**Query Parameters for GET /service-requests**:

- `status`: Filter by status (pending, in_progress, completed)
- `serviceType`: Filter by type (housekeeping, room_service, maintenance)
- `assignedRole`: Filter by assigned role (housekeeping, maintenance)
- `roomId`: Filter by room ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Access Notes**:

- Guests can only view their own service requests
- Housekeeping staff can view unassigned requests and requests assigned to them specifically
- Receptionists can view all service requests (read-only)
- Admins have full visibility and can update any request

---

### Reports

All routes require Admin or Receptionist role

| Method | Endpoint                    | Access              | Description                                     |
| ------ | --------------------------- | ------------------- | ----------------------------------------------- |
| GET    | `/reports/overview`         | Admin, Receptionist | Get all reports in a single call                |
| GET    | `/reports/bookings`         | Admin, Receptionist | Get booking summary (counts by status)          |
| GET    | `/reports/rooms`            | Admin, Receptionist | Get room overview (counts by status and type)   |
| GET    | `/reports/service-requests` | Admin, Receptionist | Get service request overview (counts by status) |

**Report Data Includes**:

- **Booking Summary**: Total bookings, confirmed, checked-in, checked-out, cancelled
- **Room Overview**: Total rooms, available, occupied, maintenance, counts by room type
- **Service Request Overview**: Total requests, pending, in-progress, completed

---

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

---

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Tokens are provided in two ways:

1. **HttpOnly Cookie**: Automatically set on login (named `token`)
2. **Response Body**: Returned in login response for manual storage

### Using the Token

Include the token in requests using the `Authorization` header:

```
Authorization: Bearer <your-token-here>
```

Alternatively, if using cookies, the token is automatically included in requests.

### Token Expiration

Tokens expire after 7 days. After expiration, users must login again.

---

## HTTP Status Codes

- **200**: Success (GET, PATCH, DELETE)
- **201**: Created (POST)
- **400**: Bad Request (validation error)
- **401**: Unauthorized (authentication required or invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource doesn't exist)
- **409**: Conflict (duplicate resource)
- **500**: Internal Server Error

---

## Email Notifications

The system automatically sends email notifications for:

- **Booking Confirmation**: Sent when a booking is created
- **Booking Cancellation**: Sent when a booking is cancelled
- **Password Reset**: Sent when password reset OTP is requested

---

## Data Models

### User

- `name`: String (required)
- `email`: String (required, unique)
- `role`: String (guest, receptionist, housekeeping, admin)
- `isActive`: Boolean (default: true)
- `createdAt`: Date
- `updatedAt`: Date

### Room

- `roomNumber`: String (required, unique)
- `roomType`: String (standard, deluxe, suite, presidential)
- `price`: Number (required)
- `capacity`: Number (required)
- `status`: String (available, occupied, maintenance)
- `amenities`: Array of Strings
- `description`: String
- `imageUrl`: String
- `createdAt`: Date
- `updatedAt`: Date

### Booking

- `guest`: User ID reference
- `room`: Room ID reference
- `checkInDate`: Date (required)
- `checkOutDate`: Date (required)
- `totalPrice`: Number
- `status`: String (pending, confirmed, cancelled)
- `createdBy`: User ID reference
- `createdAt`: Date
- `updatedAt`: Date

### Service Request

- `booking`: Booking ID reference
- `requestedBy`: User ID reference
- `room`: Room ID reference
- `serviceType`: String (housekeeping, room_service, maintenance)
- `status`: String (pending, in_progress, completed)
- `assignedRole`: String (housekeeping, maintenance)
- `assignedTo`: User ID reference (staff member assigned to handle request)
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (v5+)
- npm

### Installation

```bash
cd hms-backend
npm install
```

### Configuration

Create a `.env` file with required variables:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hotel-management
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### Create Admin User

```bash
npm run create-admin
```

Default admin credentials:

- Email: `admin@hotel.com`
- Password: `admin123456`

### Start Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:5000`

---

## Testing the API

### Health Check

```bash
curl http://localhost:5000/health
```

### Login Example

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hotel.com",
    "password": "admin123456"
  }'
```

### Authenticated Request Example

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

---

## Support

For questions or issues, please contact the development team or create an issue in the project repository.

---

_Last Updated: December 24, 2025_
