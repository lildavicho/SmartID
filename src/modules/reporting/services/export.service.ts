import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { DailyAttendanceReport, CourseReport, TeacherReport } from '../types/report-data.type';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  /**
   * Export data to Excel format
   */
  async exportToExcel(
    data: DailyAttendanceReport | CourseReport | TeacherReport,
    reportType: 'daily' | 'course' | 'teacher',
  ): Promise<Buffer> {
    this.logger.log(`Exporting ${reportType} to Excel`);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SmartID';
    workbook.created = new Date();

    switch (reportType) {
      case 'daily':
        await this.createDailyAttendanceSheet(workbook, data as DailyAttendanceReport);
        break;
      case 'course':
        await this.createCourseReportSheet(workbook, data as CourseReport);
        break;
      case 'teacher':
        await this.createTeacherReportSheet(workbook, data as TeacherReport);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  /**
   * Export data to PDF format
   */
  async exportToPDF(
    data: DailyAttendanceReport | CourseReport | TeacherReport,
    reportType: 'daily' | 'course' | 'teacher',
  ): Promise<Buffer> {
    this.logger.log(`Exporting ${reportType} to PDF`);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add header
      doc.fontSize(20).text('SmartID - Reporte de Asistencia', { align: 'center' });
      doc.moveDown();
      doc
        .fontSize(10)
        .text(`Fecha de generación: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();

      switch (reportType) {
        case 'daily':
          this.createDailyAttendancePDF(doc, data as DailyAttendanceReport);
          break;
        case 'course':
          this.createCourseReportPDF(doc, data as CourseReport);
          break;
        case 'teacher':
          this.createTeacherReportPDF(doc, data as TeacherReport);
          break;
        default:
          doc.text(`Unknown report type: ${reportType}`);
      }

      doc.end();
    });
  }

  /**
   * Create Daily Attendance Excel sheet
   */
  private async createDailyAttendanceSheet(
    workbook: ExcelJS.Workbook,
    data: DailyAttendanceReport,
  ): Promise<void> {
    const sheet = workbook.addWorksheet('Asistencia Diaria');

    // Set column widths
    sheet.columns = [
      { header: 'Grupo', key: 'groupName', width: 30 },
      { header: 'Curso', key: 'courseName', width: 30 },
      { header: 'Total Estudiantes', key: 'totalStudents', width: 18 },
      { header: 'Presentes', key: 'present', width: 12 },
      { header: 'Ausentes', key: 'absent', width: 12 },
      { header: 'Tardanzas', key: 'late', width: 12 },
      { header: 'Justificados', key: 'excused', width: 12 },
      { header: '% Asistencia', key: 'attendanceRate', width: 15 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data rows
    data.groups.forEach((group) => {
      sheet.addRow({
        groupName: group.groupName,
        courseName: group.courseName,
        totalStudents: group.totalStudents,
        present: group.present,
        absent: group.absent,
        late: group.late,
        excused: group.excused,
        attendanceRate: `${group.attendanceRate.toFixed(2)}%`,
      });
    });

    // Add summary row
    sheet.addRow({});
    const summaryRow = sheet.addRow({
      groupName: 'TOTAL',
      courseName: '',
      totalStudents: data.totalStudents,
      present: data.totalPresent,
      absent: data.totalAbsent,
      late: data.totalLate,
      excused: data.totalExcused,
      attendanceRate: `${data.attendanceRate.toFixed(2)}%`,
    });

    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    };
  }

  /**
   * Create Course Report Excel sheet
   */
  private async createCourseReportSheet(
    workbook: ExcelJS.Workbook,
    data: CourseReport,
  ): Promise<void> {
    const sheet = workbook.addWorksheet('Reporte de Curso');

    // Add header info
    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').value = `Curso: ${data.courseName} - ${data.groupName}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.mergeCells('A2:H2');
    sheet.getCell('A2').value = `Período: ${data.startDate} a ${data.endDate}`;

    sheet.mergeCells('A3:H3');
    sheet.getCell('A3').value = `Total de Sesiones: ${data.totalSessions}`;

    sheet.addRow([]);

    // Set columns
    sheet.columns = [
      { header: 'Código', key: 'studentCode', width: 15 },
      { header: 'Nombre', key: 'studentName', width: 30 },
      { header: 'Sesiones', key: 'totalSessions', width: 12 },
      { header: 'Presentes', key: 'presentCount', width: 12 },
      { header: 'Ausentes', key: 'absentCount', width: 12 },
      { header: 'Tardanzas', key: 'lateCount', width: 12 },
      { header: '% Asistencia', key: 'attendancePercentage', width: 15 },
      { header: '% Permanencia', key: 'permanenceAverage', width: 15 },
    ];

    // Style header
    const headerRow = sheet.getRow(5);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add student data
    data.students.forEach((student) => {
      sheet.addRow({
        studentCode: student.studentCode,
        studentName: student.studentName,
        totalSessions: student.totalSessions,
        presentCount: student.presentCount,
        absentCount: student.absentCount,
        lateCount: student.lateCount,
        attendancePercentage: `${student.attendancePercentage.toFixed(2)}%`,
        permanenceAverage: `${student.permanenceAverage.toFixed(2)}%`,
      });
    });
  }

  /**
   * Create Teacher Report Excel sheet
   */
  private async createTeacherReportSheet(
    workbook: ExcelJS.Workbook,
    data: TeacherReport,
  ): Promise<void> {
    const sheet = workbook.addWorksheet('Reporte de Docente');

    // Add header info
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = `Docente: ${data.teacherName}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.mergeCells('A2:F2');
    sheet.getCell('A2').value = `Período: ${data.month}/${data.year}`;

    sheet.mergeCells('A3:F3');
    sheet.getCell('A3').value = `Total de Sesiones: ${data.totalSessions}`;

    sheet.addRow([]);

    // Set columns
    sheet.columns = [
      { header: 'Curso', key: 'courseName', width: 30 },
      { header: 'Grupo', key: 'groupName', width: 30 },
      { header: 'Sesiones', key: 'sessionsCount', width: 12 },
      { header: 'Total Estudiantes', key: 'totalStudents', width: 18 },
      { header: '% Asistencia Promedio', key: 'averageAttendanceRate', width: 22 },
    ];

    // Style header
    const headerRow = sheet.getRow(5);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add course data
    data.courses.forEach((course) => {
      sheet.addRow({
        courseName: course.courseName,
        groupName: course.groupName,
        sessionsCount: course.sessionsCount,
        totalStudents: course.totalStudents,
        averageAttendanceRate: `${course.averageAttendanceRate.toFixed(2)}%`,
      });
    });
  }

  /**
   * Create Daily Attendance PDF
   */
  private createDailyAttendancePDF(doc: typeof PDFDocument, data: DailyAttendanceReport): void {
    doc.fontSize(16).text('Reporte Diario de Asistencia', { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Fecha: ${data.date}`);
    doc.text(`Total Estudiantes: ${data.totalStudents}`);
    doc.text(`Presentes: ${data.totalPresent}`);
    doc.text(`Ausentes: ${data.totalAbsent}`);
    doc.text(`Tardanzas: ${data.totalLate}`);
    doc.text(`Tasa de Asistencia: ${data.attendanceRate.toFixed(2)}%`);
    doc.moveDown();

    doc.fontSize(14).text('Detalle por Grupo:', { underline: true });
    doc.moveDown();

    data.groups.forEach((group) => {
      doc.fontSize(10);
      doc.text(`${group.groupName} - ${group.courseName}`);
      doc.text(
        `  Estudiantes: ${group.totalStudents} | Presentes: ${group.present} | Ausentes: ${group.absent} | Tardanzas: ${group.late}`,
      );
      doc.text(`  Asistencia: ${group.attendanceRate.toFixed(2)}%`);
      doc.moveDown(0.5);
    });
  }

  /**
   * Create Course Report PDF
   */
  private createCourseReportPDF(doc: typeof PDFDocument, data: CourseReport): void {
    doc.fontSize(16).text('Reporte de Curso', { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Curso: ${data.courseName}`);
    doc.text(`Grupo: ${data.groupName}`);
    doc.text(`Período: ${data.startDate} a ${data.endDate}`);
    doc.text(`Total Sesiones: ${data.totalSessions}`);
    doc.moveDown();

    doc.fontSize(14).text('Estudiantes:', { underline: true });
    doc.moveDown();

    data.students.forEach((student) => {
      doc.fontSize(10);
      doc.text(`${student.studentCode} - ${student.studentName}`);
      doc.text(
        `  Asistencia: ${student.attendancePercentage.toFixed(2)}% | Permanencia: ${student.permanenceAverage.toFixed(2)}%`,
      );
      doc.text(
        `  Presentes: ${student.presentCount} | Ausentes: ${student.absentCount} | Tardanzas: ${student.lateCount}`,
      );
      doc.moveDown(0.5);
    });
  }

  /**
   * Create Teacher Report PDF
   */
  private createTeacherReportPDF(doc: typeof PDFDocument, data: TeacherReport): void {
    doc.fontSize(16).text('Reporte de Docente', { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Docente: ${data.teacherName}`);
    doc.text(`Período: ${data.month}/${data.year}`);
    doc.text(`Total Sesiones: ${data.totalSessions}`);
    doc.moveDown();

    doc.fontSize(14).text('Cursos:', { underline: true });
    doc.moveDown();

    data.courses.forEach((course) => {
      doc.fontSize(10);
      doc.text(`${course.courseName} - ${course.groupName}`);
      doc.text(`  Sesiones: ${course.sessionsCount} | Estudiantes: ${course.totalStudents}`);
      doc.text(`  Asistencia Promedio: ${course.averageAttendanceRate.toFixed(2)}%`);
      doc.moveDown(0.5);
    });
  }
}
