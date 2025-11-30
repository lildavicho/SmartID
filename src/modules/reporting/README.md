# Reporting Module

Complete reporting and export system for attendance data with Excel and PDF generation.

## Overview

The ReportingModule provides comprehensive reporting capabilities including:
- **Daily Attendance Reports**: Institution-wide attendance for a specific date
- **Course Reports**: Student attendance statistics for a group over time
- **Teacher Reports**: Teacher session statistics for a month
- **Multiple Export Formats**: JSON, Excel (XLSX), PDF

## Installation

### Required Dependencies

Install the following packages:

```bash
npm install exceljs pdfkit
npm install --save-dev @types/pdfkit
```

### Package Versions

```json
{
  "exceljs": "^4.4.0",
  "pdfkit": "^0.14.0",
  "@types/pdfkit": "^0.13.0"
}
```

## Features

- ✅ Daily attendance reports with group summaries
- ✅ Course reports with student statistics
- ✅ Teacher reports with course statistics
- ✅ Excel export with formatting and colors
- ✅ PDF export with tables and styling
- ✅ JSON export for API consumption
- ✅ Automatic file downloads with proper headers
- ✅ Comprehensive validation

## Report Types

### 1. Daily Attendance Report

Institution-wide attendance for a specific date.

**Data Included:**
- Total students, present, absent, late, excused
- Overall attendance rate
- Breakdown by group/course
- Individual group statistics

### 2. Course Report

Student attendance statistics for a specific group over a date range.

**Data Included:**
- Total sessions in period
- Per-student statistics:
  - Total sessions attended
  - Present, absent, late counts
  - Attendance percentage
  - Average permanence percentage

### 3. Teacher Report

Teacher session statistics for a specific month.

**Data Included:**
- Total sessions taught
- Per-course statistics:
  - Sessions count
  - Average attendance rate
  - Total students

## API Endpoints

### Daily Attendance Report

```http
GET /reports/daily?institutionId={uuid}&date={YYYY-MM-DD}&format={json|xlsx|pdf}
```

**Query Parameters:**
- `institutionId` (required): Institution UUID
- `date` (required): Date in YYYY-MM-DD format
- `format` (optional): Export format (default: json)

**Example:**
```bash
# JSON response
curl "http://localhost:3000/reports/daily?institutionId=abc-123&date=2025-01-15"

# Download Excel file
curl "http://localhost:3000/reports/daily?institutionId=abc-123&date=2025-01-15&format=xlsx" -o report.xlsx

# Download PDF file
curl "http://localhost:3000/reports/daily?institutionId=abc-123&date=2025-01-15&format=pdf" -o report.pdf
```

**JSON Response:**
```json
{
  "institutionId": "abc-123",
  "date": "2025-01-15",
  "totalStudents": 150,
  "totalPresent": 135,
  "totalAbsent": 10,
  "totalLate": 5,
  "totalExcused": 0,
  "attendanceRate": 93.33,
  "groups": [
    {
      "groupId": "group-1",
      "groupName": "5° Básico A",
      "courseName": "Matemáticas",
      "totalStudents": 30,
      "present": 28,
      "absent": 1,
      "late": 1,
      "excused": 0,
      "attendanceRate": 96.67
    }
  ]
}
```

### Course Report

```http
GET /reports/course/{groupId}?startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}&format={json|xlsx|pdf}
```

**Path Parameters:**
- `groupId` (required): Group UUID

**Query Parameters:**
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format
- `format` (optional): Export format (default: json)

**Example:**
```bash
curl "http://localhost:3000/reports/course/group-123?startDate=2025-01-01&endDate=2025-01-31&format=xlsx" -o course-report.xlsx
```

