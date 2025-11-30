# Session Module

Complete session management system with AI-powered attendance tracking, snapshots, and manual corrections.

## Entities

### ClassSession
- `id` (UUID)
- `groupId` (UUID, FK to Group)
- `teacherId` (UUID, FK to Teacher)
- `classroomId` (UUID, FK to Classroom)
- `deviceId` (UUID, FK to Device, nullable)
- `scheduledStart` (timestamp)
- `scheduledEnd` (timestamp)
- `actualStart` (timestamp, nullable)
- `actualEnd` (timestamp, nullable)
- `status` (ENUM: SCHEDULED, ACTIVE, CLOSED, CANCELLED)
- `createdAt`, `updatedAt`

### AttendanceSnapshot
- `id` (UUID)
- `sessionId` (UUID, FK)
- `timestamp` (timestamp)
- `detectedPersons` (int)
- `occupancyRate` (decimal)
- `confidence` (decimal)
- `metadata` (JSONB) - Contains detected student IDs and other AI data
- `createdAt`

### AttendanceRecord
- `id` (UUID)
- `sessionId` (UUID, FK)
- `studentId` (UUID, FK)
- `status` (ENUM: PRESENT, ABSENT, LATE, EXCUSED)
- `arrivalTime` (timestamp, nullable)
- `permanencePercentage` (decimal)
- `origin` (ENUM: AI, MANUAL, MIXED)
- `manualCorrection` (boolean, default false)
- `createdAt`, `updatedAt`

## Business Rules

### Attendance Calculation Logic

The system automatically calculates attendance based on AI snapshots:

1. **Permanence Calculation**
   - Counts snapshots where student was detected
   - Calculates: `(detections / total_snapshots) * 100`

2. **Status Determination**
   - **PRESENT**: permanencePercentage >= 80%
   - **LATE**: permanencePercentage >= 80% AND arrival > 10 minutes after scheduled start
   - **ABSENT**: permanencePercentage < 80%
   - **EXCUSED**: Manual correction only

3. **Manual Corrections**
   - Teachers can override AI-calculated attendance
   - Manual corrections are preserved during recalculation
   - Origin changes to MIXED when AI record is manually corrected

## API Endpoints

### Session Management

#### Start Session
```http
POST /sessions/start
```
**Request:**
```json
{
  "groupId": "uuid",
  "teacherId": "uuid",
  "classroomId": "uuid",
  "deviceId": "uuid",
  "scheduledStart": "2024-01-15T08:00:00Z",
  "scheduledEnd": "2024-01-15T10:00:00Z"
}
```
**Response:** Creates session with status ACTIVE and sets actualStart to current time.

#### Send Snapshot (from Edge Device)
```http
POST /sessions/:id/snapshots
```
**Request:**
```json
{
  "detectedPersons": 25,
  "occupancyRate": 83.5,
  "confidence": 95.2,
  "metadata": {
    "detectedStudents": ["student-uuid-1", "student-uuid-2"],
    "cameraId": "camera-1",
    "processingTime": 150
  }
}
```
**Response:** Snapshot record created.

#### Close Session
```http
POST /sessions/:id/close
```
**Request:**
```json
{
  "manualCorrections": [
    {
      "studentId": "student-uuid",
      "status": "EXCUSED",
      "arrivalTime": "2024-01-15T08:05:00Z"
    }
  ]
}
```
**Response:** Session closed, attendance calculated, corrections applied.

#### Manual Attendance Correction
```http
PATCH /sessions/:id/attendance/:studentId
```
**Request:**
```json
{
  "status": "LATE",
  "arrivalTime": "2024-01-15T08:15:00Z"
}
```
**Response:** Updated attendance record with manualCorrection flag.

#### Get Session Details
```http
GET /sessions/:id
```
**Response:** Session with all snapshots and attendance records.

#### List Sessions with Filters
```http
GET /sessions?groupId=uuid&startDate=2024-01-01&endDate=2024-01-31
```
**Query Parameters:**
- `groupId` (optional): Filter by group
- `teacherId` (optional): Filter by teacher
- `startDate` (optional): Filter sessions from date
- `endDate` (optional): Filter sessions to date

