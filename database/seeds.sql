-- Script para insertar datos de ejemplo en la base de datos

-- Tipos de Ayuda
INSERT INTO tipos_ayuda (id, nombre, descripcion, unidad) VALUES
(gen_random_uuid(), 'Alimentos Secos', 'Paquetes de alimentos no perecederos', 'Paquete'),
(gen_random_uuid(), 'Arroz', 'Arroz por kilogramo', 'Kg'),
(gen_random_uuid(), 'Frijoles', 'Frijoles por kilogramo', 'Kg'),
(gen_random_uuid(), 'Aceite', 'Aceite de cocina por litro', 'Litro'),
(gen_random_uuid(), 'Leche', 'Leche en polvo por kilogramo', 'Kg'),
(gen_random_uuid(), 'Medicamentos', 'Medicamentos varios', 'Unidad'),
(gen_random_uuid(), 'Mantas', 'Mantas para abrigo', 'Unidad'),
(gen_random_uuid(), 'Agua Potable', 'Garrafones de agua', 'Galón'),
(gen_random_uuid(), 'Donaciones', 'Donaciones', 'Donación');

-- Beneficiarios de Ejemplo - Córdoba
INSERT INTO censados (id, cedula, primer_nombre, primer_apellido, telefono, email, direccion, municipio, latitud, longitud, miembros_familia) VALUES
-- Montería (Córdoba)
(gen_random_uuid(), '1098765432', 'Maria', 'García', '3015550001', 'maria.garcia@example.com', 'Carrera 10 # 45-30', 'Montería', 9.2533, -75.8864, 4),
(gen_random_uuid(), '1098765433', 'Sandra', 'Martínez', '3015550010', 'sandra.martinez@example.com', 'Calle 72 # 5-40', 'Montería', 9.2550, -75.8850, 3),
(gen_random_uuid(), '1098765434', 'Luis', 'González', '3015550011', 'luis.gonzalez@example.com', 'Avenida Circunvalar # 85', 'Montería', 9.2600, -75.8900, 5),
(gen_random_uuid(), '1098765435', 'Ana', 'Pérez', '3015550012', 'ana.perez@example.com', 'Calle 19 # 3-50', 'Montería', 9.2580, -75.8880, 2),
-- Lorica (Córdoba)
(gen_random_uuid(), '1012345678', 'Carlos', 'López', '3105550002', 'carlos.lopez@example.com', 'Calle 8 # 15-50', 'Lorica', 9.2318, -75.3825, 3),
(gen_random_uuid(), '1012345679', 'Javier', 'Restrepo', '3105550020', 'javier.restrepo@example.com', 'Carrera 4 # 50-20', 'Lorica', 9.2350, -75.3900, 4),
(gen_random_uuid(), '1012345680', 'Esperanza', 'Vargas', '3105550021', 'esperanza.vargas@example.com', 'Calle 10 # 45-60', 'Lorica', 9.2400, -75.3700, 6),
(gen_random_uuid(), '1012345681', 'Roberto', 'Ortiz', '3105550022', 'roberto.ortiz@example.com', 'Avenida Santander # 25', 'Lorica', 9.2450, -75.3850, 3),
-- Cereté (Córdoba)
(gen_random_uuid(), '1023456789', 'Juan', 'Martínez', '3185550003', 'juan.martinez@example.com', 'Avenida Paseo 40', 'Cereté', 9.0906, -75.8044, 5),
(gen_random_uuid(), '1023456790', 'Patricia', 'Sánchez', '3185550030', 'patricia.sanchez@example.com', 'Calle 5 # 45-80', 'Cereté', 9.0950, -75.8000, 4),
(gen_random_uuid(), '1023456791', 'Fernando', 'Acosta', '3185550031', 'fernando.acosta@example.com', 'Carrera 6 # 12-50', 'Cereté', 9.0900, -75.8100, 3),
(gen_random_uuid(), '1023456792', 'Catalina', 'Herrera', '3185550032', 'catalina.herrera@example.com', 'Avenida 6 # 3-45', 'Cereté', 9.0930, -75.8050, 2),
-- Sahagún (Córdoba)
(gen_random_uuid(), '1034567890', 'Rosa', 'Fernández', '3145550004', 'rosa.fernandez@example.com', 'Calle 25 # 8-45', 'Sahagún', 9.7367, -75.4169, 2),
(gen_random_uuid(), '1034567891', 'Miguel', 'Colon', '3145550040', 'miguel.colon@example.com', 'Carrera 52 # 75-120', 'Sahagún', 9.7400, -75.4200, 5),
(gen_random_uuid(), '1034567892', 'Margarita', 'Díaz', '3145550041', 'margarita.diaz@example.com', 'Calle 50 # 45-60', 'Sahagún', 9.7350, -75.4150, 3),
(gen_random_uuid(), '1034567893', 'Andrés', 'Miranda', '3145550042', 'andres.miranda@example.com', 'Avenida 20 # 100-150', 'Sahagún', 9.7380, -75.4180, 4),
-- Planeta Rica (Córdoba)
(gen_random_uuid(), '1045678901', 'Pedro', 'Rodríguez', '3165550005', 'pedro.rodriguez@example.com', 'Carrera 7 # 32-60', 'Planeta Rica', 8.9239, -75.7186, 6),
(gen_random_uuid(), '1045678902', 'Gloria', 'Castillo', '3165550050', 'gloria.castillo@example.com', 'Calle 35 # 25-40', 'Planeta Rica', 8.9280, -75.7150, 3),
(gen_random_uuid(), '1045678903', 'Ricardo', 'Gómez', '3165550051', 'ricardo.gomez@example.com', 'Carrera 19 # 12-50', 'Planeta Rica', 8.9220, -75.7200, 4),
-- Tierralta (Córdoba)
(gen_random_uuid(), '1056789012', 'Beatriz', 'Salazar', '3175550060', 'beatriz.salazar@example.com', 'Calle del Centro # 8-50', 'Tierralta', 8.2289, -76.3258, 3),
(gen_random_uuid(), '1056789013', 'Héctor', 'Morales', '3175550061', 'hector.morales@example.com', 'Avenida Principal # 25', 'Tierralta', 8.2320, -76.3200, 5),
-- Ayapel (Córdoba)
(gen_random_uuid(), '1067890123', 'Marcela', 'Flores', '3185550070', 'marcela.flores@example.com', 'Calle 14 # 1-25', 'Ayapel', 8.8778, -75.0667, 2),
(gen_random_uuid(), '1067890124', 'Edgar', 'Ruiz', '3185550071', 'edgar.ruiz@example.com', 'Carrera 1 # 17-40', 'Ayapel', 8.8800, -75.0650, 4),
-- San Pelayo (Córdoba)
(gen_random_uuid(), '1078901234', 'Irene', 'Torres', '3195550080', 'irene.torres@example.com', 'Avenida Principal # 8-40', 'San Pelayo', 9.5133, -75.2858, 3),
(gen_random_uuid(), '1078901235', 'Jesús', 'Villamizar', '3195550081', 'jesus.villamizar@example.com', 'Carrera 5 # 10-50', 'San Pelayo', 9.5170, -75.2820, 5),
-- Buenavista (Córdoba)
(gen_random_uuid(), '1089012345', 'Dolores', 'Acuña', '3165550090', 'dolores.acuna@example.com', 'Calle 19 # 8-50', 'Buenavista', 9.0800, -75.1325, 2),
(gen_random_uuid(), '1089012346', 'Gustavo', 'Ramos', '3165550091', 'gustavo.ramos@example.com', 'Carrera 9 # 12-40', 'Buenavista', 9.0840, -75.1300, 4),
-- Purísima (Córdoba)
(gen_random_uuid(), '1090123456', 'Yolanda', 'Caicedo', '3165550100', 'yolanda.caicedo@example.com', 'Calle 21 # 15-50', 'Purísima', 9.3194, -75.5125, 3),
(gen_random_uuid(), '1090123457', 'Wilmer', 'Peña', '3165550101', 'wilmer.pena@example.com', 'Carrera 14 # 10-30', 'Purísima', 9.3230, -75.5100, 4),
-- Moñitos (Córdoba)
(gen_random_uuid(), '1001234567', 'Inés', 'Guzmán', '3165550110', 'ines.guzman@example.com', 'Calle 23 # 20-40', 'Moñitos', 9.2722, -76.2558, 2),
(gen_random_uuid(), '1001234568', 'Álvaro', 'Agudelo', '3165550111', 'alvaro.agudelo@example.com', 'Carrera 7 # 15-50', 'Moñitos', 9.2750, -76.2530, 5);