**JSON Response:**
```json
{
  "groupId": "group-123",
  "groupName": "5° Básico A",
  "courseName": "Matemáticas",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "totalSessions": 20,
  "students": [
    {
      "studentId": "student-1",
      "studentName": "Juan Pérez",
      "studentCode": "EST001",
      "totalSessions": 20,
      "presentCount": 18,
      "absentCount": 1,
      "lateCount": 1,
      "excusedCount": 0,
      "attendancePercentage": 95.0,
      "permanenceAverage": 92.5
    }
  ]
}
```

### Teacher Report

```http
GET /reports/teacher/{teacherId}?month={1-12}&year={YYYY}&format={json|xlsx|pdf}
```

**Path Parameters:**
- `teacherId` (required): Teacher UUID

**Query Parameters:**
- `month` (required): Month number (1-12)
- `year` (required): Year (2020-2100)
- `format` (optional): Export format (default: json)

**Example:**
```bash
curl "http://localhost:3000/reports/teacher/teacher-123?month=1&year=2025&format=pdf" -o teacher-report.pdf
```

**JSON Response:**
```json
{
  "teacherId": "teacher-123",
  "teacherName": "María González",
  "month": 1,
  "year": 2025,
  "totalSessions": 45,
  "courses": [
    {
      "groupId": "group-1",
      "groupName": "5° Básico A",
      "courseName": "Matemáticas",
      "sessionsCount": 20,
      "averageAttendanceRate": 94.5,
      "totalStudents": 30
    }
  ]
}
```

## Export Formats

### JSON

Default format. Returns structured data for API consumption.

**Headers:**
```
Content-Type: application/json
```

### Excel (XLSX)

Professional Excel spreadsheet with:
- Formatted headers with colors
- Multiple sheets (if needed)
- Calculated totals
- Percentage formatting
- Auto-sized columns

**Headers:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="report-2025-01-15.xlsx"
```

**Excel Features:**
- Blue header row with white text
- Summary row with gray background
- Percentage formatting
- Bold totals
- Professional styling

### PDF

Formatted PDF document with:
- Header with title and date
- Organized sections
- Tables with data
- Professional layout

**Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="report-2025-01-15.pdf"
```

**PDF Features:**
- Title and generation date
- Organized sections
- Formatted tables
- Compact layout

## Usage Examples

### Frontend Integration

```typescript
// Download Excel report
async function downloadDailyReport(institutionId: string, date: string) {
  const response = await fetch(
    `/reports/daily?institutionId=${institutionId}&date=${date}&format=xlsx`
  );
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daily-report-${date}.xlsx`;
  a.click();
}

// Get JSON data
async function getDailyReportData(institutionId: string, date: string) {
  const response = await fetch(
    `/reports/daily?institutionId=${institutionId}&date=${date}`
  );
  
  return await response.json();
}
```

### NestJS Service Usage

```typescript
@Injectable()
export class MyService {
  constructor(
    private reportingService: ReportingService,
    private exportService: ExportService,
  ) {}

  async generateReport() {
    // Generate report data
    const report = await this.reportingService.generateDailyAttendanceReport(
      'institution-id',
      '2025-01-15'
    );

    // Export to Excel
    const excelBuffer = await this.exportService.exportToExcel(report, 'daily');

    // Export to PDF
    const pdfBuffer = await this.exportService.exportToPDF(report, 'daily');

    return { report, excelBuffer, pdfBuffer };
  }
}
```

## Data Structures

### DailyAttendanceReport

```typescript
interface DailyAttendanceReport {
  institutionId: string;
  date: string;
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  attendanceRate: number;
  groups: GroupAttendanceSummary[];
}
```

### CourseReport

```typescript
interface CourseReport {
  groupId: string;
  groupName: string;
  courseName: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  students: StudentAttendanceStats[];
}
```

### TeacherReport

```typescript
interface TeacherReport {
  teacherId: string;
  teacherName: string;
  month: number;
  year: number;
  totalSessions: number;
  courses: TeacherCourseStats[];
}
```

## Validation

All DTOs include comprehensive validation:

### DailyReportFiltersDto
- `institutionId`: Must be valid UUID
- `date`: Must be valid ISO date string (YYYY-MM-DD)
- `format`: Optional, must be 'json', 'xlsx', or 'pdf'

### CourseReportFiltersDto
- `groupId`: Must be valid UUID
- `startDate`: Must be valid ISO date string
- `endDate`: Must be valid ISO date string
- `format`: Optional, must be 'json', 'xlsx', or 'pdf'

### TeacherReportFiltersDto
- `teacherId`: Must be valid UUID
- `month`: Integer between 1-12
- `year`: Integer between 2020-2100
- `format`: Optional, must be 'json', 'xlsx', or 'pdf'

## Testing

### Run Tests

```bash
# All tests
npm test

