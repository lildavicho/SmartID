// Setup global para tests e2e
// Aumentar timeout para tests que usan BD
jest.setTimeout(30000);

// Suprimir logs de Nest durante tests
process.env.LOG_LEVEL = 'error';
