# Smart Hotel Management System - Backend

A comprehensive, role-based hotel management system backend built with Node.js, Express, and MongoDB. This system streamlines hotel operations by providing secure, efficient tools for managing rooms, bookings, guests, and staff coordination.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [User Roles and Access Control](#user-roles-and-access-control)
5. [Core Backend Features](#core-backend-features)
6. [Security Considerations](#security-considerations)
7. [Environment Configuration](#environment-configuration)
8. [Quick Start Guide](#quick-start-guide)
9. [Admin User Bootstrap](#admin-user-bootstrap)
10. [API Design Notes](#api-design-notes)
11. [Development Workflow](#development-workflow)
12. [Future Enhancements](#future-enhancements)

---

## Project Overview

### What is the Smart Hotel Management System?

The Smart Hotel Management System is a modern backend application designed to automate and streamline hotel operations. It addresses the challenges hotels face in managing guest bookings, room availability, staff coordination, and service requests through a centralized, secure platform.

### Purpose and Problem Statement

Traditional hotel management often involves fragmented systems, manual processes, and inconsistent communication between departments. This system solves these problems by providing:

- **Centralized Management**: Single source of truth for all hotel operations
- **Real-time Coordination**: Immediate updates across all departments
- **Enhanced Security**: Role-based access ensures data privacy and integrity
- **Operational Efficiency**: Automated workflows reduce manual effort and errors

### Target Users

The system is designed to serve multiple user personas:

1. **Guests**: Individuals booking rooms and requesting services
2. **Staff Members**: Hotel employees managing day-to-day operations
   - Receptionists handling check-ins, check-outs, and bookings
   - Housekeeping staff managing room cleaning and maintenance
3. **Administrators**: System managers with full control over hotel operations

---

## System Architecture

### Backend Architecture Overview

The backend follows a **layered architecture** pattern, ensuring separation of concerns, maintainability, and scalability. Each layer has a distinct responsibility:

```
┌─────────────────────────────────────────┐
│           Client (Frontend)             │
└─────────────────┬───────────────────────┘
                  │ HTTP/HTTPS
┌─────────────────▼───────────────────────┐
│         Routes Layer                    │
│  (API endpoints, request routing)       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Middleware Layer                  │
│  (Authentication, Authorization,        │
│   Error Handling, Request Parsing)      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Controllers Layer                 │
│  (Request validation, Response          │
│   formatting, HTTP logic)               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        Services Layer                   │
│  (Business logic, Data processing,      │
│   External service integration)         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Models Layer                    │
│  (Data schemas, Database interaction,   │
│   Data validation)                      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Database (MongoDB)                 │
└─────────────────────────────────────────┘
```

### Layer Responsibilities

#### Routes Layer (`src/routes/`)

- Defines API endpoints and HTTP methods
- Maps URLs to controller functions
- Groups related endpoints logically
- Applies middleware to specific routes

#### Middleware Layer (`src/middleware/`)

- **Authentication**: Verifies user identity via JWT tokens
- **Authorization**: Checks user permissions based on roles
- **Error Handling**: Catches and formats errors consistently
- **Request Parsing**: Processes incoming request data

#### Controllers Layer (`src/controllers/`)

- Receives HTTP requests
- Validates request data
- Calls appropriate service methods
- Formats and sends HTTP responses
- Handles HTTP-specific concerns (status codes, headers)

#### Services Layer (`src/services/`)

- Contains core business logic
- Performs data validation and processing
- Coordinates between multiple models
- Integrates with external services (email, payments)
- Reusable across different controllers

#### Models Layer (`src/models/`)

- Defines data schemas using Mongoose
- Enforces data validation rules
- Provides database interaction methods
- Implements data transformation logic (e.g., password hashing)

### Separation of Concerns

This architecture ensures:

- **Maintainability**: Changes to one layer don't affect others
- **Testability**: Each layer can be tested independently
- **Reusability**: Business logic in services can be reused across controllers
- **Scalability**: New features can be added without restructuring existing code

---

## Technology Stack

### Backend Framework and Runtime

- **Node.js (v18+)**: JavaScript runtime for server-side execution
- **Express.js (v5.x)**: Minimal and flexible web application framework
- **ES Modules**: Modern JavaScript module system for cleaner imports

### Database

- **MongoDB**: NoSQL document database for flexible data storage
- **Mongoose (v9.x)**: ODM (Object Data Modeling) library for MongoDB
  - Schema definition and validation
  - Middleware hooks (e.g., password hashing)
  - Type casting and query building

### Authentication & Authorization

- **JSON Web Tokens (JWT)**: Stateless authentication mechanism
- **jsonwebtoken**: Library for creating and verifying JWTs
- **bcrypt**: Secure password hashing with salt rounds
- **cookie-parser**: Parse HttpOnly cookies for secure token storage
- **Role-Based Access Control (RBAC)**: Custom middleware for permission management

### Email and Notifications

- **Nodemailer**: Email sending capability for notifications
  - Booking confirmations
  - Account creation notifications
  - Password reset emails
  - Service request updates

### Development Tools

- **dotenv**: Environment variable management
- **nodemon**: Automatic server restart during development
- **CORS**: Cross-Origin Resource Sharing configuration

---

## User Roles and Access Control

The system implements a hierarchical role-based access control (RBAC) model with four distinct roles:

### 1. Guest

**Purpose**: Default role for hotel customers

**Responsibilities**:

- Browse available rooms
- Make and manage their own bookings
- Submit service requests (room service, housekeeping)
- View their booking history
- Update their profile information

**Access Level**: Limited to own data and public resources

---

### 2. Receptionist

**Purpose**: Front desk staff managing guest interactions

**Responsibilities**:

- Create and manage guest bookings
- Check guests in and out
- View room availability and status
- Process booking modifications and cancellations
- Access guest information for operational purposes
- Generate booking reports

**Access Level**: Full access to booking and guest management, read-only for staff data

---

### 3. Housekeeping Staff

**Purpose**: Staff responsible for room maintenance and cleanliness

**Responsibilities**:

- View assigned cleaning tasks
- Update room status (clean, dirty, maintenance required)
- Mark tasks as completed
- Report maintenance issues
- Access room availability schedules

**Access Level**: Limited to room status and housekeeping operations

---

### 4. Administrator

**Purpose**: System managers with full operational control

**Responsibilities**:

- Manage all user accounts (create, update, deactivate)
- Assign roles to users
- Configure system settings
- Access analytics and reports
- Manage room inventory
- Oversee all bookings and operations
- Handle escalated issues
- System configuration and maintenance

**Access Level**: Full access to all system features and data

---

### Role Hierarchy

```
Administrator
    │
    ├── Can manage all users and operations
    │
    ├── Receptionist
    │       └── Can manage bookings and guests
    │
    ├── Housekeeping
    │       └── Can manage room status
    │
    └── Guest
            └── Can manage own bookings
```

---

## Core Backend Features

### 1. Authentication and Authorization

#### Secure User Authentication

- **JWT-based authentication** with HttpOnly cookies
- Token expiration and automatic renewal
- Secure password hashing using bcrypt (10 salt rounds)
- Login/logout functionality
- Session management

#### Role-Based Access Control

- Middleware-based permission checking
- Route protection based on user roles
- Fine-grained access control for resources
- Admin-only operations enforcement

---

### 2. User and Role Management

#### User Operations

- **Create Users**: Admin-only user creation with role assignment
- **User Profiles**: View and update personal information
- **Account Status**: Activate/deactivate user accounts
- **Email Validation**: Ensure unique, valid email addresses
- **Password Security**: Minimum password requirements (6+ characters)

#### Role Assignment

- Admin can assign any role during user creation
- Default role is "guest" for self-registration (future feature)
- Role-based UI rendering (frontend integration point)

---

### 3. Room Management

_Section ready for expansion as room management features are implemented_

**Planned Features**:

- Room inventory management
- Room types and pricing
- Availability tracking
- Room status updates (available, occupied, maintenance)
- Photo and amenity management

---

### 4. Booking Management

_Section ready for expansion as booking features are implemented_

**Planned Features**:

- Create, read, update, delete bookings
- Availability checking and conflict prevention
- Check-in and check-out processing
- Booking history and tracking
- Cancellation and modification handling
- Booking confirmation emails

---

### 5. Guest Service Requests

_Section ready for expansion as service request features are implemented_

**Planned Features**:

- Submit service requests (room service, housekeeping, maintenance)
- Request status tracking
- Staff assignment to requests
- Priority management
- Request completion workflow
- Notification system for updates

---

### 6. Staff Coordination

_Section ready for expansion as staff coordination features are implemented_

**Planned Features**:

- Task assignment and tracking
- Shift management
- Inter-department communication
- Staff availability management
- Performance metrics

---

### 7. Admin Dashboards and Analytics

_Section ready for expansion as analytics features are implemented_

**Planned Features**:

- Occupancy statistics
- Revenue reports
- Booking trends
- Staff performance metrics
- Room utilization analytics
- Guest satisfaction metrics

---

### 8. Email Notifications

Nodemailer integration is configured and ready for:

- Booking confirmations
- Account creation notifications
- Password reset emails
- Service request updates
- Check-in/check-out reminders

_SMTP configuration required in environment variables_

---

## Security Considerations

### 1. JWT Authentication with HttpOnly Cookies

The system uses a dual-token approach for maximum security:

- **HttpOnly Cookies**: Primary token storage mechanism

  - Cannot be accessed via JavaScript (XSS protection)
  - Automatically included in requests
  - Secure flag enabled in production
  - SameSite attribute for CSRF protection

- **Bearer Tokens**: Alternative for API clients
  - Sent in Authorization header
  - Useful for mobile apps and third-party integrations

**Token Structure**:

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Token Expiration**: Configurable (default 7 days)

---

### 2. Role-Based Access Control (RBAC)

Access control is enforced at multiple levels:

#### Middleware Protection

```javascript
// Single role
router.delete(
  "/rooms/:id",
  authenticate,
  authorize("admin"),
  controller.deleteRoom
);

// Multiple roles
router.post(
  "/check-in",
  authenticate,
  authorize("admin", "receptionist"),
  controller.checkIn
);
```

#### Service-Level Checks

Business logic validates permissions even if middleware is bypassed.

#### Database-Level Security

- Passwords excluded from queries by default (`select: false`)
- Sensitive fields protected from updates
- User data scoped to authenticated user

---

### 3. Password Hashing

#### Pre-Save Hook

Passwords are automatically hashed before saving to database:

- **Algorithm**: bcrypt
- **Salt Rounds**: 10
- **One-way hashing**: Passwords cannot be decrypted
- **Only modified passwords are rehashed**

#### Password Comparison

```javascript
const isValid = await user.comparePassword(candidatePassword);
```

---

### 4. CORS Configuration

Cross-Origin Resource Sharing (CORS) is strictly controlled:

```javascript
{
  origin: process.env.FRONTEND_URL,  // Only allow trusted frontend
  credentials: true,                  // Allow cookies
  optionsSuccessStatus: 200
}
```

**Security Benefits**:

- Prevents unauthorized domains from accessing API
- Allows cookies to be sent cross-origin
- Environment-specific configuration

---

### 5. Environment-Based Configuration

All security-sensitive values are stored in environment variables:

- **JWT_SECRET**: Secret key for token signing (must be changed in production)
- **MONGODB_URI**: Database connection string
- **FRONTEND_URL**: Trusted frontend origin
- **Email credentials**: SMTP configuration

**Best Practices**:

- Never commit `.env` file to version control
- Use strong, random secrets in production
- Different secrets for different environments
- Regular credential rotation

---

### 6. Additional Security Measures

#### Input Validation

- Email format validation using regex
- Password minimum length requirements
- Role validation against allowed values
- Mongoose schema validation

#### Error Handling

- Generic error messages to prevent information leakage
- Detailed logging for debugging (server-side only)
- Consistent error response format

#### Rate Limiting (Recommended for Production)

_Ready for implementation_

- Limit login attempts
- Prevent brute force attacks
- Protect against DDoS

---

## Environment Configuration

The system requires specific environment variables to function correctly. Create a `.env` file in the root of the backend project.

### Required Environment Variables

#### Server Configuration

```env
# Server port
PORT=5000
```

- **PORT**: Port number on which the server listens
- Default: 5000
- Change if another service uses this port

---

#### Database Configuration

```env
# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/hotel-management
```

- **MONGO_URI**: MongoDB connection string
- Local development: `mongodb://localhost:27017/hotel-management`
- Production: Use MongoDB Atlas or your hosted instance
- Include authentication if required: `mongodb://username:password@host:port/database`

---

#### JWT Configuration

```env
# JWT secret and expiration
JWT_SECRET=your-super-secret-key-change-in-production-use-long-random-string
JWT_EXPIRES_IN=7d
```

- **JWT_SECRET**: Secret key for signing tokens

  - **CRITICAL**: Must be long, random, and unique
  - Generate using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
  - Never reuse across environments
  - Keep absolutely confidential

- **JWT_EXPIRES_IN**: Token expiration time
  - Format: `1d`, `7d`, `24h`, `60m`
  - Balance security (shorter) vs. convenience (longer)
  - Recommended: 7 days for development, 1-2 days for production

---

#### CORS Configuration

```env
# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

- **FRONTEND_URL**: Allowed origin for cross-origin requests
- Development: `http://localhost:3000` (React/Vue/Angular default)
- Production: Your deployed frontend URL (e.g., `https://hotel.example.com`)
- Only this origin can make authenticated requests to the API

---

#### Admin Bootstrap (Optional)

```env
# Initial admin user (optional - uses defaults if not provided)
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@hotel.com
ADMIN_PASSWORD=admin123456
```

- Used by the admin creation script
- If not provided, defaults are used:
  - Name: "System Admin"
  - Email: "admin@hotel.com"
  - Password: "admin123456"
- **IMPORTANT**: Change default password immediately after first login

---

#### Email Configuration (Optional - for notifications)

```env
# Email configuration for Nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Hotel Management System <noreply@hotel.com>
```

- Required for email notifications
- Not required for basic system functionality
- Gmail example shown (other SMTP providers work similarly)

---

### Example `.env` File

```env
# Server
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/hotel-management

# JWT
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Admin Bootstrap (optional)
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@hotel.com
ADMIN_PASSWORD=SecurePassword123!

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hotel@gmail.com
SMTP_PASS=app-specific-password
EMAIL_FROM=Hotel Management <noreply@hotel.com>
```

---

### Security Notes

1. **Never commit `.env` to version control**

   - Add `.env` to `.gitignore`
   - Use `.env.example` as template (without actual values)

2. **Use different secrets for different environments**

   - Development, staging, and production should have unique JWT secrets

3. **Protect your `.env` file**

   - Restrict file permissions: `chmod 600 .env`
   - Store production secrets in secure secret management systems (AWS Secrets Manager, Azure Key Vault, etc.)

4. **Rotate secrets regularly**
   - Change JWT_SECRET periodically
   - Update database passwords
   - Rotate SMTP credentials

---

## Quick Start Guide

Get the Smart Hotel Management System backend running in minutes.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)

  - Download: https://nodejs.org/
  - Verify: `node --version`

- **npm** (comes with Node.js)

  - Verify: `npm --version`

- **MongoDB** (v5 or higher)

  - Download: https://www.mongodb.com/try/download/community
  - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
  - Verify: `mongod --version`

- **Git** (for cloning the repository)
  - Download: https://git-scm.com/
  - Verify: `git --version`

---

### Step 1: Install Dependencies

Navigate to the backend directory and install required packages:

```bash
cd hms-backend
npm install
```

This installs all dependencies listed in `package.json`:

- express, mongoose, jsonwebtoken, bcrypt, cors, dotenv, nodemailer, cookie-parser
- nodemon (development)

---

### Step 2: Configure Environment Variables

Create a `.env` file in the `hms-backend` directory:

```bash
# Create .env file
touch .env
```

Add the following configuration (modify as needed):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hotel-management
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

**Important**:

- Change `JWT_SECRET` to a long, random string
- Ensure MongoDB is running on the specified URI
- Adjust `PORT` if 5000 is already in use

---

### Step 3: Start MongoDB

Ensure MongoDB is running before starting the server.

#### Local MongoDB:

```bash
# macOS/Linux
sudo systemctl start mongod

# Windows (Run as Administrator)
net start MongoDB

# Or start mongod directly
mongod
```

#### MongoDB Atlas:

- Use the connection string from your Atlas cluster
- Update `MONGO_URI` in `.env` with the Atlas connection string

---

### Step 4: Create the Initial Admin User

**CRITICAL**: This step must be completed before using the system.

Run the admin creation script:

```bash
npm run create-admin
```

**Expected Output**:

```
✅ Connected to MongoDB
✅ Admin user created successfully!
==========================================
Name: System Admin
Email: admin@hotel.com
Role: admin
==========================================

⚠️ IMPORTANT: Change the default password after first login!

You can now login with these credentials to create other users.
```

**Default Credentials**:

- Email: `admin@hotel.com`
- Password: `admin123456`

**If admin already exists**:

```
✅ Connected to MongoDB
Admin user already exists:
Email: admin@hotel.com
Name: System Admin

If you want to create a new admin, delete this one first.
```

---

### Step 5: Start the Development Server

Start the server with automatic restart on file changes:

```bash
npm run dev
```

**Expected Output**:

```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

---

### Step 6: Verify the Server is Running

Test the health endpoint:

#### Using curl:

```bash
curl http://localhost:5000/health
```

#### Using your browser:

Navigate to: `http://localhost:5000/health`

**Expected Response**:

```json
{
  "status": "OK"
}
```

---

### Step 7: Test Authentication

Login with the admin account:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hotel.com",
    "password": "admin123456"
  }'
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "System Admin",
      "email": "admin@hotel.com",
      "role": "admin",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Copy the token** from the response - you'll need it for authenticated requests.

---

### Step 8: Test an Authenticated Request

Get the admin user profile:

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with the token from the login response.

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "System Admin",
    "email": "admin@hotel.com",
    "role": "admin",
    "isActive": true
  }
}
```

---

### Quick Start Troubleshooting

| Issue                           | Solution                                                      |
| ------------------------------- | ------------------------------------------------------------- |
| **"Error: Cannot find module"** | Run `npm install`                                             |
| **"MongoDB connection error"**  | Ensure MongoDB is running and `MONGO_URI` is correct          |
| **"Port 5000 already in use"**  | Change `PORT` in `.env` or stop other service using port 5000 |
| **"Invalid token"**             | Login again to get a fresh token                              |
| **"JWT_SECRET is not defined"** | Ensure `.env` file exists and contains `JWT_SECRET`           |
| **"Admin already exists"**      | Admin user is already created - proceed to start server       |

---

### Next Steps

1. **Change default admin password** (recommended immediately)
2. **Create additional users** (receptionist, housekeeping, guests)
3. **Test API endpoints** using Postman or curl
4. **Integrate with frontend** (when ready)
5. **Explore API documentation** in this README

---

## Admin User Bootstrap

### Why is an Initial Admin Required?

The Smart Hotel Management System implements strict role-based access control where **only administrators can create new users**. This security measure prevents unauthorized account creation but creates a "chicken-and-egg" problem: you need an admin to create the first user, but there are no users initially.

The admin bootstrap process solves this by providing a secure, one-time method to create the first administrator account.

---

### How the Admin User is Created

The system includes a dedicated Node.js script (`src/utils/createAdmin.js`) that:

1. **Connects to the database** using the `MONGO_URI` from `.env`
2. **Checks for existing admin users** to prevent duplicates
3. **Creates a new admin user** with credentials from environment variables (or defaults)
4. **Hashes the password** using bcrypt for security
5. **Saves the user** to the database
6. **Displays credentials** for first login
7. **Closes the connection** and exits

---

### When to Execute the Bootstrap

**Execute the admin creation script**:

- ✅ **First-time setup**: When setting up the system for the first time
- ✅ **Clean database**: After dropping/resetting the database
- ✅ **New environment**: When deploying to a new environment (staging, production)

**Do NOT execute the script**:

- ❌ After the admin user already exists (script will notify you)
- ❌ During normal development or testing
- ❌ Multiple times (use the existing admin to create additional admins if needed)

---

### How to Create the Admin User

#### Method 1: Using npm Script (Recommended)

```bash
npm run create-admin
```

This runs: `node src/utils/createAdmin.js`

---

#### Method 2: Direct Execution

```bash
node src/utils/createAdmin.js
```

---

### Default Admin Credentials

If no environment variables are provided, the script uses these defaults:

```
Name:     System Admin
Email:    admin@hotel.com
Password: admin123456
Role:     admin
Status:   Active
```

---

### Custom Admin Credentials

To create an admin with custom credentials, add these to your `.env`:

```env
ADMIN_NAME=John Administrator
ADMIN_EMAIL=john.admin@hotel.com
ADMIN_PASSWORD=SecurePassword123!
```

Then run:

```bash
npm run create-admin
```

---

### Script Output Examples

#### Success (First Run):

```
✅ Connected to MongoDB
✅ Admin user created successfully!
==========================================
Name: System Admin
Email: admin@hotel.com
Role: admin
==========================================

⚠️ IMPORTANT: Change the default password after first login!

You can now login with these credentials to create other users.
```

#### Admin Already Exists:

```
✅ Connected to MongoDB
Admin user already exists:
Email: admin@hotel.com
Name: System Admin

If you want to create a new admin, delete this one first.
```

#### Error:

```
❌ Error: MongoDB connection string is missing!
```

_Solution_: Ensure `MONGO_URI` is set in `.env`

---

### Security Best Practices

#### 1. Change Default Password Immediately

After first login, change the admin password:

_This feature will be available via API endpoint - implementation pending_

Planned endpoint: `PATCH /api/auth/me/password`

---

#### 2. Use Strong Passwords

For production environments:

- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Not dictionary words
- Unique to this system

---

#### 3. Protect Admin Credentials

- Never share admin credentials via email or chat
- Store securely using password managers
- Rotate credentials periodically
- Use multi-factor authentication (future enhancement)

---

#### 4. Create Role-Specific Accounts

After creating the initial admin:

- Create separate accounts for each staff member
- Assign appropriate roles (receptionist, housekeeping)
- Don't share the admin account for daily operations
- Use admin account only for administrative tasks

---

#### 5. Audit Trail

_Future Enhancement_: Track admin actions

- Log user creation/modification
- Track role changes
- Monitor admin access patterns

---

### Creating Additional Administrators

Once logged in as admin, you can create additional admin users via API:

```bash
curl -X POST http://localhost:5000/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Jane Administrator",
    "email": "jane.admin@hotel.com",
    "password": "SecurePassword456!",
    "role": "admin"
  }'
```

---

### Resetting Admin Access

If you lose admin credentials:

1. **Stop the server**
2. **Delete existing admin from database**:
   ```javascript
   // MongoDB Shell
   use hotel-management
   db.users.deleteOne({ role: "admin", email: "admin@hotel.com" })
   ```
3. **Run admin creation script again**:
   ```bash
   npm run create-admin
   ```
4. **Start the server** and login with new credentials

---

## API Design Notes

### RESTful API Principles

The API follows REST (Representational State Transfer) architectural principles:

#### Resource-Based URLs

- URLs represent resources (nouns), not actions (verbs)
- Examples:
  - `GET /api/auth/users` - Get all users
  - `GET /api/auth/users/:id` - Get specific user
  - `POST /api/auth/users` - Create user
  - `PATCH /api/auth/users/:id` - Update user
  - `DELETE /api/auth/users/:id` - Delete user

#### HTTP Methods

- **GET**: Retrieve resources (read-only, idempotent)
- **POST**: Create new resources
- **PATCH**: Partial update to resources
- **PUT**: Full replacement of resources
- **DELETE**: Remove resources

#### Status Codes

- **200 OK**: Successful GET, PATCH, PUT, DELETE
- **201 Created**: Successful POST
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Authenticated but lacking permissions
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource conflict (e.g., duplicate email)
- **500 Internal Server Error**: Unexpected server error

---

### Error Handling Strategy

#### Consistent Error Response Format

All errors return JSON in this structure:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "error": {
    "type": "ErrorType",
    "details": "Additional error details (development only)"
  }
}
```

#### Error Types

1. **Validation Errors** (400)

   ```json
   {
     "success": false,
     "message": "Email and password are required"
   }
   ```

2. **Authentication Errors** (401)

   ```json
   {
     "success": false,
     "message": "Invalid or expired token"
   }
   ```

3. **Authorization Errors** (403)

   ```json
   {
     "success": false,
     "message": "Access denied. Admin role required."
   }
   ```

4. **Not Found Errors** (404)

   ```json
   {
     "success": false,
     "message": "User not found"
   }
   ```

5. **Conflict Errors** (409)
   ```json
   {
     "success": false,
     "message": "User with this email already exists"
   }
   ```

#### Global Error Handler

All errors are caught and formatted by the global error handler middleware (`src/middleware/errorHandler.js`):

- Logs errors server-side for debugging
- Returns generic messages to prevent information leakage
- Includes stack traces only in development mode
- Handles both operational and programming errors

---

### Authentication Flow

#### Login Flow

```
1. Client sends credentials
   POST /api/auth/login
   { email, password }
          ↓
2. Server validates credentials
   - Find user by email
   - Compare password hash
          ↓
3. Server generates JWT
   - Payload: { id, email, role }
   - Signs with JWT_SECRET
   - Sets expiration
          ↓
4. Server responds with token
   - HttpOnly cookie (automatic)
   - JSON response body (for manual storage)
          ↓
5. Client stores token
   - Cookie (automatic)
   - localStorage/sessionStorage (manual)
```

#### Authenticated Request Flow

```
1. Client includes token
   Authorization: Bearer <token>
   OR
   Cookie: token=<token> (automatic)
          ↓
2. authenticate middleware
   - Extracts token from header or cookie
   - Verifies token signature
   - Decodes payload
   - Attaches user to req.user
          ↓
3. authorize middleware (if role-specific)
   - Checks req.user.role
   - Compares against required roles
   - Allows or denies access
          ↓
4. Controller processes request
   - Access user data via req.user
   - Call service methods
   - Return response
```

#### Logout Flow

```
1. Client requests logout
   POST /api/auth/logout
          ↓
2. Server clears cookie
   - Sets token cookie with maxAge: 0
   - Clears cookie value
          ↓
3. Client receives confirmation
   { success: true, message: "Logged out successfully" }
          ↓
4. Client clears token
   - Remove from localStorage (if stored)
   - Delete Authorization header
```

---

### API Endpoints Summary

#### Authentication Endpoints

| Method | Endpoint           | Access     | Description                 |
| ------ | ------------------ | ---------- | --------------------------- |
| POST   | `/api/auth/login`  | Public     | User login                  |
| POST   | `/api/auth/logout` | Public     | User logout (clears cookie) |
| GET    | `/api/auth/me`     | Protected  | Get current user profile    |
| PATCH  | `/api/auth/me`     | Protected  | Update current user profile |
| POST   | `/api/auth/users`  | Admin Only | Create new user             |

---

### Request/Response Examples

#### POST `/api/auth/login`

**Request**:

```json
{
  "email": "admin@hotel.com",
  "password": "admin123456"
}
```

**Response (Success)**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65f123456789abcdef012345",
      "name": "System Admin",
      "email": "admin@hotel.com",
      "role": "admin",
      "isActive": true,
      "createdAt": "2024-12-24T10:00:00.000Z",
      "updatedAt": "2024-12-24T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error)**:

```json
{
  "success": false,
  "message": "Invalid email"
}
```

---

#### GET `/api/auth/me`

**Headers**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "65f123456789abcdef012345",
    "name": "System Admin",
    "email": "admin@hotel.com",
    "role": "admin",
    "isActive": true
  }
}
```

---

#### POST `/api/auth/users` (Admin Only)

**Headers**:

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request**:

```json
{
  "name": "Jane Receptionist",
  "email": "jane@hotel.com",
  "password": "password123",
  "role": "receptionist"
}
```

**Response**:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "65f123456789abcdef012346",
    "name": "Jane Receptionist",
    "email": "jane@hotel.com",
    "role": "receptionist",
    "isActive": true
  }
}
```

---

### API Testing with Postman

#### Setting Up Postman Collection

1. **Create a new collection**: "Hotel Management API"
2. **Add environment variables**:

   - `base_url`: `http://localhost:5000`
   - `token`: (will be set automatically)

3. **Create requests**:

   - Login
   - Get Profile
   - Create User
   - Logout

4. **Add test scripts** to automatically store tokens:

   ```javascript
   // In Login request's Tests tab
   if (pm.response.code === 200) {
     const response = pm.response.json();
     pm.environment.set("token", response.data.token);
   }
   ```

5. **Use variables** in request headers:
   ```
   Authorization: Bearer {{token}}
   ```

---

## Development Workflow

### Running the Development Server

#### Start with Auto-Reload

```bash
npm run dev
```

Uses `nodemon` to automatically restart when files change.

#### Start in Production Mode

```bash
npm start
```

Runs server without auto-reload (for production/deployment).

---

### Making Code Changes

#### 1. Understand the Layer You're Modifying

- **Models**: Data structure changes
- **Services**: Business logic changes
- **Controllers**: Request/response handling
- **Middleware**: Cross-cutting concerns
- **Routes**: Endpoint definitions

#### 2. Follow the Existing Patterns

- Use ES modules (`import`/`export`)
- Use async/await for asynchronous operations
- Follow consistent error handling patterns
- Use existing middleware for authentication

#### 3. Test Your Changes

Test endpoints using:

- **Postman** (recommended for manual testing)
- **curl** (quick command-line testing)
- **Frontend integration** (when available)

---

### Adding New Features

#### Example: Adding Room Management

1. **Create Model** (`src/models/Room.js`):

   ```javascript
   import mongoose from "mongoose";

   const roomSchema = new mongoose.Schema(
     {
       number: { type: String, required: true, unique: true },
       type: { type: String, required: true },
       price: { type: Number, required: true },
       status: {
         type: String,
         enum: ["available", "occupied", "maintenance"],
         default: "available",
       },
     },
     { timestamps: true }
   );

   export default mongoose.model("Room", roomSchema);
   ```

2. **Create Service** (`src/services/roomService.js`):

   ```javascript
   import Room from "../models/Room.js";

   class RoomService {
     async createRoom(roomData) {
       const room = new Room(roomData);
       await room.save();
       return room;
     }

     async getAllRooms() {
       return await Room.find();
     }

     // ... more methods
   }

   export default new RoomService();
   ```

3. **Create Controller** (`src/controllers/roomController.js`):

   ```javascript
   import roomService from "../services/roomService.js";

   export const createRoom = async (req, res, next) => {
     try {
       const room = await roomService.createRoom(req.body);
       res.status(201).json({
         success: true,
         data: room,
       });
     } catch (error) {
       next(error);
     }
   };
   ```

4. **Create Routes** (`src/routes/roomRoutes.js`):

   ```javascript
   import express from "express";
   import * as roomController from "../controllers/roomController.js";
   import { authenticate, authorize } from "../middleware/index.js";

   const router = express.Router();

   router.post(
     "/",
     authenticate,
     authorize("admin"),
     roomController.createRoom
   );

   export default router;
   ```

5. **Register Routes** (`src/app.js`):

   ```javascript
   import roomRoutes from "./routes/roomRoutes.js";
   app.use("/api/rooms", roomRoutes);
   ```

6. **Update README.md** (this file):
   - Expand "Room Management" section in Core Backend Features
   - Add endpoints to API Design Notes
   - Include examples in Development Workflow

---

### Updating This README

As you add features, update relevant sections:

#### Feature Implementation Checklist

- [ ] Code implementation complete
- [ ] Tested with Postman/curl
- [ ] Update Core Backend Features section
- [ ] Add API endpoints to API Design Notes
- [ ] Include request/response examples
- [ ] Update User Roles if permissions change
- [ ] Add to Development Workflow (if complex feature)
- [ ] Update Future Enhancements (remove completed items)

#### README Maintenance

- Keep sections organized and consistent
- Update examples when APIs change
- Remove obsolete information
- Keep Quick Start accurate
- Document breaking changes prominently

---

### Testing Approach

#### Manual Testing with Postman

**Recommended for development**

1. **Organize requests** by feature
2. **Use environment variables** for base URL and tokens
3. **Create test collections** for regression testing
4. **Document expected responses**

#### Testing Checklist for New Endpoints

- [ ] Success case (200/201)
- [ ] Validation errors (400)
- [ ] Unauthorized access (401)
- [ ] Forbidden access (403)
- [ ] Not found (404)
- [ ] Conflict errors (409)
- [ ] Edge cases (empty data, special characters)

---

### Git Workflow (Recommended)

```bash
# Create feature branch
git checkout -b feature/room-management

# Make changes and commit frequently
git add .
git commit -m "Add room model and service"

# Push to remote
git push origin feature/room-management

# Create pull request for review
```

---

### Code Quality

#### Follow Existing Conventions

- **Naming**: camelCase for variables, PascalCase for models
- **File structure**: One model/service/controller per file
- **Comments**: Explain "why", not "what"
- **Error messages**: User-friendly and actionable

#### Before Committing

- [ ] Code follows existing patterns
- [ ] No console.log statements (use proper logging)
- [ ] Error handling in place
- [ ] README updated if necessary
- [ ] Test manually with Postman

---

## Future Enhancements

This section outlines planned features and improvements for the Smart Hotel Management System backend.

### Frontend Integration

#### React/Vue/Angular Frontend

- Complete user interface for all roles
- Dashboard for admins, receptionists, and housekeeping
- Guest portal for booking and service requests
- Real-time updates using WebSocket
- Responsive design for mobile and tablet

#### Integration Points

- API client libraries
- Authentication state management
- Real-time notifications
- File upload for room photos and documents

---

### Payment Gateway Integration

#### Planned Payment Features

- Secure payment processing for bookings
- Multiple payment methods (credit/debit card, digital wallets)
- Payment history and invoicing
- Refund processing for cancellations
- Payment confirmation emails

#### Potential Providers

- Stripe
- PayPal
- Square
- Razorpay (regional)

---

### Advanced Reporting and Analytics

#### Dashboard Metrics

- Real-time occupancy rates
- Revenue analytics and forecasting
- Booking trends and patterns
- Staff performance metrics
- Guest satisfaction scores

#### Report Generation

- Custom date range reports
- Exportable reports (PDF, Excel)
- Automated scheduled reports
- Comparative analysis (month-over-month, year-over-year)

---

### Booking System Enhancements

#### Advanced Booking Features

- Multi-room bookings
- Group reservations
- Booking modifications and extensions
- Early check-in/late check-out requests
- Waitlist management
- Recurring bookings (corporate clients)

#### Smart Availability

- Dynamic pricing based on demand
- Seasonal rate adjustments
- Promotional codes and discounts
- Package deals (room + services)

---

### Communication Features

#### Internal Communication

- Staff messaging system
- Department-to-department communication
- Task assignment notifications
- Shift change coordination

#### Guest Communication

- Email notifications
- SMS alerts (booking confirmations, reminders)
- In-app messaging
- Feedback and review collection

---

### Room Management Enhancements

#### Comprehensive Room Data

- Photo galleries for each room
- Detailed amenity lists
- Room capacity and bed configurations
- Accessibility features
- Virtual tours

#### Maintenance Tracking

- Scheduled maintenance calendar
- Issue reporting and tracking
- Maintenance history
- Vendor management

---

### Housekeeping Module

#### Task Management

- Automated task assignment based on room status
- Priority management for urgent requests
- Task completion tracking with timestamps
- Supply inventory management
- Quality inspection checklists

#### Optimization

- Route optimization for cleaning staff
- Workload balancing
- Performance metrics

---

### Guest Services Module

#### Service Request System

- Room service orders
- Housekeeping requests
- Maintenance issues
- Concierge services
- Wake-up calls

#### Request Tracking

- Real-time status updates
- Staff assignment
- Priority levels
- Completion confirmation
- Guest feedback

---

### Security Enhancements

#### Advanced Authentication

- Multi-factor authentication (MFA)
- Social login (Google, Facebook)
- Biometric authentication (mobile app)
- Single Sign-On (SSO) for enterprise clients

#### Security Monitoring

- Rate limiting and throttling
- Suspicious activity detection
- Audit logs for sensitive operations
- IP whitelisting for admin access
- Automated security alerts

---

### API Enhancements

#### API Versioning

- Support multiple API versions
- Deprecation notices
- Backward compatibility

#### API Documentation

- Interactive API documentation (Swagger/OpenAPI)
- Code examples in multiple languages
- Postman collection export
- SDK for popular languages

#### GraphQL Support

- GraphQL endpoint for flexible queries
- Real-time subscriptions
- Reduced over-fetching

---

### Performance Optimizations

#### Database Optimization

- Indexing strategy for common queries
- Query optimization
- Database sharding for scalability
- Read replicas for load distribution

#### Caching

- Redis for session management
- API response caching
- Database query caching
- Static asset caching

#### Load Balancing

- Horizontal scaling support
- Load balancer configuration
- Session persistence

---

### Deployment Considerations

#### Containerization

- Docker containerization
- Docker Compose for local development
- Kubernetes orchestration

#### CI/CD Pipeline

- Automated testing
- Continuous integration
- Automated deployment
- Environment-specific configurations

#### Cloud Deployment

- AWS deployment guide
- Azure deployment guide
- Google Cloud Platform guide
- Environment configuration management

#### Monitoring and Logging

- Application performance monitoring (APM)
- Centralized logging (ELK stack, CloudWatch)
- Error tracking (Sentry)
- Uptime monitoring
- Performance metrics dashboard

---

### Internationalization

- Multi-language support
- Currency conversion
- Time zone handling
- Regional date/time formats
- Localized email templates

---

### Compliance and Privacy

#### Data Protection

- GDPR compliance
- Data encryption at rest and in transit
- Personal data export functionality
- Right to deletion implementation
- Privacy policy enforcement

#### Accessibility

- WCAG 2.1 compliance
- Screen reader support
- Keyboard navigation
- High contrast themes

---

### Integration Ecosystem

#### Third-Party Integrations

- Online Travel Agencies (OTAs) integration
- Property Management Systems (PMS)
- Channel managers
- Calendar synchronization (Google Calendar, Outlook)
- Accounting software integration

#### APIs for Partners

- Public API for third-party developers
- Webhook system for event notifications
- API key management

---

### Mobile Application

#### Native Mobile Apps

- iOS application (Swift/SwiftUI)
- Android application (Kotlin)
- Cross-platform (React Native / Flutter)

#### Mobile Features

- Push notifications
- Offline mode support
- Mobile check-in/check-out
- Digital room keys
- Mobile payments

---

### Artificial Intelligence

#### Predictive Analytics

- Demand forecasting
- Dynamic pricing recommendations
- Maintenance prediction
- Staff scheduling optimization

#### Chatbot

- AI-powered guest support
- Booking assistance
- FAQ automation
- Multi-language support

---

## Project Structure

```
hms-backend/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Server startup
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── nodemailer.js         # Email configuration
│   ├── models/
│   │   └── User.js               # User model (with password hashing)
│   ├── services/
│   │   └── authService.js        # Authentication business logic
│   ├── controllers/
│   │   └── auth/
│   │       └── authController.js # Authentication request handlers
│   ├── middleware/
│   │   ├── index.js              # Middleware exports
│   │   ├── authenticate.js       # JWT authentication middleware
│   │   ├── authorize.js          # Role-based authorization middleware
│   │   └── errorHandler.js       # Global error handler
│   ├── routes/
│   │   └── authRoutes.js         # Authentication endpoints
│   └── utils/
│       ├── cookieUtils.js        # Cookie helper functions
│       ├── createAdmin.js        # Admin bootstrap script
│       └── testAuth.js           # Authentication testing utilities
├── .env                          # Environment variables (not committed)
├── .gitignore                    # Git ignore file
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Locked dependencies
└── README.md                     # This file
```

---

## Available NPM Scripts

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev

# Create initial admin user
npm run create-admin
```

---

## Contributing

As this project grows, contributions will be welcomed. Future guidelines will include:

- Code style guide
- Pull request process
- Testing requirements
- Documentation standards

---

## License

ISC

---

## Support and Contact

For questions, issues, or suggestions regarding the Smart Hotel Management System backend, please create an issue in the project repository or contact the development team.

---

## Version History

### v1.0.0 (Current)

- Initial backend implementation
- User authentication with JWT (HttpOnly cookies)
- Role-based access control (4 roles: guest, receptionist, housekeeping, admin)
- Admin user bootstrap functionality
- User management (admin-only user creation)
- Basic profile management
- RESTful API structure
- Comprehensive documentation

---

## Acknowledgments

Built with modern Node.js best practices and industry-standard security measures to provide a reliable foundation for hotel management operations.

---

_Last Updated: December 24, 2025_
