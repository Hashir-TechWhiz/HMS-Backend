# Smart HMS - Daily 3× Room Cleaning Sessions Implementation

## Summary of Changes

This document outlines all changes made to implement the automatic generation of ALL THREE room-cleaning sessions per room per day, with hotel-scoped staff assignment for both cleaning rosters and service requests.

## Backend Changes

### 1. Database Model Updates

#### `HousekeepingRoster.js` Model
- **Changed**: Renamed field from `shift` to `session`
- **Changed**: Updated enum values from `["morning", "afternoon", "night"]` to `["MORNING", "AFTERNOON", "EVENING"]`
- **Updated**: All indexes to use `session` instead of `shift`
- **Maintained**: Unique compound index `{ hotelId, room, date, session }` ensures one task per room per session per day

### 2. Service Layer Updates

#### `housekeepingRosterService.js`
- **Enhanced**: `generateDailyTasks()` method now:
  - Creates ALL 3 sessions (MORNING, AFTERNOON, EVENING) atomically for each room
  - **Automatically assigns sessions to housekeepers** using workload-based distribution
  - Uses intelligent workload balancing - assigns to housekeeper with least pending tasks
  - Continuously rebalances during generation to ensure fair distribution
  - Uses `insertMany()` for atomic insertion of all 3 sessions at once
  - Applies to ALL rooms regardless of status (Active, Inactive, Occupied, Maintenance)
  - Implements idempotency - checks for existing sessions before creation
  - Returns detailed summary including `roomsProcessed`, `roomsSkipped`, `totalSessionsCreated`, `autoAssignedRooms`, and `availableHousekeepers`
  - If no housekeepers are available, sessions are created unassigned (can be assigned later by admin)

- **Updated**: `getCurrentShift()` renamed to `getCurrentSession()`
  - Returns uppercase values: "MORNING", "AFTERNOON", or "EVENING"

- **Updated**: All methods to use `session` instead of `shift`:
  - `getTasksByDate()`
  - `getMyTasks()`
  - `assignTask()`
  - `createCheckoutCleaningTask()`

- **Added**: `getCleaningSessions()` method
  - Admin-only access for roster view
  - Hotel-scoped filtering
  - Supports filters: session, status, roomId
  - Returns comprehensive session data with room and staff details

#### `userService.js`
- **Added**: `getHotelStaffByRole()` method
  - Fetches active staff members for a specific hotel
  - Supports role filtering (housekeeping, maintenance, receptionist)
  - Returns minimal staff data for assignment dropdowns

#### `serviceRequestService.js`
- **Maintained**: Existing hotel-scoped validation in `assignServiceRequest()`
  - Validates staff belongs to same hotel as service request
  - Validates staff role matches request assigned role
  - Prevents cross-hotel staff assignment

### 3. Controller Updates

#### `housekeepingRosterController.js`
- **Updated**: `getTasksByDate()` to use `session` query parameter
- **Updated**: `getMyTasks()` to use `session` query parameter
- **Added**: `getCleaningSessions()` method for admin roster view

#### `userController.js`
- **Added**: `getHotelStaffByRole()` controller method
  - Validates hotelId is provided
  - Returns hotel-scoped staff list

### 4. Route Updates

#### `housekeepingRosterRoutes.js`
- **Added**: `GET /api/housekeeping/cleaning-sessions` (Admin only)
  - Returns cleaning sessions for roster view

#### `adminUserRoutes.js`
- **Added**: `GET /api/admin/users/hotel-staff` (Admin only)
  - Query params: `hotelId` (required), `role` (optional)
  - Returns hotel-scoped staff for assignment

## Frontend Changes

### 1. Service Layer Updates

#### `housekeepingService.ts`
- **Updated**: `getTasksByDate()` parameter from `shift` to `session`
- **Updated**: `getMyTasks()` parameter from `shift` to `session`
- **Added**: `getCleaningSessions()` function
  - Calls `/housekeeping/cleaning-sessions` endpoint
  - Supports hotel, date, session, status, and roomId filters

- **Added**: `getHotelStaffByRole()` function
  - Calls `/admin/users/hotel-staff` endpoint
  - Returns hotel-scoped staff by role

### 2. Component Updates

#### `RosterManagementPage.tsx`
- **Updated**: All references from `shift` to `session`
- **Updated**: Filter values to uppercase: "MORNING", "AFTERNOON", "EVENING"
- **Updated**: `getShiftBadge()` renamed to `getSessionBadge()`
  - Updated color mappings for uppercase session values
