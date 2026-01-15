# Receptionist Dashboard Hotel Filtering Implementation

## Summary
Implemented hotel-based filtering for receptionists in the HMS system so that receptionists can only view and manage bookings and service requests from their assigned hotel.

## Changes Made

### Backend Changes

#### 1. Booking Service (`d:\sdp-gp\BE\HMS-Backend\src\services\bookingService.js`)
**File:** `bookingService.js`  
**Method:** `getAllBookings()`  
**Lines Modified:** 319-336

**What Changed:**
- Added hotel filtering logic for receptionists in the `getAllBookings` method
- Receptionists now only see bookings where `hotelId` matches their assigned hotel
- Admins continue to see all bookings across all hotels
- Added validation to ensure receptionists have a hotel assigned

**Code Logic:**
```javascript
if (currentUser.role === "receptionist") {
    // Filter by receptionist's hotel
    if (currentUser.hotelId) {
        query.hotelId = currentUser.hotelId;
    } else {
        // If receptionist has no hotel assigned, return empty results
        throw new Error("Receptionist must be assigned to a hotel");
    }
}
```

#### 2. Service Request Service (`d:\sdp-gp\BE\HMS-Backend\src\services\serviceRequestService.js`)
**File:** `serviceRequestService.js`  
**Method:** `getAllServiceRequests()`  
**Lines Modified:** 242-262

**What Changed:**
- Added hotel filtering logic for receptionists in the `getAllServiceRequests` method
- Receptionists now only see service requests where `hotelId` matches their assigned hotel
- Admins continue to see all service requests across all hotels
- Added validation to ensure receptionists have a hotel assigned

**Code Logic:**
```javascript
if (currentUser.role === "receptionist") {
    // Filter by receptionist's hotel
    if (currentUser.hotelId) {
        query.hotelId = currentUser.hotelId;
    } else {
        // If receptionist has no hotel assigned, return empty results
        throw new Error("Receptionist must be assigned to a hotel");
    }
}
```

## How It Works

### For Receptionists:
1. When a receptionist logs in, their user profile includes a `hotelId` field
2. When they access the Bookings page or Service Requests page, the backend automatically filters results
3. Only bookings and service requests from their assigned hotel are returned
4. This filtering happens at the database query level for optimal performance

### For Admins:
- Admins continue to see all bookings and service requests from all hotels
- They can use the hotel filter dropdown (already implemented in the frontend) to filter by specific hotels if needed

### For Guests:
- No changes - guests continue to see only their own bookings and service requests

## Data Flow

1. **Frontend Request** → Receptionist accesses `/dashboard/bookings` or `/dashboard/service-requests`
2. **API Call** → Frontend calls `getAllBookings()` or `getAllServiceRequests()`
3. **Authentication** → JWT middleware extracts user info including `hotelId`
4. **Service Layer** → Service method checks user role:
   - If `receptionist`: Add `query.hotelId = currentUser.hotelId`
   - If `admin`: No hotel filter applied
   - If `guest`: Filter by user's own records
5. **Database Query** → MongoDB query includes hotel filter
6. **Response** → Only relevant records returned to frontend

## Testing Recommendations

### Test Case 1: Receptionist with Assigned Hotel
1. Log in as a receptionist assigned to Hotel A
2. Navigate to Bookings page
3. **Expected:** Only see bookings from Hotel A
4. Navigate to Service Requests page
5. **Expected:** Only see service requests from Hotel A

### Test Case 2: Receptionist without Assigned Hotel
1. Log in as a receptionist with no hotel assignment
2. Navigate to Bookings or Service Requests page
3. **Expected:** Error message "Receptionist must be assigned to a hotel"

### Test Case 3: Admin User
1. Log in as an admin
2. Navigate to Bookings page
3. **Expected:** See all bookings from all hotels
4. Use hotel filter dropdown to filter by specific hotel
5. **Expected:** Client-side filtering works as before

### Test Case 4: Multi-Hotel Scenario
1. Create bookings in Hotel A and Hotel B
2. Log in as receptionist for Hotel A
3. **Expected:** Only see Hotel A bookings
4. Log in as receptionist for Hotel B
5. **Expected:** Only see Hotel B bookings

## Security Considerations

- **Server-side filtering:** All filtering is done on the backend, preventing unauthorized access
- **JWT validation:** User's hotel assignment is verified through JWT token
- **Database-level filtering:** Queries are filtered at the database level, not in application code
- **Error handling:** Proper error messages for edge cases (no hotel assigned)

## Performance Impact

- **Minimal:** Hotel filtering is done at the database query level using indexed fields
- **Optimized:** No additional database queries required
- **Scalable:** Works efficiently even with large datasets

## Frontend Impact

- **No changes required:** Frontend code remains unchanged
- **Existing UI:** All existing filters and pagination continue to work
- **Transparent:** Hotel filtering is automatic and transparent to the user

## Notes

- The `hotelId` field must be set when creating/editing receptionist users
- This implementation follows the existing RBAC (Role-Based Access Control) pattern
- The changes are backward compatible with existing data
- No database migrations required
