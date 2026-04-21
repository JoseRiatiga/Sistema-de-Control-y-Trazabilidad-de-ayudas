/**
 * Script de Migración: Hashear contraseñas antiguas en texto plano
 * 
 * Este script convierte todas las contraseñas que están en texto plano
 * a contraseñas hasheadas con bcryptjs.
 * 
 * IMPORTANTE: Ejecutar SOLO UNA VEZ antes de que los usuarios intenten loguear
 * 
 * Uso: node migration-hash-passwords.js
 */

const bcrypt = require('bcryptjs');
const db = require('./db');

async function migratePasswordsToHash() {
  console.log('\n🔐 INICIANDO MIGRACIÓN DE CONTRASEÑAS...\n');

  try {
    // 1. Obtener todos los usuarios
    console.log('📋 Obteniendo todos los usuarios...');
    const getUsersQuery = 'SELECT id, nombre, email, contraseña_hash FROM usuarios';
    const result = await db.query(getUsersQuery);
    const users = result.rows;

    console.log(`✓ Se encontraron ${users.length} usuarios\n`);

    if (users.length === 0) {
      console.log('ℹ️  No hay usuarios para migrar.');
      await db.end();
      return;
    }

    let migratedCount = 0;
    let alreadyHashedCount = 0;
    let errorCount = 0;

    // 2. Procesar cada usuario
    for (const user of users) {
      try {
        const password = user.contraseña_hash;

        // Detectar si ya está hasheada
        // Las contraseñas hasheadas con bcryptjs empiezan con $2a$ o $2b$
        if (password && (password.startsWith('$2a$') || password.startsWith('$2b$'))) {
          console.log(`✓ [${user.email}] - Ya está hasheada (saltando)`);
          alreadyHashedCount++;
          continue;
        }

        // Si está vacía o es NULL
        if (!password) {
          console.log(`⚠️  [${user.email}] - Contraseña vacía (SALTANDO)`);
          continue;
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Actualizar en la base de datos
        const updateQuery = 'UPDATE usuarios SET contraseña_hash = $1 WHERE id = $2';
        await db.query(updateQuery, [hashedPassword, user.id]);

        console.log(`🔐 [${user.email}] - Contraseña migrada exitosamente`);
        migratedCount++;
      } catch (userError) {
        console.error(`❌ [${user.email}] - Error: ${userError.message}`);
        errorCount++;
      }
    }

    // 3. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`✓ Migradas exitosamente: ${migratedCount}`);
    console.log(`✓ Ya estaban hasheadas: ${alreadyHashedCount}`);
    console.log(`❌ Errores encontrados: ${errorCount}`);
    console.log(`📈 Total procesados: ${migratedCount + alreadyHashedCount + errorCount}/${users.length}`);
    console.log('='.repeat(60));

    if (migratedCount > 0) {
      console.log('\n✅ MIGRACIÓN COMPLETADA CON ÉXITO');
      console.log('   Los usuarios ya pueden loguear con sus contraseñas antiguas');
      console.log('   Las contraseñas ahora están almacenadas de forma segura con bcryptjs\n');
    } else if (alreadyHashedCount === users.length) {
      console.log('\n✅ TODAS LAS CONTRASEÑAS YA ESTABAN HASHEADAS');
      console.log('   No se realizó ninguna migración\n');
    } else {
      console.log('\n⚠️  MIGRACIÓN PARCIAL - Revisa los errores arriba\n');
    }

  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN LA MIGRACIÓN:', error.message);
    console.error(error);
  } finally {
    // Cerrar conexión
    try {
      await db.end();
      console.log('✓ Conexión a base de datos cerrada\n');
    } catch (closeError) {
      console.error('Error cerrando conexión:', closeError.message);
    }
  }
}

// Ejecutar migración
migratePasswordsToHash();
