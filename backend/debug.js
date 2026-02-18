require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

async function debug() {
  try {
    console.log('=== DEBUG - Verificando datos en la base de datos ===\n');

    // 1. Contar censados
    const censadosRes = await pool.query('SELECT COUNT(*) as total FROM censados');
    console.log(`✓ Total de beneficiarios: ${censadosRes.rows[0].total}`);

    // 2. Contar entregas
    const entregasRes = await pool.query('SELECT COUNT(*) as total FROM entregas_ayuda');
    console.log(`✓ Total de entregas: ${entregasRes.rows[0].total}\n`);

    // 3. Listar algunos censados
    console.log('--- BENEFICIARIOS (primeros 5) ---');
    const censadosListRes = await pool.query('SELECT id, cedula, primer_nombre, primer_apellido FROM censados LIMIT 5');
    censadosListRes.rows.forEach(c => {
      console.log(`  ID: ${c.id} | Cédula: ${c.cedula} | Nombre: ${c.primer_nombre} ${c.primer_apellido}`);
    });

    // 4. Listar algunas entregas
    console.log('\n--- ENTREGAS (primeras 5) ---');
    const entregasListRes = await pool.query(`
      SELECT ea.id, ea.censado_id, ea.cantidad, ea.fecha_entrega, 
             c.primer_nombre, c.primer_apellido, ta.nombre 
      FROM entregas_ayuda ea 
      JOIN censados c ON ea.censado_id = c.id 
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id 
      LIMIT 5
    `);
    entregasListRes.rows.forEach(e => {
      console.log(`  Entrega ID: ${e.id}`);
      console.log(`    Beneficiario: ${e.primer_nombre} ${e.primer_apellido}`);
      console.log(`    Tipo: ${e.nombre} | Cantidad: ${e.cantidad}`);
      console.log(`    Fecha: ${e.fecha_entrega}\n`);
    });

    // 5. Probar query exacta del endpoint
    if (censadosListRes.rows.length > 0) {
      const testCensadoId = censadosListRes.rows[0].id;
      console.log(`--- PROBANDO QUERY PARA CENSADO: ${testCensadoId} (${censadosListRes.rows[0].primer_nombre}) ---`);
      
      const testRes = await pool.query(`
        SELECT ea.*, ta.nombre as aid_type_name, c.primer_nombre, c.primer_apellido, c.cedula, u.nombre as operator_name, i.ubicacion_almacen, c.municipio
        FROM entregas_ayuda ea
        JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
        JOIN censados c ON ea.censado_id = c.id
        LEFT JOIN usuarios u ON ea.operador_id = u.id
        LEFT JOIN inventario i ON ea.tipo_ayuda_id = i.tipo_ayuda_id AND c.municipio = i.municipio
        WHERE ea.censado_id = $1
        ORDER BY ea.fecha_entrega DESC
      `, [testCensadoId]);

      console.log(`✓ Entregas para este beneficiario: ${testRes.rows.length}`);
      if (testRes.rows.length > 0) {
        testRes.rows.forEach(e => {
          console.log(`  - ${e.aid_type_name}: ${e.cantidad} | ${e.operator_name || '(sin operador)'}`);
        });
      } else {
        console.log('  (Sin entregas)');
      }
    }

    // 6. Probar con un beneficiario que SÍ tiene entregas
    console.log('\n--- BUSCANDO BENEFICIARIOS CON ENTREGAS ---');
    const withDeliveriesRes = await pool.query(`
      SELECT DISTINCT c.id, c.cedula, c.primer_nombre, c.primer_apellido, COUNT(ea.id) as total_entregas
      FROM censados c
      JOIN entregas_ayuda ea ON c.id = ea.censado_id
      GROUP BY c.id, c.cedula, c.primer_nombre, c.primer_apellido
      ORDER BY total_entregas DESC
    `);
    
    withDeliveriesRes.rows.forEach(c => {
      console.log(`  ${c.primer_nombre} ${c.primer_apellido} (${c.cedula}): ${c.total_entregas} entrega(s)`);
    });

    if (withDeliveriesRes.rows.length > 0) {
      const testCensadoId2 = withDeliveriesRes.rows[0].id;
      console.log(`\n--- PROBANDO CON: ${withDeliveriesRes.rows[0].primer_nombre} (ID: ${testCensadoId2}) (${withDeliveriesRes.rows[0].total_entregas} entregas) ---`);
      
      const testRes2 = await pool.query(`
        SELECT ea.*, ta.nombre as aid_type_name, c.primer_nombre, c.primer_apellido, c.cedula, u.nombre as operator_name, i.ubicacion_almacen, c.municipio
        FROM entregas_ayuda ea
        JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
        JOIN censados c ON ea.censado_id = c.id
        LEFT JOIN usuarios u ON ea.operador_id = u.id
        LEFT JOIN inventario i ON ea.tipo_ayuda_id = i.tipo_ayuda_id AND c.municipio = i.municipio
        WHERE ea.censado_id = $1
        ORDER BY ea.fecha_entrega DESC
      `, [testCensadoId2]);

      console.log(`✓ Entregas encontradas: ${testRes2.rows.length}`);
      testRes2.rows.forEach(e => {
        console.log(`  - ${e.aid_type_name}: ${e.cantidad} | Operador: ${e.operator_name || '(null)'}`);
      });
    }

    // 7. Buscar específicamente a Valeria Prada
    console.log('\n--- BÚSQUEDA ESPECÍFICA: VALERIA PRADA ---');
    const valeriaRes = await pool.query(`
      SELECT c.id, c.cedula, c.primer_nombre, c.primer_apellido
      FROM censados c
      WHERE LOWER(c.primer_nombre) LIKE '%valeria%' OR LOWER(c.primer_apellido) LIKE '%prada%'
    `);
    
    if (valeriaRes.rows.length > 0) {
      console.log(`Encontrada(s) ${valeriaRes.rows.length} persona(s):`);
      valeriaRes.rows.forEach(c => {
        console.log(`  ID: ${c.id}`);
        console.log(`  Nombre: ${c.primer_nombre} ${c.primer_apellido}`);
        console.log(`  Cédula: ${c.cedula}`);
      });

      // Verificar entregas para cada uno
      for (const censado of valeriaRes.rows) {
        const entregasRes = await pool.query(`
          SELECT COUNT(*) as total FROM entregas_ayuda WHERE censado_id = $1
        `, [censado.id]);
        console.log(`  Entregas: ${entregasRes.rows[0].total}`);
      }
    } else {
      console.log('No se encontró persona con ese nombre');
    }

    await pool.end();
    console.log('\n✓ Debug completado');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debug();
