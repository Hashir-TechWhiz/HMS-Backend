# Housekeeping Dashboard - Cleaning Tasks Not Showing Fix

## Issue
Housekeeping dashboard was only showing service requests but not showing roster/cleaning tasks assigned to the housekeeper.

## Root Cause
The `getMyTasks` method in `housekeepingRosterService.js` was using `currentUser.id` instead of `currentUser._id` to query for assigned tasks. This caused the query to fail silently and return no results.

## Solution

### Backend Fix
**File**: `src/services/housekeepingRosterService.js`

**Line 436**: Changed from:
```javascript
assignedTo: currentUser.id,
```

To:
```javascript
assignedTo: currentUser._id || currentUser.id,
```

This ensures compatibility with both `_id` (MongoDB ObjectId) and `id` (if it exists as a fallback).

### Frontend Debugging
**File**: `src/components/page-components/dashboard/HousekeepingDashboard.tsx`

Added console logging to help debug the issue:
- Log when fetching cleaning tasks
- Log the API response
- Log when setting cleaning tasks state
- Log errors if any occur

## How It Works Now

### Backend Flow:
1. Housekeeper makes request to `/api/housekeeping/my-tasks`
2. `getMyTasks` controller method is called
3. Service method queries: `{ hotelId: user.hotelId, assignedTo: user._id }`
4. Returns all cleaning tasks assigned to that housekeeper for today
5. Frontend receives the data and displays it

### Frontend Flow:
1. `HousekeepingDashboard` component mounts
2. Calls `getMyTasks({ date: today })` API
3. Receives cleaning tasks array
4. Combines with service requests for statistics
5. Displays:
   - Total pending tasks (cleaning + service)
   - Total in-progress tasks
   - Total completed today
   - Chart showing breakdown
   - Quick action buttons

## Testing

### To Verify the Fix:
1. Log in as a housekeeper
2. Check browser console for logs:
   ```
   Fetching cleaning tasks for user: <userId>
   Cleaning tasks response: { success: true, data: [...] }
   Setting cleaning tasks: [...]
   ```
3. Dashboard should now show:
   - Cleaning tasks count in KPI cards
   - Combined statistics in chart
   - "View Cleaning Tasks" button working

### Expected Behavior:
- **Before**: Dashboard showed only service requests (e.g., "0 pending tasks" even with assigned cleaning sessions)
- **After**: Dashboard shows combined count (e.g., "5 pending tasks: 3 cleaning + 2 service requests")

## Files Modified

### Backend:
1. `src/services/housekeepingRosterService.js` - Fixed user ID reference

### Frontend:
1. `src/components/page-components/dashboard/HousekeepingDashboard.tsx` - Added debugging logs

## API Endpoint

**GET** `/api/housekeeping/my-tasks`

**Authorization**: `housekeeping` role only

**Query Parameters**:
- `date` (optional): ISO date string, defaults to today
- `session` (optional): MORNING | AFTERNOON | EVENING
- `status` (optional): pending | in_progress | completed

**Response**:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "hotelId": "...",
      "room": {
        "roomNumber": "101",
        "roomType": "Deluxe"
      },
      "date": "2026-01-15T00:00:00.000Z",
      "session": "MORNING",
      "status": "pending",
      "priority": "normal",
      "taskType": "routine"
    }
  ]
}
```

## Related Documentation
- `HOUSEKEEPING_DASHBOARD_FIX.md` - Original dashboard enhancement
- `CLEANING_SESSIONS_IMPLEMENTATION.md` - Automatic session generation

## Status
✅ **FIXED** - Housekeepers can now see their assigned cleaning tasks in the dashboard
