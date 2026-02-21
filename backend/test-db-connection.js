require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

console.log('🔍 Intentando conectar a la BD...');
console.log('Host:', process.env.DB_HOST);
console.log('Puerto:', process.env.DB_PORT);
console.log('Base de datos:', process.env.DB_NAME);
console.log('Usuario:', process.env.DB_USER);
console.log('---');

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conexión exitosa a la BD');
    
    // Hacer una query simple para validar
    client.query('SELECT NOW()', (err, result) => {
      release();
      
      if (err) {
        console.error('❌ Error en query:', err.message);
        process.exit(1);
      } else {
        console.log('✅ Query exitosa');
        console.log('Hora de la BD:', result.rows[0]);
        process.exit(0);
      }
    });
  }
});
