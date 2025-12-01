/**
 * Plataformas LMS/SIS compatibles con SmartPresence
 * 
 * El sistema es extensible: para agregar una nueva plataforma, simplemente:
 * 1. Crea un nuevo conector que implemente SISConnector
 * 2. Agrega el valor al enum
 * 3. Regístralo en ConnectorFactory
 */
export enum IntegrationProvider {
  IDUKAY = 'IDUKAY', // Sistema chileno
  MOODLE = 'MOODLE', // LMS open source
  GENERIC_CSV = 'GENERIC_CSV', // Importación/exportación CSV
  GOOGLE_CLASSROOM = 'GOOGLE_CLASSROOM', // Google Classroom
  CANVAS = 'CANVAS', // Instructure Canvas
  BLACKBOARD = 'BLACKBOARD', // Blackboard Learn
  SCHOOLOGY = 'SCHOOLOGY', // Schoology
  BRIGHTSPACE = 'BRIGHTSPACE', // D2L Brightspace
  SAKAI = 'SAKAI', // Sakai LMS
  CUSTOM = 'CUSTOM', // Conector personalizado
}
