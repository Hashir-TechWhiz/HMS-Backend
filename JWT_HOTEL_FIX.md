# Fix for "Receptionist must be assigned to hotel" Error

## Problem
The receptionist was assigned to a hotel (visible in the sidebar), but the backend was throwing an error: "Receptionist must be assigned to a hotel".

## Root Cause
The JWT token generated during login was not including the `hotelId` field. The token only contained:
- `id`
- `email`
- `role`

When the backend tried to filter bookings and service requests by hotel, it couldn't find the `hotelId` in `req.user` (which comes from the JWT token).

## Solution Applied

### 1. Updated JWT Token Generation
**File:** `src/services/authService.js`
**Method:** `generateToken()`

Added logic to include `hotelId` in the JWT payload for staff members:

```javascript
generateToken(user) {
    const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
    };

    // Include hotelId for staff members (receptionist, housekeeping)
    // This is needed for hotel-based filtering in queries
    if (user.hotelId) {
        payload.hotelId = user.hotelId;
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    return token;
}
```

### 2. Updated Authentication Middleware
**File:** `src/middleware/authenticate.js`

Added logic to extract `hotelId` from the decoded token and attach it to `req.user`:

```javascript
// Attach user information to request
req.user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
};

// Include hotelId if present in token (for receptionist/housekeeping)
if (decoded.hotelId) {
    req.user.hotelId = decoded.hotelId;
}
```

## IMPORTANT: Action Required

**The receptionist must LOG OUT and LOG BACK IN** for the fix to take effect.

### Why?
- The JWT token is generated during login
- Existing tokens in the browser don't have the `hotelId`
- A new login will generate a fresh token with `hotelId` included

## Testing Steps

1. **Log out** from the receptionist account
2. **Log back in** with the same credentials
3. Navigate to **Bookings** page
4. **Expected Result:** Should see only bookings from the assigned hotel (no error)
5. Navigate to **Service Requests** page
6. **Expected Result:** Should see only service requests from the assigned hotel (no error)

## Verification

To verify the fix is working:

1. Open browser DevTools (F12)
2. Go to **Application** tab → **Cookies**
3. Find the `token` cookie
4. Copy the token value
5. Go to [jwt.io](https://jwt.io)
6. Paste the token
7. Check the decoded payload - it should now include `hotelId`

Example of correct token payload:
```json
{
  "id": "user_id_here",
  "email": "receptionist@example.com",
  "role": "receptionist",
  "hotelId": "hotel_id_here",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## What This Fixes

✅ Receptionists can now view bookings from their assigned hotel
✅ Receptionists can now view service requests from their assigned hotel
✅ No more "Receptionist must be assigned to a hotel" error
✅ Hotel filtering works correctly at the database level
✅ Admins still see all records from all hotels

## Technical Details

The data flow is now:

1. **Login** → User object (with `hotelId`) → `generateToken()` → JWT includes `hotelId`
2. **API Request** → JWT cookie sent → `authenticate` middleware → Decodes token → `req.user.hotelId` set
3. **Service Layer** → Checks `currentUser.hotelId` → Adds to database query → Filters by hotel
4. **Response** → Only records from receptionist's hotel returned

## Files Modified

1. `src/services/authService.js` - Added `hotelId` to JWT payload
2. `src/middleware/authenticate.js` - Extract `hotelId` from token to `req.user`
3. `src/services/bookingService.js` - Filter bookings by `hotelId` for receptionists
4. `src/services/serviceRequestService.js` - Filter service requests by `hotelId` for receptionists
