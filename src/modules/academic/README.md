# Academic Module

Complete academic management system with courses, groups, students, teachers, enrollments, and teaching assignments.

## Entities

### Course
- `id` (UUID)
- `institutionId` (UUID, FK)
- `name` (string)
- `code` (string)
- `grade` (string, nullable)
- `external_id` (string, nullable)
- `createdAt`, `updatedAt`

### Group/Section
- `id` (UUID)
- `courseId` (UUID, FK)
- `name` (string)
- `academicTerm` (string)
- `external_id` (string, nullable)
- `createdAt`, `updatedAt`

### Student
- `id` (UUID)
- `institutionId` (UUID, FK)
- `firstName`, `lastName` (string)
- `email` (string, unique)
- `studentCode` (string, unique)
- `enrollmentDate` (timestamp)
- `external_id` (string, nullable)
- `createdAt`, `updatedAt`

### Teacher
- `id` (UUID)
- `institutionId` (UUID, FK)
- `firstName`, `lastName` (string)
- `email` (string, unique)
- `employeeCode` (string, unique)
- `external_id` (string, nullable)
- `createdAt`, `updatedAt`

### Enrollment
- `id` (UUID)
- `studentId` (UUID, FK)
- `groupId` (UUID, FK)
- `enrollmentDate` (timestamp)
- `status` (ENUM: ACTIVE, INACTIVE, WITHDRAWN, GRADUATED)
- `createdAt`, `updatedAt`

### TeachingAssignment
- `id` (UUID)
- `teacherId` (UUID, FK)
- `groupId` (UUID, FK)
- `academicTerm` (string)
- `createdAt`, `updatedAt`

## API Endpoints

### Courses
- `POST /courses` - Create course
- `GET /courses` - List all courses
- `GET /courses?institutionId={uuid}` - Filter by institution
- `GET /courses/:id` - Get course details
- `PATCH /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course

### Groups
- `POST /groups` - Create group
- `GET /groups` - List all groups
- `GET /groups?courseId={uuid}` - Filter by course
- `GET /groups/:id` - Get group details
- `GET /groups/:id/students` - List students in group
- `GET /groups/:id/teacher` - Get assigned teacher
- `GET /groups/:id/teacher?academicTerm={term}` - Get teacher for specific term
- `PATCH /groups/:id` - Update group
- `DELETE /groups/:id` - Delete group

### Students
- `POST /students` - Create student
- `GET /students` - List all students
- `GET /students?institutionId={uuid}` - Filter by institution
- `GET /students/:id` - Get student details
- `PATCH /students/:id` - Update student
- `DELETE /students/:id` - Delete student

### Teachers
- `POST /teachers` - Create teacher
- `GET /teachers` - List all teachers
- `GET /teachers?institutionId={uuid}` - Filter by institution
- `GET /teachers/:id` - Get teacher details
- `PATCH /teachers/:id` - Update teacher
- `DELETE /teachers/:id` - Delete teacher

### Enrollments
- `POST /enrollments` - Enroll student in group
- `GET /enrollments` - List all enrollments
- `GET /enrollments/:id` - Get enrollment details
- `DELETE /enrollments/:id` - Unenroll student (sets status to INACTIVE)

### Teaching Assignments
- `POST /teaching-assignments` - Assign teacher to group
- `GET /teaching-assignments` - List all assignments
- `GET /teaching-assignments?teacherId={uuid}` - Get teacher's assignments
- `DELETE /teaching-assignments/:id` - Remove assignment

## Example Requests

### Create Student
```json
POST /students
{
  "institutionId": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "studentCode": "STU001",
  "enrollmentDate": "2024-01-15",
  "external_id": "EXT123"
}
```

### Enroll Student
```json
POST /enrollments
{
  "studentId": "student-uuid",
  "groupId": "group-uuid",
  "enrollmentDate": "2024-01-15"
}
```

### Assign Teacher
```json
POST /teaching-assignments
{
  "teacherId": "teacher-uuid",
  "groupId": "group-uuid",
  "academicTerm": "2024-1"
}
```

## Validations

All DTOs include comprehensive class-validator validations:
- UUID validation for IDs
- Email format validation
- String length constraints
- Required field validation
- Unique constraints on emails and codes

## Business Logic

### Student Service
- Validates unique email and studentCode on create/update
- Throws ConflictException for duplicates

### Teacher Service
- Validates unique email and employeeCode on create/update
- Throws ConflictException for duplicates

### Enrollment Service
- Verifies student and group exist before enrollment
- Prevents duplicate active enrollments
- Supports unenrollment (status change to INACTIVE)

### Teaching Assignment Service
- Verifies teacher and group exist before assignment
- Prevents duplicate assignments for same term
- Supports querying assignments by teacher or group

## Tests

Comprehensive test coverage includes:
- `enrollment.service.spec.ts` - Tests for enrollment logic
- `student.service.spec.ts` - Tests for unique email validation

Run tests with:
```bash
npm test
```