# Specific test file
npm test reporting.service.spec.ts

# With coverage
npm test -- --coverage
```

### Test Coverage

- ✅ Daily report generation with totals
- ✅ Attendance rate calculation
- ✅ Course report with student statistics
- ✅ Teacher report with course statistics
- ✅ Excel export buffer generation
- ✅ PDF export buffer generation
- ✅ Unknown report type error handling

## Performance Considerations

### Optimization Tips

1. **Large Datasets**: For institutions with many students, consider:
   - Pagination for large reports
   - Background job processing
   - Caching frequently requested reports

2. **Date Ranges**: Limit course report date ranges to avoid:
   - Long query times
   - Large Excel files
   - Memory issues

3. **Concurrent Requests**: Excel and PDF generation is CPU-intensive:
   - Consider queue-based processing
   - Implement rate limiting
   - Use worker threads for large reports

### Recommended Limits

- Daily reports: No limit (single day)
- Course reports: Max 3 months
- Teacher reports: Single month only

## Error Handling

### Common Errors

| Error | Status | Description |
|-------|--------|-------------|
| Invalid UUID | 400 Bad Request | Invalid ID format |
| Invalid date | 400 Bad Request | Date not in YYYY-MM-DD format |
| Invalid month | 400 Bad Request | Month not between 1-12 |
| Invalid format | 400 Bad Request | Format not json/xlsx/pdf |
| No data found | 200 OK | Returns empty arrays |

### Example Error Response

```json
{
  "statusCode": 400,
  "message": [
    "institutionId must be a UUID",
    "date must be a valid ISO 8601 date string"
  ],
  "error": "Bad Request"
}
```

## File Naming Convention

Generated files follow this pattern:

- Daily: `daily-report-{date}.{ext}`
- Course: `course-report-{groupId}-{startDate}-{endDate}.{ext}`
- Teacher: `teacher-report-{teacherId}-{year}-{month}.{ext}`

Examples:
- `daily-report-2025-01-15.xlsx`
- `course-report-abc12345-2025-01-01-2025-01-31.pdf`
- `teacher-report-xyz67890-2025-01.xlsx`

## Future Enhancements

- [ ] Custom report templates
- [ ] Scheduled report generation
- [ ] Email delivery
- [ ] Report caching
- [ ] Advanced filtering options
- [ ] Chart generation in Excel/PDF
- [ ] Multi-language support
- [ ] Custom branding/logos
- [ ] Batch report generation
- [ ] Report history tracking

## Troubleshooting

### Excel File Won't Open

**Problem:** Excel file corrupted or won't open

**Solution:**
- Check buffer size is > 0
- Verify exceljs version compatibility
- Check for special characters in data

### PDF Generation Fails

**Problem:** PDF generation throws error

**Solution:**
- Verify pdfkit installation
- Check for very long text strings
- Ensure data is properly formatted

### Large Files Timeout

**Problem:** Request times out for large reports

**Solution:**
- Increase request timeout
- Implement pagination
- Use background jobs for large reports

## Dependencies

```json
{
  "exceljs": "^4.4.0",
  "pdfkit": "^0.14.0",
  "@types/pdfkit": "^0.13.0"
}
```

## License

Part of SmartID attendance system.