- **Updated**: Filter dropdown labels from "All Shifts" to "All Sessions"
- **Updated**: `fetchHousekeepingStaff()` to use `getHotelStaffByRole()`
- **Maintained**: Hotel-scoped filtering for admin and receptionist roles
- **Maintained**: Existing assignment modal with hotel-scoped staff dropdown

## Key Features Implemented

### ✅ Atomic Daily Session Generation with Automatic Assignment
- All 3 sessions (MORNING, AFTERNOON, EVENING) created together per room
- **Sessions are automatically assigned to housekeepers** when generated
- Uses **workload-based distribution** algorithm:
  - Calculates current pending tasks for each housekeeper
  - Assigns new sessions to housekeeper with least workload
  - Continuously rebalances during generation for fair distribution
- Either all 3 sessions are created or none (atomic operation)
- Idempotent - prevents duplicate session creation
- Applies to ALL rooms regardless of status
- If no housekeepers available, sessions created unassigned (can be assigned later)

### ✅ Hotel-Scoped Staff Assignment
- **Cleaning Roster**: Only housekeeping staff from the same hotel can be assigned
- **Service Requests**: Only staff from the same hotel can be assigned
- Staff role must match the required role for the task
- Cross-hotel assignment is prevented at both backend and frontend levels

### ✅ Admin Roster View
- Admin can view all cleaning sessions for a selected hotel
- Filter by session (MORNING/AFTERNOON/EVENING), status, and room
- Default date is today
- Assign/reassign staff members to cleaning sessions
- Hotel selector for multi-hotel management

### ✅ RBAC & Security
- **Backend**: Validates hotelId on every request
- **Backend**: Enforces role checks (admin-only for generation and assignment)
- **Backend**: Blocks cross-hotel access
- **Frontend**: Hides assignment controls from unauthorized roles
- **Frontend**: Hotel-scoped staff dropdowns

## API Endpoints

### New Endpoints
```
GET  /api/housekeeping/cleaning-sessions?hotelId=&date=&session=&status=
GET  /api/admin/users/hotel-staff?hotelId=&role=
```

### Updated Endpoints
```
GET  /api/housekeeping/tasks?hotelId=&date=&session=&status=
GET  /api/housekeeping/my-tasks?date=&session=&status=
POST /api/housekeeping/generate (body: { hotelId, date })
PATCH /api/housekeeping/tasks/:id/assign (body: { staffId })
```

## Database Schema Changes

### HousekeepingRoster Collection
```javascript
{
  hotelId: ObjectId,               // Required
  room: ObjectId,                  // Required (changed from 'roomId')
  date: Date,                      // YYYY-MM-DD (normalized)
  session: "MORNING" | "AFTERNOON" | "EVENING",  // Changed from 'shift'
  assignedTo: ObjectId | null,
  status: "pending" | "in_progress" | "completed" | "skipped",
  priority: "low" | "normal" | "high" | "urgent",
  taskType: "routine" | "checkout_cleaning",
  notes: String,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Unique Index
```javascript
{ hotelId: 1, room: 1, date: 1, session: 1 } // UNIQUE
```

## Testing Recommendations

1. **Session Generation**:
   - Test generating sessions for a hotel with multiple rooms
   - Verify all 3 sessions are created for each room
   - Test idempotency by running generation twice for the same date
   - Verify sessions are created for rooms with different statuses

2. **Hotel-Scoped Assignment**:
   - Test assigning housekeeping staff from the same hotel
   - Verify cross-hotel assignment is blocked
   - Test assigning staff with incorrect roles

3. **Service Request Assignment**:
   - Test assigning service requests to staff from the same hotel
   - Verify role matching (housekeeping for cleaning, maintenance for maintenance, etc.)

4. **Admin Roster View**:
   - Test filtering by hotel, session, status
   - Verify only hotel-scoped staff appear in assignment dropdown
   - Test date navigation

5. **Automatic Assignment**:
   - Generate sessions for a hotel with multiple housekeepers
   - Verify workload is distributed evenly among available staff
   - Test with 1 housekeeper (all sessions assigned to same person)
   - Test with 0 housekeepers (sessions created unassigned)
   - Verify sessions can be manually reassigned by admin after generation

## Automatic Assignment Algorithm

### How It Works

When daily cleaning sessions are generated, the system automatically assigns them to housekeepers using an intelligent workload-based distribution algorithm:

#### Step 1: Calculate Current Workload
```javascript
// For each housekeeper, count pending/in-progress tasks for the day
const staffWorkload = await Promise.all(
    housekeepingStaff.map(async (staff) => {
        const pendingTasks = await HousekeepingRoster.countDocuments({
            hotelId,
            assignedTo: staff._id,
            date: taskDate,
            status: { $in: ["pending", "in_progress"] }
        });
        return { staffId: staff._id, staffName: staff.name, pendingTasks };
    })
);
```

#### Step 2: Sort by Workload
```javascript
// Sort staff by workload (least tasks first)
staffWorkload.sort((a, b) => a.pendingTasks - b.pendingTasks);
```

#### Step 3: Assign Sessions
```javascript
// For each session, assign to staff with least workload
const selectedStaff = staffWorkload[0];
assignedStaff = selectedStaff.staffId;

