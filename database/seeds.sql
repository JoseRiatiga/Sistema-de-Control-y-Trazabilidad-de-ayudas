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
(gen_random_uuid(), 'Agua Potable', 'Garrafones de agua', 'Galón');

-- Beneficiarios de Ejemplo - Colombia (Múltiples municipios)
INSERT INTO censados (id, cedula, primer_nombre, primer_apellido, telefono, email, direccion, municipio, latitud, longitud, miembros_familia) VALUES
-- Bogotá (Cundinamarca)
(gen_random_uuid(), '1098765432', 'Maria', 'García', '3015550001', 'maria.garcia@example.com', 'Carrera 10 # 45-30', 'Bogotá', 4.7110, -74.0087, 4),
(gen_random_uuid(), '1098765433', 'Sandra', 'Martínez', '3015550010', 'sandra.martinez@example.com', 'Calle 72 # 5-40', 'Bogotá', 4.7150, -74.0050, 3),
(gen_random_uuid(), '1098765434', 'Luis', 'González', '3015550011', 'luis.gonzalez@example.com', 'Avenida Caracas # 85', 'Bogotá', 4.7200, -74.0100, 5),
(gen_random_uuid(), '1098765435', 'Ana', 'Pérez', '3015550012', 'ana.perez@example.com', 'Calle 19 # 3-50', 'Bogotá', 4.7180, -74.0080, 2),
-- Medellín (Antioquia)
(gen_random_uuid(), '1012345678', 'Carlos', 'López', '3105550002', 'carlos.lopez@example.com', 'Calle 80 # 15-50', 'Medellín', 6.2442, -75.5812, 3),
(gen_random_uuid(), '1012345679', 'Javier', 'Restrepo', '3105550020', 'javier.restrepo@example.com', 'Carrera 45 # 50-20', 'Medellín', 6.2500, -75.5900, 4),
(gen_random_uuid(), '1012345680', 'Esperanza', 'Vargas', '3105550021', 'esperanza.vargas@example.com', 'Calle 10 # 45-60', 'Medellín', 6.2400, -75.5700, 6),
(gen_random_uuid(), '1012345681', 'Roberto', 'Ortiz', '3105550022', 'roberto.ortiz@example.com', 'Avenida La Playa # 25', 'Medellín', 6.2450, -75.5850, 3),
-- Cali (Valle del Cauca)
(gen_random_uuid(), '1023456789', 'Juan', 'Martínez', '3185550003', 'juan.martinez@example.com', 'Avenida Paseo 40', 'Cali', 3.4372, -76.5225, 5),
(gen_random_uuid(), '1023456790', 'Patricia', 'Sánchez', '3185550030', 'patricia.sanchez@example.com', 'Calle 5 # 45-80', 'Cali', 3.4400, -76.5200, 4),
(gen_random_uuid(), '1023456791', 'Fernando', 'Acosta', '3185550031', 'fernando.acosta@example.com', 'Carrera 6 # 12-50', 'Cali', 3.4350, -76.5250, 3),
(gen_random_uuid(), '1023456792', 'Catalina', 'Herrera', '3185550032', 'catalina.herrera@example.com', 'Avenida 6 # 3-45', 'Cali', 3.4380, -76.5210, 2),
-- Barranquilla (Atlántico)
(gen_random_uuid(), '1034567890', 'Rosa', 'Fernández', '3145550004', 'rosa.fernandez@example.com', 'Calle 25 # 8-45', 'Barranquilla', 10.9639, -74.7964, 2),
(gen_random_uuid(), '1034567891', 'Miguel', 'Colon', '3145550040', 'miguel.colon@example.com', 'Carrera 52 # 75-120', 'Barranquilla', 10.9700, -74.8000, 5),
(gen_random_uuid(), '1034567892', 'Margarita', 'Díaz', '3145550041', 'margarita.diaz@example.com', 'Calle 50 # 45-60', 'Barranquilla', 10.9650, -74.7950, 3),
(gen_random_uuid(), '1034567893', 'Andrés', 'Miranda', '3145550042', 'andres.miranda@example.com', 'Avenida 20 # 100-150', 'Barranquilla', 10.9680, -74.7980, 4),
-- Bucaramanga (Santander)
(gen_random_uuid(), '1045678901', 'Pedro', 'Rodríguez', '3165550005', 'pedro.rodriguez@example.com', 'Carrera 7 # 32-60', 'Bucaramanga', 7.1315, -73.1221, 6),
(gen_random_uuid(), '1045678902', 'Gloria', 'Castillo', '3165550050', 'gloria.castillo@example.com', 'Calle 35 # 25-40', 'Bucaramanga', 7.1350, -73.1250, 3),
(gen_random_uuid(), '1045678903', 'Ricardo', 'Gómez', '3165550051', 'ricardo.gomez@example.com', 'Carrera 19 # 12-50', 'Bucaramanga', 7.1300, -73.1200, 4),
-- Cartagena (Bolívar)
(gen_random_uuid(), '1056789012', 'Beatriz', 'Salazar', '3175550060', 'beatriz.salazar@example.com', 'Calle del Arsenal # 8-50', 'Cartagena', 10.3910, -75.5140, 3),
(gen_random_uuid(), '1056789013', 'Héctor', 'Morales', '3175550061', 'hector.morales@example.com', 'Avenida San Martín # 25', 'Cartagena', 10.3950, -75.5100, 5),
-- Santa Marta (Magdalena)
(gen_random_uuid(), '1067890123', 'Marcela', 'Flores', '3185550070', 'marcela.flores@example.com', 'Calle 14 # 1-25', 'Santa Marta', 11.2408, -74.2143, 2),
(gen_random_uuid(), '1067890124', 'Edgar', 'Ruiz', '3185550071', 'edgar.ruiz@example.com', 'Carrera 1 # 17-40', 'Santa Marta', 11.2450, -74.2100, 4),
-- Cúcuta (Norte de Santander)
(gen_random_uuid(), '1078901234', 'Irene', 'Torres', '3195550080', 'irene.torres@example.com', 'Avenida 0 # 8-40', 'Cúcuta', 7.8854, -72.5080, 3),
(gen_random_uuid(), '1078901235', 'Jesús', 'Villamizar', '3195550081', 'jesus.villamizar@example.com', 'Carrera 5 # 10-50', 'Cúcuta', 7.8900, -72.5050, 5),
-- Tunja (Boyacá)
(gen_random_uuid(), '1089012345', 'Dolores', 'Acuña', '3165550090', 'dolores.acuna@example.com', 'Calle 19 # 8-50', 'Tunja', 5.5277, -73.3638, 2),
(gen_random_uuid(), '1089012346', 'Gustavo', 'Ramos', '3165550091', 'gustavo.ramos@example.com', 'Carrera 9 # 12-40', 'Tunja', 5.5320, -73.3600, 4),
-- Armenia (Quindío)
(gen_random_uuid(), '1090123456', 'Yolanda', 'Caicedo', '3165550100', 'yolanda.caicedo@example.com', 'Calle 21 # 15-50', 'Armenia', 4.5339, -75.6831, 3),
(gen_random_uuid(), '1090123457', 'Wilmer', 'Peña', '3165550101', 'wilmer.pena@example.com', 'Carrera 14 # 10-30', 'Armenia', 4.5380, -75.6800, 4),
-- Manizales (Caldas)
(gen_random_uuid(), '1001234567', 'Inés', 'Guzmán', '3165550110', 'ines.guzman@example.com', 'Calle 23 # 20-40', 'Manizales', 5.0690, -75.5143, 2),
(gen_random_uuid(), '1001234568', 'Álvaro', 'Agudelo', '3165550111', 'alvaro.agudelo@example.com', 'Carrera 7 # 15-50', 'Manizales', 5.0730, -75.5100, 5);

