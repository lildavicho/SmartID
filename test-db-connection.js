const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.development' });

const connectionString = process.env.DATABASE_URL;

console.log('📡 Probando conexión a Supabase...\n');
console.log(
  'Connection String:',
  connectionString ? connectionString.replace(/:[^:@]+@/, ':***@') : 'NO DEFINIDA',
);

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  try {
    console.log('\n🔄 Conectando...');
    await client.connect();
    console.log('✅ ¡Conexión exitosa a Supabase!\n');

    const res = await client.query('SELECT version(), current_database(), current_user');
    console.log('📊 Información de la base de datos:');
    console.log('   Version:', res.rows[0].version.split(' ')[0] + ' ' + res.rows[0].version.split(' ')[1]);
    console.log('   Database:', res.rows[0].current_database);
    console.log('   User:', res.rows[0].current_user);

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\n📋 Tablas en la base de datos:', tables.rows.length);
    if (tables.rows.length > 0) {
      tables.rows.forEach((row) => console.log('   -', row.table_name));
    } else {
      console.log('   (Sin tablas aún - se crearán al iniciar la app)');
    }

    await client.end();
    console.log('\n✅ Test completado exitosamente!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error de conexión:');
    console.error('   Mensaje:', err.message);
    console.error('   Código:', err.code);
    console.error('\n💡 Posibles soluciones:');
    console.error('   1. Verifica que DATABASE_URL esté correcta en .env.development');
    console.error('   2. Verifica que la contraseña sea correcta: dvmt1610666');
    console.error('   3. Verifica que el proyecto de Supabase esté activo\n');
    process.exit(1);
  }
}

testConnection();
