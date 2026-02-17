# GUÍA COMPLETA: CREAR BASE DE DATOS EN POSTGRESQL

## PASO 1: VERIFICAR INSTALACIÓN DE POSTGRESQL

### 1.1 ¿Tengo PostgreSQL instalado?

Abre PowerShell y ejecuta:

```powershell
psql --version
```

**Resultado esperado:**
```
psql (PostgreSQL) 12.x or later
```

**Si NO ves la versión:**
- Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/
- Instala siguiendo los pasos (recuerda la contraseña del usuario `postgres`)
- Reinicia PowerShell y vuelve a intentar

---

## PASO 2: ABRE POWERSHELL COMO ADMINISTRADOR

1. Presiona `Win + X`
2. Selecciona "Windows PowerShell (Administrador)"
3. O haz clic derecho en PowerShell y selecciona "Ejecutar como administrador"

---

## PASO 3: CONECTARSE A POSTGRESQL (3 OPCIONES)

### OPCIÓN A: Usar pgAdmin (Interfaz Gráfica) ⭐ RECOMENDADO

1. **Abre pgAdmin**
   - Lo instalaste con PostgreSQL
   - Busca "pgAdmin" en el menú Inicio de Windows
   - Se abrirá en tu navegador (http://localhost:5050)

2. **Inicia sesión**
   - Email: postgres@pgadmin.org
   - Contraseña: La que pusiste durante la instalación

3. **Conéctate al servidor**
   - En la izquierda, haz clic derecho en "Servers"
   - Selecciona "Register" → "Server"
   - Nombre: `localhost`
   - Host: `localhost`
   - Username: `postgres`
   - Password: Tu contraseña de postgres
   - Haz clic en "Save"

4. **Crea la base de datos**
   - Expande "Servers" → "localhost"
   - Haz clic derecho en "Databases"
   - Selecciona "Create" → "Database"
   - Nombre: `ayudas_humanitarias`
   - Haz clic en "Save"

5. **Carga el esquema**
   - Haz clic derecho en `ayudas_humanitarias`
   - Selecciona "Query Tool"
   - Abre el archivo: `database/schema.sql`
   - Copia todo el contenido y pégalo en el Query Tool
   - Presiona `F5` o haz clic en "Execute"
   - Verás los mensajes de creación

6. **Carga los datos de ejemplo**
   - Abre el archivo: `database/seeds.sql`
   - Copia todo el contenido y pégalo en el Query Tool
   - Presiona `F5` para ejecutar

✅ **¡Listo! Tu base de datos está creada**

---

### OPCIÓN B: Usar PowerShell (Línea de Comandos)

#### Paso 1: Abre PowerShell como Administrador

#### Paso 2: Crea la base de datos

```powershell
createdb -U postgres ayudas_humanitarias
```

**Qué hace:** Crea una base de datos llamada `ayudas_humanitarias`
**Si pide contraseña:** Ingresa la contraseña que pusiste en PostgreSQL

#### Paso 3: Carga el esquema

Primero, navega a la carpeta del proyecto:

```powershell
cd "C:\Users\JoseRiatiga\Desktop\Sistema de Control y Trazabilidad de ayudas"
```

Luego ejecuta:

```powershell
psql -U postgres -d ayudas_humanitarias -f database/schema.sql
```

**Qué hace:** Carga la estructura de tablas
**Resultado esperado:** Verás líneas que dicen "CREATE TABLE", "CREATE VIEW", etc.

#### Paso 4: Carga los datos de ejemplo

```powershell
psql -U postgres -d ayudas_humanitarias -f database/seeds.sql
```

**Qué hace:** Carga usuarios de ejemplo, tipos de ayuda, beneficiarios, etc.
**Resultado esperado:** Verás líneas que dicen "INSERT", "UPDATE", etc.

✅ **¡Listo! Tu base de datos está creada con datos de ejemplo**

---

### OPCIÓN C: Usar DBeaver (Otra Interfaz Gráfica)

1. **Descarga DBeaver** desde: https://dbeaver.io/download/

2. **Crea conexión**
   - Abre DBeaver
   - Haz clic en "Database" → "New Database Connection"
   - Selecciona "PostgreSQL"
   - Llena los campos:
     - Host: `localhost`
     - Port: `5432`
     - Database: (déjalo vacío por ahora)
     - Username: `postgres`
     - Password: Tu contraseña
   - Haz clic en "Test Connection"
   - Haz clic en "Finish"

3. **Crea la base de datos**
   - En la izquierda, expande tu conexión
   - Haz clic derecho en "Databases"
   - Selecciona "Create New Database"
   - Nombre: `ayudas_humanitarias`
   - Haz clic en "Finish"

4. **Carga el esquema**
   - Haz clic derecho en la nueva BD
   - Selecciona "SQL Editor" → "Open SQL Script"
   - Abre `database/schema.sql`
   - Presiona `Ctrl + Enter` para ejecutar

5. **Carga los datos**
   - Abre `database/seeds.sql`
   - Presiona `Ctrl + Enter` para ejecutar

✅ **¡Listo! Tu base de datos está creada**

---

## PASO 4: VERIFICA QUE TODO FUNCIONÓ

### Opción A: Con pgAdmin
1. Expande tu servidor
2. Expande "Databases"
3. Verás `ayudas_humanitarias`
4. Expándela
5. Verás las tablas: `users`, `censados`, `aid_types`, etc.

### Opción B: Con PowerShell

```powershell
psql -U postgres -d ayudas_humanitarias -c "\dt"
```

**Resultado esperado:**
```
List of relations
 Schema | Name                | Type  | Owner
--------+---------------------+-------+----------
 public | aid_deliveries      | table | postgres
 public | aid_types           | table | postgres
 public | audit_logs          | table | postgres
 public | censados            | table | postgres
 public | delivery_receipt    | table | postgres
 public | duplicate_alerts    | table | postgres
 public | inventory           | table | postgres
 public | reports             | table | postgres
 public | users               | table | postgres
```

### Opción C: Con DBeaver
1. Expande tu base de datos
2. Expande "Schemas" → "public" → "Tables"
3. Verás todas las tablas listadas

---

## PASO 5: OBTÉN LOS DATOS DE CONEXIÓN PARA EL BACKEND

El backend necesita estos datos en el archivo `.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ayudas_humanitarias
DB_USER=postgres
DB_PASSWORD=TU_CONTRASEÑA_AQUI
```

Reemplaza `TU_CONTRASEÑA_AQUI` con la contraseña que pusiste en PostgreSQL.

---

## TABLA DE COMANDOS ÚTILES

| Comando | Qué hace |
|---------|----------|
| `psql -U postgres` | Conectar a PostgreSQL |
| `\l` | Listar bases de datos |
| `\c ayudas_humanitarias` | Cambiar a esa BD |
| `\dt` | Ver todas las tablas |
| `\d users` | Ver estructura de la tabla `users` |
| `SELECT * FROM users;` | Ver datos de una tabla |
| `\q` | Salir de PostgreSQL |

---

## SOLUCIÓN DE PROBLEMAS

### ❌ "psql no es reconocido"

**Problema:** El comando `psql` no funciona
**Solución:**
1. PostgreSQL no está en el PATH
2. Reinstala PostgreSQL y marca la opción "Add to PATH"
3. O usa la ruta completa: `"C:\Program Files\PostgreSQL\15\bin\psql"` (ajusta la versión)

---

### ❌ "La contraseña es incorrecta"

**Problema:** No recuerdas la contraseña de `postgres`
**Solución:**
1. Desinstala PostgreSQL
2. Reinstala y anota la contraseña
3. O en Windows:
   - Abre "Servicios" (services.msc)
   - Busca "postgresql"
   - Haz clic derecho → "Propiedades"
   - Pestaña "Iniciar sesión"
   - Verás el usuario

---

### ❌ "El puerto 5432 está en uso"

**Problema:** Otro programa usa el puerto de PostgreSQL
**Solución:**
1. En PowerShell:
   ```powershell
   Get-NetTCPConnection -LocalPort 5432
   ```
2. Anota el ID del proceso
3. Cierra el programa o cambia el puerto en PostgreSQL

---

### ❌ "Error: database "ayudas_humanitarias" does not exist"

**Problema:** La base de datos no se creó
**Solución:**
1. Verifica que creaste la BD:
   ```powershell
   psql -U postgres -l
   ```
2. Si no existe, vuelve al Paso 3 y créala

---

### ❌ "Error: permission denied for schema public"

**Problema:** No tienes permisos suficientes
**Solución:**
1. Conecta como superusuario:
   ```powershell
   psql -U postgres -d ayudas_humanitarias
   ```
2. Ejecuta:
   ```sql
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
   ```

---

## VERIFICACIÓN FINAL

Después de completar todos los pasos:

1. **Verifica que la BD existe:**
   ```powershell
   psql -U postgres -l | findstr ayudas_humanitarias
   ```

2. **Verifica que hay tablas:**
   ```powershell
   psql -U postgres -d ayudas_humanitarias -c "\dt"
   ```

3. **Verifica que hay datos de ejemplo:**
   ```powershell
   psql -U postgres -d ayudas_humanitarias -c "SELECT COUNT(*) FROM users;"
   ```

---

## PRÓXIMO PASO

Una vez la base de datos esté creada, sigue con el Paso 2 en `INICIO_RAPIDO.md`:

```powershell
cd backend
npm install
cp .env.example .env
# Edita .env con los datos de la BD
npm run dev
```

---

## RESUMEN RÁPIDO (Para los impacientes)

```powershell
# 1. Crear BD
createdb -U postgres ayudas_humanitarias

# 2. Cargar esquema (desde la carpeta del proyecto)
psql -U postgres -d ayudas_humanitarias -f database/schema.sql

# 3. Cargar datos de ejemplo
psql -U postgres -d ayudas_humanitarias -f database/seeds.sql

# 4. Verificar
psql -U postgres -d ayudas_humanitarias -c "\dt"
```

¡Listo! 🎉

---

**¿Tienes dudas?** Lee la sección "Solución de Problemas" o contacta al equipo de desarrollo.