-- Usuarios de Ejemplo - Colombia (Múltiples ciudades)
INSERT INTO usuarios (id, nombre, email, contraseña_hash, rol, telefono, municipio) VALUES
-- Administrador
(gen_random_uuid(), 'Admin Sistema', 'admin@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'administrador', '3001234567', 'Nacional'),
-- Operadores por municipio
(gen_random_uuid(), 'Operador Bogotá', 'operador.bogota@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'operador', '3015550001', 'Bogotá'),
(gen_random_uuid(), 'Operador Medellín', 'operador.medellin@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'operador', '3105550002', 'Medellín'),
(gen_random_uuid(), 'Operador Cali', 'operador.cali@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'operador', '3185550003', 'Cali'),
(gen_random_uuid(), 'Operador Barranquilla', 'operador.barranquilla@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'operador', '3145550004', 'Barranquilla'),
(gen_random_uuid(), 'Operador Bucaramanga', 'operador.bucaramanga@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'operador', '3165550005', 'Bucaramanga'),
(gen_random_uuid(), 'Operador Cartagena', 'operador.cartagena@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'operador', '3175550060', 'Cartagena'),
(gen_random_uuid(), 'Operador Santa Marta', 'operador.santa-marta@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'operador', '3185550070', 'Santa Marta'),
(gen_random_uuid(), 'Operador Cúcuta', 'operador.cucuta@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'operador', '3195550080', 'Cúcuta'),
(gen_random_uuid(), 'Operador Tunja', 'operador.tunja@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'operador', '3165550090', 'Tunja'),
(gen_random_uuid(), 'Operador Armenia', 'operador.armenia@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'operador', '3165550100', 'Armenia'),
(gen_random_uuid(), 'Operador Manizales', 'operador.manizales@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'operador', '3165550110', 'Manizales'),
-- Auditores
(gen_random_uuid(), 'Auditor Sistema', 'auditor@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'auditor', '3001234568', 'Nacional'),
(gen_random_uuid(), 'Auditor Regional Occidente', 'auditor.occidente@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'auditor', '3165550200', 'Cali'),
(gen_random_uuid(), 'Auditor Regional Caribe', 'auditor.caribe@ayudas-colombia.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'auditor', '3145550300', 'Barranquilla');

-- Inventario Inicial - Colombia (Múltiples ciudades)
INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen) 
SELECT 
  gen_random_uuid(),
  ta.id,
  150,
  25000.00,
  'Bogotá',
  'Almacén Central Bogotá - Zona Franca'
FROM tipos_ayuda ta
LIMIT 4;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  80,
  20000.00,
  'Medellín',
  'Centro de Distribución Medellín'
FROM tipos_ayuda ta
LIMIT 3;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  100,
  22500.00,
  'Cali',
  'Almacén del Valle'
FROM tipos_ayuda ta
LIMIT 2;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  120,
  23000.00,
  'Barranquilla',
  'Centro de Acopio Atlántico'
FROM tipos_ayuda ta
LIMIT 2;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  90,
  21000.00,
  'Bucaramanga',
  'Almacén Santander'
FROM tipos_ayuda ta
LIMIT 2;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  60,
  24000.00,
  'Cartagena',
  'Centro de Distribución Caribe'
FROM tipos_ayuda ta
LIMIT 2;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  75,
  23500.00,
  'Santa Marta',
  'Almacén Magdalena'
FROM tipos_ayuda ta
LIMIT 1;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  85,
  19000.00,
  'Cúcuta',
  'Centro Fronterizo Cúcuta'
FROM tipos_ayuda ta
LIMIT 2;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  70,
  22000.00,
  'Tunja',
  'Almacén Boyacá'
FROM tipos_ayuda ta
LIMIT 1;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  65,
  21500.00,
  'Armenia',
  'Centro Quindío'
FROM tipos_ayuda ta
LIMIT 1;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  80,
  22500.00,
  'Manizales',
  'Almacén Caldas'
FROM tipos_ayuda ta
LIMIT 1;
