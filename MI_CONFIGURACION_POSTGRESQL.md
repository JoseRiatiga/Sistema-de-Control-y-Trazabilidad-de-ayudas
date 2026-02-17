# MI CONFIGURACIÓN DE POSTGRESQL - COLOMBIA

## Datos de tu instalación

```
Usuario superusuario: postgres
Contraseña: Jr3003
Puerto: 5432
Región: Spanish (Colombia)
Codificación: UTF-8
Datos: Colombia - Sistema de Ayudas Humanitarias
```

---

## MUNICIPIOS DEL SISTEMA

El sistema incluye los siguientes municipios de Colombia:

- 🏛️ **Bogotá** (Capital) - Cundinamarca
- 🏙️ **Medellín** - Antioquia
- 🏖️ **Cali** - Valle del Cauca
- 🏝️ **Barranquilla** - Atlántico
- ⛰️ **Bucaramanga** - Santander

Los datos de ejemplo incluyen beneficiarios de estos municipios con cédulas válidas de Colombia.

---

## PRÓXIMOS PASOS - CREAR LA BASE DE DATOS

### Opción 1: PGADMIN (Lo más fácil) ⭐

#### Paso 1: Abre pgAdmin

1. Busca "pgAdmin 4" en el menú Inicio de Windows
2. Se abrirá en tu navegador (http://localhost:5050)
3. Ingresa:
   - **Email:** postgres@pgadmin.org
   - **Contraseña:** Jr3003

#### Paso 2: Conecta al servidor

1. En la izquierda, haz clic derecho en "Servers"
2. Selecciona "Register" → "Server"
3. Completa:
   - **Name:** localhost
   - **Host name/address:** localhost
   - **Port:** 5432
   - **Username:** postgres
   - **Password:** Jr3003
   - Marca: "Save password?"
4. Haz clic en "Save"

#### Paso 3: Crea la base de datos

1. Expande "Servers" → "localhost" en la izquierda
2. Haz clic derecho en "Databases"
3. Selecciona "Create" → "Database"
4. Nombre: `ayudas_humanitarias`
5. Haz clic en "Save"

#### Paso 4: Carga el esquema

1. Haz clic derecho en `ayudas_humanitarias`
2. Selecciona "Query Tool" (o "Tools" → "Query Tool")
3. En el editor que se abre, copia TODO el contenido de:
   ```
   c:\Users\JoseRiatiga\Desktop\Sistema de Control y Trazabilidad de ayudas\database\schema.sql
   ```
4. Presiona **F5** o el botón "Execute" (▶)
5. Verás mensajes como: "CREATE TABLE", "CREATE VIEW", etc.

#### Paso 5: Carga los datos de ejemplo (Colombia)

1. En el mismo Query Tool, borra el código anterior (Ctrl+A, Delete)
2. Copia TODO el contenido de:
   ```
   c:\Users\JoseRiatiga\Desktop\Sistema de Control y Trazabilidad de ayudas\database\seeds.sql
   ```
3. Presiona **F5**
4. Verás mensajes como: "INSERT", "UPDATE", etc.

✅ **¡Listo! Tu base de datos está lista con datos de Colombia**

---

### Opción 2: POWERSHELL (Línea de comandos)

#### Abre PowerShell como Administrador

1. Presiona `Win + X`
2. Selecciona "Windows PowerShell (Administrador)"

#### Copia y pega estos comandos UNO POR UNO:

```powershell
# Navega a tu proyecto
cd "C:\Users\JoseRiatiga\Desktop\Sistema de Control y Trazabilidad de ayudas"

# Crea la base de datos
createdb -U postgres ayudas_humanitarias
```

Te pedirá la contraseña, escribe: `Jr3003`

Luego ejecuta:

```powershell
# Carga el esquema (tablas, vistas, índices)
psql -U postgres -d ayudas_humanitarias -f database/schema.sql
```

Te pedirá contraseña nuevamente: `Jr3003`

Finalmente:

```powershell
# Carga datos de ejemplo (Colombia)
psql -U postgres -d ayudas_humanitarias -f database/seeds.sql
```

Contraseña: `Jr3003`

✅ **¡Listo! Tu base de datos está lista con datos de Colombia**

---

## VERIFICAR QUE TODO FUNCIONÓ

Abre PowerShell y ejecuta:

```powershell
psql -U postgres -d ayudas_humanitarias -c "\dt"
```

Contraseña: `Jr3003`

**Deberías ver algo así:**

```
                      List of relations
 Schema |          Name           | Type  |  Owner
--------+-------------------------+-------+----------
 public | alertas_duplicidad      | table | postgres
 public | bitacora_auditoria      | table | postgres
 public | censados                | table | postgres
 public | comprobantes_entrega    | table | postgres
 public | entregas_ayuda          | table | postgres
 public | inventario              | table | postgres
 public | reportes                | table | postgres
 public | tipos_ayuda             | table | postgres
 public | usuarios                | table | postgres
(9 rows)
```

Si ves esto, ¡todo está perfecto! ✅

---

## VER LOS DATOS DE EJEMPLO (COLOMBIA)

Para ver los beneficiarios registrados de Colombia:

```powershell
psql -U postgres -d ayudas_humanitarias -c "SELECT primer_nombre, primer_apellido, municipio, cedula FROM censados;"
```

Resultado esperado:
```
 primer_nombre | primer_apellido |   municipio   |    cedula
---------------+-----------------+---------------+-----------
 Maria         | García          | Bogotá        | 1098765432
 Carlos        | López           | Medellín      | 1012345678
 Juan          | Martínez        | Cali          | 1023456789
 Rosa          | Fernández       | Barranquilla  | 1034567890
 Pedro         | Rodríguez       | Bucaramanga   | 1045678901
(5 rows)
```

---

## DATOS PARA EL ARCHIVO .env DEL BACKEND

Después de crear la BD, necesitarás estos datos en `backend/.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ayudas_humanitarias
DB_USER=postgres
DB_PASSWORD=Jr3003
```

---

## COMANDOS ÚTILES (Guarda estos para después)

```powershell
# Ver todas tus bases de datos
psql -U postgres -l

# Conectar a la BD directamente
psql -U postgres -d ayudas_humanitarias

# Ver todas las tablas
psql -U postgres -d ayudas_humanitarias -c "\dt"

# Ver estructura de una tabla
psql -U postgres -d ayudas_humanitarias -c "\d usuarios"

# Ver datos de beneficiarios
psql -U postgres -d ayudas_humanitarias -c "SELECT * FROM censados;"

# Ver datos de usuarios
psql -U postgres -d ayudas_humanitarias -c "SELECT nombre, email, rol, municipio FROM usuarios;"

# Salir (si estás dentro de psql)
\q
```

---

## ¿QUÉ HAGO AHORA?

### Si usaste pgAdmin:
1. ✅ Ya está listo
2. Ve al **Paso 2** en `INICIO_RAPIDO.md` (instalar backend)

### Si usaste PowerShell:
1. ✅ Ya está listo
2. Ve al **Paso 2** en `INICIO_RAPIDO.md` (instalar backend)

---

## PRÓXIMO PASO: INSTALAR BACKEND

Abre PowerShell y ejecuta:

```powershell
cd "C:\Users\JoseRiatiga\Desktop\Sistema de Control y Trazabilidad de ayudas\backend"

npm install
```

Esto descargará todas las dependencias del backend.

Luego:

```powershell
cp .env.example .env
```

Abre el archivo `.env` que se creó y asegúrate que tenga:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ayudas_humanitarias
DB_USER=postgres
DB_PASSWORD=Jr3003
```

Finalmente:

```powershell
npm run dev
```

Deberías ver:
```
🚀 Server running on http://localhost:5000
📊 Database connected
```

¡Listo! 🎉

---

**¿Necesitas ayuda en algún paso? Avísame.**