#### Get Session Attendance
```http
GET /sessions/:id/attendance
```
**Response:** All attendance records for the session.

#### Cancel Session
```http
POST /sessions/:id/cancel
```
**Response:** Session status changed to CANCELLED.

## Services

### SessionService
Main session lifecycle management:
- `startSession(dto)`: Create and activate session
- `closeSession(dto)`: Close session, calculate attendance, apply corrections
- `getSessionDetails(sessionId)`: Get session with relations
- `findAll(filters)`: List sessions with optional filters
- `cancelSession(sessionId)`: Cancel a session

### SnapshotService
Snapshot management:
- `createSnapshot(dto)`: Save snapshot from edge device
- `getSnapshotsBySession(sessionId)`: Get all snapshots for a session
- `processSnapshots(sessionId)`: Trigger attendance calculation

### AttendanceService
Complex attendance calculation and management:
- `calculateAttendanceFromSnapshots(sessionId)`: Main calculation logic
  - Processes all snapshots
  - Calculates permanence percentage
  - Determines status based on business rules
  - Respects manual corrections
- `applyManualCorrection(sessionId, studentId, status, arrivalTime)`: Manual override
- `getAttendanceBySession(sessionId)`: Get all attendance records
- `getAttendanceRecord(sessionId, studentId)`: Get specific record

## Workflow Example

### Typical Class Session Flow

1. **Teacher starts class**
   ```
   POST /sessions/start
   → Session created with status ACTIVE
   → actualStart = current time
   ```

2. **Edge device sends snapshots every minute**
   ```
   POST /sessions/:id/snapshots (every 60 seconds)
   → Snapshots stored with detected student IDs in metadata
   ```

3. **Teacher closes class**
   ```
   POST /sessions/:id/close
   → Attendance calculated from all snapshots
   → Status changed to CLOSED
   → actualEnd = current time
   ```

4. **Teacher reviews and corrects attendance**
   ```
   PATCH /sessions/:id/attendance/:studentId
   → Manual correction applied
   → Origin changed to MIXED
   → manualCorrection flag set to true
   ```

## Snapshot Metadata Structure

The `metadata` field in snapshots should contain:

```json
{
  "detectedStudents": ["student-uuid-1", "student-uuid-2", ...],
  "cameraId": "camera-identifier",
  "processingTime": 150,
  "frameQuality": 0.95,
  "additionalData": {}
}
```

The `detectedStudents` array is crucial for attendance calculation.

## Testing

Comprehensive test coverage includes:

### AttendanceService Tests
- ✅ Calculate PRESENT status (>= 80% permanence)
- ✅ Calculate LATE status (>= 80% + late arrival)
- ✅ Calculate ABSENT status (< 80% permanence)
- ✅ Preserve manual corrections during recalculation
- ✅ Apply manual corrections with origin tracking
- ✅ Update arrival time in corrections

### SessionService Tests
- ✅ Start session with ACTIVE status
- ✅ Close session and trigger attendance calculation
- ✅ Apply manual corrections on close
- ✅ Filter sessions by various criteria
- ✅ Handle session not found errors
- ✅ Prevent closing already closed sessions

Run tests:
```bash
npm test -- session
```

## Configuration

### Business Rule Constants

Located in `AttendanceService`:
- `LATE_THRESHOLD_MINUTES = 10`: Minutes after scheduled start to mark as late
- `PRESENT_THRESHOLD_PERCENTAGE = 80`: Minimum permanence for present status

These can be adjusted based on institutional policies.

## Integration Notes

### Edge Device Integration
Edge devices should:
1. Authenticate with the API
2. Send snapshots at regular intervals (recommended: 60 seconds)
3. Include detected student IDs in metadata
4. Handle network failures with retry logic

### Frontend Integration
The frontend should:
1. Display real-time snapshot data during active sessions
2. Show calculated attendance after session close
3. Provide UI for manual corrections
4. Visualize permanence percentages and status

## Future Enhancements

Potential improvements:
- Real-time WebSocket updates for live attendance
- Advanced analytics and reporting
- Integration with facial recognition systems
- Automated late notifications
- Attendance trend analysis