// Increment workload for next iteration
selectedStaff.pendingTasks++;

// Re-sort to maintain least-workload-first order
staffWorkload.sort((a, b) => a.pendingTasks - b.pendingTasks);
```

### Benefits

1. **Fair Distribution**: Ensures no single housekeeper is overloaded
2. **Dynamic Balancing**: Continuously rebalances during generation
3. **Existing Workload Aware**: Considers tasks already assigned for the day
4. **Scalable**: Works efficiently with any number of housekeepers
5. **Graceful Degradation**: If no housekeepers available, sessions created unassigned

### Example Scenario

**Hotel with 3 housekeepers and 10 rooms:**

| Housekeeper | Initial Tasks | After Generation | Total Sessions |
|-------------|---------------|------------------|----------------|
| Alice       | 2             | 12               | 10 sessions    |
| Bob         | 0             | 10               | 10 sessions    |
| Carol       | 1             | 11               | 10 sessions    |

**Distribution**: Bob gets assigned first (0 tasks), then Carol (1 task), then Alice (2 tasks), and the cycle continues ensuring balanced workload.


## Migration Notes

### Existing Data
If you have existing housekeeping roster data with the old `shift` field:
1. Run a migration script to rename `shift` to `session`
2. Update values: `"morning"` → `"MORNING"`, `"afternoon"` → `"AFTERNOON"`, `"night"` → `"EVENING"`
3. Drop old indexes and create new ones with `session` field

### Example Migration Script
```javascript
// MongoDB migration script
db.housekeepingrosters.updateMany(
  { shift: "morning" },
  { $rename: { shift: "session" }, $set: { session: "MORNING" } }
);
db.housekeepingrosters.updateMany(
  { shift: "afternoon" },
  { $rename: { shift: "session" }, $set: { session: "AFTERNOON" } }
);
db.housekeepingrosters.updateMany(
  { shift: "night" },
  { $rename: { shift: "session" }, $set: { session: "EVENING" } }
);
```

## Compliance with Requirements

✅ **Automatic generation of ALL THREE room-cleaning sessions per room per day (at once)** - Implemented with atomic `insertMany()`

✅ **Automatic assignment to housekeepers** - Sessions automatically assigned using workload-based distribution algorithm

✅ **Admin-only assignment of housekeeping staff** - Enforced via RBAC middleware

✅ **Hotel-scoped assignment for BOTH cleaning rosters and service requests** - Validated at service layer

✅ **Strict enforcement of multi-hotel isolation** - hotelId validated on all requests

✅ **Zero architectural or UI deviation from existing code** - Reused existing components, patterns, and architecture

✅ **Followed existing backend & frontend architecture** - Controller → Service → Model pattern maintained

✅ **Reused existing UI components** - DataTable, DialogBox, SelectField, Button, Badge

✅ **Did NOT refactor unrelated code** - Only touched necessary files

## Files Modified

### Backend
- `src/models/HousekeepingRoster.js`
- `src/services/housekeepingRosterService.js`
- `src/services/userService.js`
- `src/controllers/housekeeping/housekeepingRosterController.js`
- `src/controllers/admin/userController.js`
- `src/routes/housekeepingRosterRoutes.js`
- `src/routes/adminUserRoutes.js`

### Frontend
- `src/services/housekeepingService.ts`
- `src/components/page-components/dashboard/RosterManagementPage.tsx`

## Total Files Changed: 9