-- Usuario Administrador - Córdoba
INSERT INTO usuarios (id, nombre, email, contraseña_hash, rol, telefono, municipio) VALUES
(gen_random_uuid(), 'Admin Sistema', 'admin@corboba-ayudas.com', 'admin123', 'administrador', '3001234567', 'Montería');

-- Inventario Inicial - Córdoba
INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen) 
SELECT 
  gen_random_uuid(),
  ta.id,
  150,
  25000.00,
  'Montería',
  'Almacén Central Montería - Zona Administrativa'
FROM tipos_ayuda ta
LIMIT 4;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  80,
  20000.00,
  'Lorica',
  'Centro de Distribución Lorica'
FROM tipos_ayuda ta
LIMIT 3;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  100,
  22500.00,
  'Cereté',
  'Almacén de Cereté'
FROM tipos_ayuda ta
LIMIT 2;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  120,
  23000.00,
  'Sahagún',
  'Centro de Acopio Sahagún'
FROM tipos_ayuda ta
LIMIT 2;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  90,
  21000.00,
  'Planeta Rica',
  'Almacén Planeta Rica'
FROM tipos_ayuda ta
LIMIT 2;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  60,
  24000.00,
  'Tierralta',
  'Centro de Distribución Tierralta'
FROM tipos_ayuda ta
LIMIT 2;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  75,
  23500.00,
  'Ayapel',
  'Almacén Ayapel'
FROM tipos_ayuda ta
LIMIT 1;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  85,
  19000.00,
  'San Pelayo',
  'Centro San Pelayo'
FROM tipos_ayuda ta
LIMIT 2;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  70,
  22000.00,
  'Buenavista',
  'Almacén Buenavista'
FROM tipos_ayuda ta
LIMIT 1;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  65,
  21500.00,
  'Purísima',
  'Centro Purísima'
FROM tipos_ayuda ta
LIMIT 1;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  80,
  22500.00,
  'Moñitos',
  'Almacén Moñitos'
FROM tipos_ayuda ta
LIMIT 1;
