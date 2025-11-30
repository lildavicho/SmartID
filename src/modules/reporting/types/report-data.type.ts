/**
 * Daily Attendance Report Data
 */
export interface DailyAttendanceReport {
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

export interface GroupAttendanceSummary {
  groupId: string;
  groupName: string;
  courseName: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

/**
 * Course Report Data
 */
export interface CourseReport {
  groupId: string;
  groupName: string;
  courseName: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  students: StudentAttendanceStats[];
}

export interface StudentAttendanceStats {
  studentId: string;
  studentName: string;
  studentCode: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  permanenceAverage: number;
}

/**
 * Teacher Report Data
 */
export interface TeacherReport {
  teacherId: string;
  teacherName: string;
  month: number;
  year: number;
  totalSessions: number;
  courses: TeacherCourseStats[];
}

export interface TeacherCourseStats {
  groupId: string;
  groupName: string;
  courseName: string;
  sessionsCount: number;
  averageAttendanceRate: number;
  totalStudents: number;
}
