import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Group } from './entities/group.entity';
import { Student } from './entities/student.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Teacher } from './entities/teacher.entity';
import { TeachingAssignment } from './entities/teaching-assignment.entity';
import { CourseService } from './services/course.service';
import { GroupService } from './services/group.service';
import { StudentService } from './services/student.service';
import { TeacherService } from './services/teacher.service';
import { EnrollmentService } from './services/enrollment.service';
import { TeachingAssignmentService } from './services/teaching-assignment.service';
import { CourseController } from './controllers/course.controller';
import { GroupController } from './controllers/group.controller';
import { StudentController } from './controllers/student.controller';
import { TeacherController } from './controllers/teacher.controller';
import { EnrollmentController } from './controllers/enrollment.controller';
import { TeachingAssignmentController } from './controllers/teaching-assignment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, Group, Student, Enrollment, Teacher, TeachingAssignment]),
  ],
  controllers: [
    CourseController,
    GroupController,
    StudentController,
    TeacherController,
    EnrollmentController,
    TeachingAssignmentController,
  ],
  providers: [
    CourseService,
    GroupService,
    StudentService,
    TeacherService,
    EnrollmentService,
    TeachingAssignmentService,
  ],
  exports: [
    CourseService,
    GroupService,
    StudentService,
    TeacherService,
    EnrollmentService,
    TeachingAssignmentService,
  ],
})
export class AcademicModule {}
