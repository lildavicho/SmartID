import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migración para actualizar el esquema de base de datos para producción
 * 
 * Cambios:
 * 1. Agregar externalId a institutions
 * 2. Agregar source y confidence a attendance_records
 * 3. Agregar createdBy y updatedBy a class_sessions
 * 4. Crear tabla external_teacher_accounts
 * 5. Crear tabla external_class_mappings
 * 6. Agregar índices para optimización
 */
export class UpdateSchemaForProduction1700000000000 implements MigrationInterface {
  name = 'UpdateSchemaForProduction1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar externalId a institutions
    await queryRunner.addColumn(
      'institutions',
      new TableColumn({
        name: 'externalId',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // 2. Agregar source y confidence a attendance_records
    // Nota: PostgreSQL requiere crear el enum primero
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE attendance_source_enum AS ENUM ('NFC', 'CAMERA_YOLO', 'MANUAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.addColumn(
      'attendance_records',
      new TableColumn({
        name: 'source',
        type: 'attendance_source_enum',
        default: "'MANUAL'",
      }),
    );

    await queryRunner.addColumn(
      'attendance_records',
      new TableColumn({
        name: 'confidence',
        type: 'decimal',
        precision: 5,
        scale: 4,
        isNullable: true,
      }),
    );

    // 3. Agregar createdBy y updatedBy a class_sessions
    await queryRunner.addColumn(
      'class_sessions',
      new TableColumn({
        name: 'createdBy',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'class_sessions',
      new TableColumn({
        name: 'updatedBy',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // 4. Crear tabla external_teacher_accounts
    await queryRunner.createTable(
      new Table({
        name: 'external_teacher_accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'teacherId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'platform',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'externalId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Índices para external_teacher_accounts
    await queryRunner.createIndex(
      'external_teacher_accounts',
      new TableIndex({
        name: 'IDX_external_teacher_accounts_teacher_platform',
        columnNames: ['teacherId', 'platform'],
      }),
    );

    await queryRunner.createIndex(
      'external_teacher_accounts',
      new TableIndex({
        name: 'IDX_external_teacher_accounts_platform_external',
        columnNames: ['platform', 'externalId'],
      }),
    );

    // Foreign key para external_teacher_accounts
    await queryRunner.createForeignKey(
      'external_teacher_accounts',
      new TableForeignKey({
        columnNames: ['teacherId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teachers',
        onDelete: 'CASCADE',
      }),
    );

    // 5. Crear tabla external_class_mappings
    await queryRunner.createTable(
      new Table({
        name: 'external_class_mappings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'classId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'platform',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'externalClassId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Índices para external_class_mappings
    await queryRunner.createIndex(
      'external_class_mappings',
      new TableIndex({
        name: 'IDX_external_class_mappings_class_platform',
        columnNames: ['classId', 'platform'],
      }),
    );

    await queryRunner.createIndex(
      'external_class_mappings',
      new TableIndex({
        name: 'IDX_external_class_mappings_platform_external',
        columnNames: ['platform', 'externalClassId'],
      }),
    );

    // Foreign key para external_class_mappings
    await queryRunner.createForeignKey(
      'external_class_mappings',
      new TableForeignKey({
        columnNames: ['classId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'groups',
        onDelete: 'CASCADE',
      }),
    );

    // 6. Agregar índices adicionales para optimización
    await queryRunner.createIndex(
      'class_sessions',
      new TableIndex({
        name: 'IDX_class_sessions_teacher_status',
        columnNames: ['teacherId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'class_sessions',
      new TableIndex({
        name: 'IDX_class_sessions_status_actual_start',
        columnNames: ['status', 'actualStart'],
      }),
    );

    await queryRunner.createIndex(
      'class_sessions',
      new TableIndex({
        name: 'IDX_class_sessions_device',
        columnNames: ['deviceId'],
      }),
    );

    await queryRunner.createIndex(
      'attendance_records',
      new TableIndex({
        name: 'IDX_attendance_records_session_student',
        columnNames: ['sessionId', 'studentId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.dropIndex('attendance_records', 'IDX_attendance_records_session_student');
    await queryRunner.dropIndex('class_sessions', 'IDX_class_sessions_device');
    await queryRunner.dropIndex('class_sessions', 'IDX_class_sessions_status_actual_start');
    await queryRunner.dropIndex('class_sessions', 'IDX_class_sessions_teacher_status');

    // Eliminar foreign keys y tablas
    await queryRunner.dropTable('external_class_mappings');
    await queryRunner.dropTable('external_teacher_accounts');

    // Eliminar columnas agregadas
    await queryRunner.dropColumn('class_sessions', 'updatedBy');
    await queryRunner.dropColumn('class_sessions', 'createdBy');
    await queryRunner.dropColumn('attendance_records', 'confidence');
    await queryRunner.dropColumn('attendance_records', 'source');
    await queryRunner.dropColumn('institutions', 'externalId');
  }
}

