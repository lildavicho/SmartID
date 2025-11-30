import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

// Load environment variables
config();

// Import entities
import { Institution } from '../../modules/institution/entities/institution.entity';
import { Campus } from '../../modules/institution/entities/campus.entity';
import { Classroom } from '../../modules/device/entities/classroom.entity';
import { Device } from '../../modules/device/entities/device.entity';
import { AttendanceLog } from '../../modules/device/entities/attendance-log.entity';
import { Course } from '../../modules/academic/entities/course.entity';
import { Student } from '../../modules/academic/entities/student.entity';
import { Teacher } from '../../modules/academic/entities/teacher.entity';
import { Group } from '../../modules/academic/entities/group.entity';
import { Enrollment } from '../../modules/academic/entities/enrollment.entity';
import { TeachingAssignment } from '../../modules/academic/entities/teaching-assignment.entity';
import { User } from '../../modules/user/entities/user.entity';
import { Role } from '../../modules/user/entities/role.entity';
import { NfcTag, NfcTagStatus } from '../../modules/user/entities/nfc-tag.entity';
import { AuditLog, AuditAction } from '../../modules/user/entities/audit-log.entity';
import { RefreshToken } from '../../modules/auth/entities/refresh-token.entity';
import { UserSession } from '../../modules/auth/entities/user-session.entity';
import { ClassSession } from '../../modules/session/entities/class-session.entity';
import { AttendanceRecord } from '../../modules/session/entities/attendance-record.entity';
import { AttendanceSnapshot } from '../../modules/session/entities/attendance-snapshot.entity';
import { Integration } from '../../modules/integration/entities/integration.entity';
import { IntegrationMapping } from '../../modules/integration/entities/integration-mapping.entity';
import { UserRole } from '../../modules/user/enums/user-role.enum';
import { UserStatus } from '../../modules/user/enums/user-status.enum';
import { DeviceStatus } from '../../modules/device/enums/device-status.enum';
import { DeviceType } from '../../modules/device/enums/device-type.enum';
import { EnrollmentStatus } from '../../modules/academic/enums/enrollment-status.enum';

// Use provided DATABASE_URL or fallback to Supabase
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://postgres.jablizejtqpjktkqtxsz:dvmt1610666@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

// Sample data
const FIRST_NAMES = [
  'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Laura',
  'Miguel', 'Isabel', 'Pedro', 'Sofía', 'Diego', 'Valentina', 'Andrés',
  'Camila', 'Felipe', 'Daniela', 'Santiago', 'Gabriela', 'Sebastián',
  'Natalia', 'Alejandro', 'Paula', 'Mateo', 'Andrea', 'Nicolás', 'Juliana',
  'David', 'Carolina', 'Daniel', 'Mariana', 'Ricardo', 'Lucía', 'Javier',
  'Catalina', 'Tomás', 'Fernanda', 'Pablo', 'Melissa', 'Martín', 'Alejandra',
  'Emilio', 'Paola', 'Rodrigo', 'Verónica', 'Óscar', 'Adriana', 'Raúl', 'Claudia',
];

const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez',
  'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales',
  'Reyes', 'Gutiérrez', 'Ortiz', 'Jiménez', 'Hernández', 'Mendoza', 'Vargas',
  'Castro', 'Romero', 'Ruiz', 'Álvarez', 'Castillo', 'Moreno', 'Muñoz', 'Silva',
];

const COURSES_DATA = [
  { name: 'Matemáticas I', code: 'MATH101', grade: '10th Grade' },
  { name: 'Física I', code: 'PHYS101', grade: '10th Grade' },
  { name: 'Química I', code: 'CHEM101', grade: '10th Grade' },
  { name: 'Biología I', code: 'BIOL101', grade: '10th Grade' },
  { name: 'Historia Universal', code: 'HIST101', grade: '10th Grade' },
  { name: 'Literatura Española', code: 'LIT101', grade: '10th Grade' },
  { name: 'Inglés Avanzado', code: 'ENG201', grade: '11th Grade' },
  { name: 'Programación I', code: 'CS101', grade: '11th Grade' },
  { name: 'Educación Física', code: 'PE101', grade: '10th Grade' },
  { name: 'Arte y Cultura', code: 'ART101', grade: '10th Grade' },
];

const TEACHERS_DATA = [
  { firstName: 'Roberto', lastName: 'Martínez', email: 'roberto.martinez@sanagustin.edu', code: 'TEACH001' },
  { firstName: 'Elena', lastName: 'Fernández', email: 'elena.fernandez@sanagustin.edu', code: 'TEACH002' },
  { firstName: 'Carlos', lastName: 'Ruiz', email: 'carlos.ruiz@sanagustin.edu', code: 'TEACH003' },
  { firstName: 'Patricia', lastName: 'López', email: 'patricia.lopez@sanagustin.edu', code: 'TEACH004' },
  { firstName: 'Fernando', lastName: 'García', email: 'fernando.garcia@sanagustin.edu', code: 'TEACH005' },
];

async function createDataSource(): Promise<DataSource> {
  console.log('🔌 Connecting to database...');
  console.log('   URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
  
  const dataSource = new DataSource({
    type: 'postgres',
    url: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    entities: [
      Institution, Campus, Classroom, Device, AttendanceLog,
      Course, Student, Teacher, Group, Enrollment, TeachingAssignment,
      User, Role, NfcTag, AuditLog, RefreshToken, UserSession,
      ClassSession, AttendanceRecord, AttendanceSnapshot,
      Integration, IntegrationMapping,
    ],
    synchronize: true, // Create tables automatically
    logging: ['error', 'warn'],
  });

  await dataSource.initialize();
  console.log('✅ Database connected successfully\n');
  return dataSource;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateEmail(firstName: string, lastName: string, domain: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function seed() {
  console.log('═'.repeat(60));
  console.log('🌱 SmartPresence AI - Database Seeder');
  console.log('═'.repeat(60));
  console.log('');

  const dataSource = await createDataSource();
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check if data already exists
    const institutionCount = await queryRunner.manager.count(Institution);
    if (institutionCount > 0) {
      console.log('⚠️  Database already has data. Skipping seed...');
      console.log('   Run "npm run schema:drop" first if you want to reset the database.\n');
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    // 1. Create Roles
    console.log('👥 Creating roles...');
    const superadminRole = queryRunner.manager.create(Role, {
      name: 'superadmin',
      description: 'Super Administrator with full system access',
      permissions: {
        canManageUsers: true,
        canManageRoles: true,
        canManageDevices: true,
        canManageInstitutions: true,
        canViewReports: true,
        canExportData: true,
        canManageIntegrations: true,
        canViewAuditLogs: true,
        allowedModules: ['*'],
      },
      isActive: true,
    });
    await queryRunner.manager.save(superadminRole);
    console.log('   ✅ Role created: superadmin');

    const adminRole = queryRunner.manager.create(Role, {
      name: 'admin',
      description: 'Institution Administrator',
      permissions: {
        canManageUsers: true,
        canManageDevices: true,
        canViewReports: true,
        canExportData: true,
        allowedModules: ['users', 'devices', 'reports', 'sessions'],
      },
      isActive: true,
    });
    await queryRunner.manager.save(adminRole);
    console.log('   ✅ Role created: admin');

    const employeeRole = queryRunner.manager.create(Role, {
      name: 'employee',
      description: 'Regular Employee',
      permissions: {
        canViewReports: true,
        allowedModules: ['reports', 'sessions'],
      },
      isActive: true,
    });
    await queryRunner.manager.save(employeeRole);
    console.log('   ✅ Role created: employee\n');

    // 2. Create Institution
    console.log('📚 Creating institution...');
    const institution = queryRunner.manager.create(Institution, {
      name: 'Colegio San Agustín',
      code: 'INST001',
      country: 'Colombia',
      timezone: 'America/Bogota',
      config: {
        academicYear: 2024,
        maxStudents: 1000,
        maxTeachers: 50,
      },
      isActive: true,
    });
    await queryRunner.manager.save(institution);
    console.log('   ✅ Institution created: Colegio San Agustín\n');

    // 3. Create Campuses
    console.log('🏫 Creating campuses...');
    const campusNorte = queryRunner.manager.create(Campus, {
      name: 'Campus Norte',
      address: 'Calle 123 #45-67, Bogotá',
      city: 'Bogotá',
      institutionId: institution.id,
      isActive: true,
    });
    await queryRunner.manager.save(campusNorte);
    console.log('   ✅ Campus created: Campus Norte');

    const campusSur = queryRunner.manager.create(Campus, {
      name: 'Campus Sur',
      address: 'Carrera 78 #90-12, Bogotá',
      city: 'Bogotá',
      institutionId: institution.id,
      isActive: true,
    });
    await queryRunner.manager.save(campusSur);
    console.log('   ✅ Campus created: Campus Sur\n');

    // 4. Create Classrooms
    console.log('🚪 Creating classrooms...');
    const classrooms: Classroom[] = [];

    for (let i = 1; i <= 3; i++) {
      const classroom = queryRunner.manager.create(Classroom, {
        campusId: campusNorte.id,
        name: `Aula ${i}0${i}`,
        building: 'Edificio A',
        floor: `${Math.ceil(i / 2)}`,
        capacity: 30 + i * 5,
      });
      await queryRunner.manager.save(classroom);
      classrooms.push(classroom);
      console.log(`   ✅ Classroom created: Aula ${i}0${i} (Campus Norte)`);
    }

    for (let i = 1; i <= 2; i++) {
      const classroom = queryRunner.manager.create(Classroom, {
        campusId: campusSur.id,
        name: `Aula ${i + 3}0${i}`,
        building: 'Edificio B',
        floor: `${i}`,
        capacity: 35 + i * 5,
      });
      await queryRunner.manager.save(classroom);
      classrooms.push(classroom);
      console.log(`   ✅ Classroom created: Aula ${i + 3}0${i} (Campus Sur)`);
    }
    console.log('');

    // 5. Create Devices
    console.log('📱 Creating devices (Riotouch screens)...');
    const device1 = queryRunner.manager.create(Device, {
      deviceCode: 'DEV001',
      serialNumber: 'RT-2024-001',
      model: 'Riotouch Pro 65"',
      firmwareVersion: '2.5.1',
      type: DeviceType.RIOTOUCH,
      status: DeviceStatus.ONLINE,
      institutionId: institution.id,
      campusId: campusNorte.id,
      classroomId: classrooms[0].id,
      lastSeen: new Date(),
      config: { resolution: '4K', touchPoints: 20 },
    });
    await queryRunner.manager.save(device1);
    console.log('   ✅ Device created: DEV001 (Riotouch - Aula 101)');

    const device2 = queryRunner.manager.create(Device, {
      deviceCode: 'DEV002',
      serialNumber: 'RT-2024-002',
      model: 'Riotouch Pro 65"',
      firmwareVersion: '2.5.1',
      type: DeviceType.RIOTOUCH,
      status: DeviceStatus.ONLINE,
      institutionId: institution.id,
      campusId: campusSur.id,
      classroomId: classrooms[3].id,
      lastSeen: new Date(),
      config: { resolution: '4K', touchPoints: 20 },
    });
    await queryRunner.manager.save(device2);
    console.log('   ✅ Device created: DEV002 (Riotouch - Aula 401)');

    const nfcReader = queryRunner.manager.create(Device, {
      deviceCode: 'NFC001',
      serialNumber: 'NFC-2024-001',
      model: 'ACR122U NFC Reader',
      firmwareVersion: '1.0.0',
      type: DeviceType.NFC_READER,
      status: DeviceStatus.ONLINE,
      institutionId: institution.id,
      campusId: campusNorte.id,
      classroomId: classrooms[0].id,
      lastSeen: new Date(),
    });
    await queryRunner.manager.save(nfcReader);
    console.log('   ✅ Device created: NFC001 (NFC Reader - Aula 101)\n');

    // 6. Create Courses and Groups
    console.log('📖 Creating courses and groups...');
    const courses: Course[] = [];
    const groups: Group[] = [];
    for (const courseData of COURSES_DATA) {
      const course = queryRunner.manager.create(Course, {
        ...courseData,
        institutionId: institution.id,
      });
      await queryRunner.manager.save(course);
      courses.push(course);
      console.log(`   ✅ Course created: ${courseData.name} (${courseData.code})`);

      const group = queryRunner.manager.create(Group, {
        courseId: course.id,
        name: `${courseData.name} - Grupo A`,
        academicTerm: '2024-1',
      });
      await queryRunner.manager.save(group);
      groups.push(group);
    }
    console.log('');

    // 7. Create Teachers
    console.log('👨‍🏫 Creating teachers...');
    const teachers: Teacher[] = [];
    for (const teacherData of TEACHERS_DATA) {
      const teacher = queryRunner.manager.create(Teacher, {
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        email: teacherData.email,
        employeeCode: teacherData.code,
        institutionId: institution.id,
      });
      await queryRunner.manager.save(teacher);
      teachers.push(teacher);
      console.log(`   ✅ Teacher created: ${teacherData.firstName} ${teacherData.lastName}`);
    }
    console.log('');

    // 8. Create Students
    console.log('👨‍🎓 Creating students...');
    const students: Student[] = [];
    for (let i = 1; i <= 50; i++) {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const email = generateEmail(firstName, lastName, 'sanagustin.edu');
      const studentCode = `STU2024${String(i).padStart(3, '0')}`;

      const student = queryRunner.manager.create(Student, {
        firstName,
        lastName,
        email: `${email.split('@')[0]}${i}@sanagustin.edu`,
        studentCode,
        enrollmentDate: new Date('2024-01-15'),
        institutionId: institution.id,
      });
      await queryRunner.manager.save(student);
      students.push(student);

      if (i % 10 === 0) {
        console.log(`   ✅ Created ${i} students...`);
      }
    }
    console.log(`   ✅ Total students created: ${students.length}\n`);

    // 9. Create Enrollments
    console.log('📝 Creating enrollments...');
    let enrollmentCount = 0;
    for (const student of students) {
      const numGroups = 3 + Math.floor(Math.random() * 3);
      const selectedGroups = [...groups].sort(() => Math.random() - 0.5).slice(0, numGroups);

      for (const group of selectedGroups) {
        const enrollment = queryRunner.manager.create(Enrollment, {
          studentId: student.id,
          groupId: group.id,
          enrollmentDate: new Date('2024-01-20'),
          status: EnrollmentStatus.ACTIVE,
        });
        await queryRunner.manager.save(enrollment);
        enrollmentCount++;
      }
    }
    console.log(`   ✅ Total enrollments created: ${enrollmentCount}\n`);

    // 10. Create Admin User
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const adminUser = queryRunner.manager.create(User, {
      email: 'admin@smartpresence.ai',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'SmartPresence',
      roleId: superadminRole.id,
      legacyRole: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isActive: true,
      institutionId: institution.id,
    });
    await queryRunner.manager.save(adminUser);
    console.log('   ✅ Admin user created');
    console.log('      Email: admin@smartpresence.ai');
    console.log('      Password: Admin123!\n');

    // 11. Create NFC Tags
    console.log('🏷️  Creating NFC tags...');
    const nfcTag1 = queryRunner.manager.create(NfcTag, {
      uid: '04:A2:B3:C4:D5:E6:F7',
      label: 'Admin Badge',
      assignedToUserId: adminUser.id,
      status: NfcTagStatus.ACTIVE,
      institutionId: institution.id,
    });
    await queryRunner.manager.save(nfcTag1);
    console.log('   ✅ NFC Tag created: Admin Badge (assigned to admin)');

    const nfcTag2 = queryRunner.manager.create(NfcTag, {
      uid: '04:B3:C4:D5:E6:F7:A8',
      label: 'Employee Badge #1',
      status: NfcTagStatus.ACTIVE,
      institutionId: institution.id,
    });
    await queryRunner.manager.save(nfcTag2);
    console.log('   ✅ NFC Tag created: Employee Badge #1 (unassigned)\n');

    // 12. Create Audit Log Entry
    console.log('📋 Creating initial audit log...');
    const auditLog = queryRunner.manager.create(AuditLog, {
      action: AuditAction.CREATE,
      actorUserId: adminUser.id,
      entityType: 'System',
      description: 'Database seeded successfully',
      metadata: {
        seedVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        entitiesCreated: {
          roles: 3,
          institutions: 1,
          campuses: 2,
          classrooms: 5,
          devices: 3,
          courses: courses.length,
          groups: groups.length,
          teachers: teachers.length,
          students: students.length,
          enrollments: enrollmentCount,
          users: 1,
          nfcTags: 2,
        },
      },
      institutionId: institution.id,
    });
    await queryRunner.manager.save(auditLog);
    console.log('   ✅ Initial audit log created\n');

    await queryRunner.commitTransaction();

    console.log('═'.repeat(60));
    console.log('✨ Database seed completed successfully!');
    console.log('═'.repeat(60));
    console.log('\n📊 Summary:');
    console.log('   • 3 Roles: superadmin, admin, employee');
    console.log('   • 1 Institution: Colegio San Agustín');
    console.log('   • 2 Campuses: Campus Norte, Campus Sur');
    console.log('   • 5 Classrooms distributed across campuses');
    console.log('   • 3 Devices (2 Riotouch + 1 NFC Reader)');
    console.log(`   • ${courses.length} Courses`);
    console.log(`   • ${groups.length} Groups (course sections)`);
    console.log(`   • ${teachers.length} Teachers`);
    console.log(`   • ${students.length} Students`);
    console.log(`   • ${enrollmentCount} Enrollments`);
    console.log('   • 1 Admin user (admin@smartpresence.ai / Admin123!)');
    console.log('   • 2 NFC Tags\n');

  } catch (error) {
    console.error('\n❌ Error during seed:', error);
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

// Run seed
seed()
  .then(() => {
    console.log('✅ Seed process finished successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed process failed:', error);
    process.exit(1);
  });
