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

-- Beneficiarios de Ejemplo
INSERT INTO censados (id, cedula, primer_nombre, primer_apellido, telefono, email, direccion, municipio, latitud, longitud, miembros_familia) VALUES
(gen_random_uuid(), '12345678', 'Maria', 'González', '555-0001', 'maria@example.com', 'Calle 1, Casa 10', 'La Paz', -16.5000, -68.1500, 4),
(gen_random_uuid(), '12345679', 'Carlos', 'López', '555-0002', 'carlos@example.com', 'Calle 2, Casa 20', 'La Paz', -16.5001, -68.1501, 3),
(gen_random_uuid(), '12345680', 'Juan', 'Martinez', '555-0003', 'juan@example.com', 'Calle 3, Casa 30', 'El Alto', -16.5050, -68.2000, 5),
(gen_random_uuid(), '12345681', 'Rosa', 'Fernandez', '555-0004', 'rosa@example.com', 'Calle 4, Casa 40', 'Oruro', -17.9730, -67.1330, 2),
(gen_random_uuid(), '12345682', 'Pedro', 'Rodriguez', '555-0005', 'pedro@example.com', 'Calle 5, Casa 50', 'Cochabamba', -17.3895, -66.1568, 6);

-- Usuarios de Ejemplo
INSERT INTO usuarios (id, nombre, email, contraseña_hash, rol, telefono, municipio) VALUES
(gen_random_uuid(), 'Admin Sistema', 'admin@ayudas.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'administrador', '555-9999', 'Nacional'),
(gen_random_uuid(), 'Operador La Paz', 'operador.lapaz@ayudas.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'operador', '555-8888', 'La Paz'),
(gen_random_uuid(), 'Auditor Sistema', 'auditor@ayudas.com', '$2b$10$YIvxPxVf6LLqSw6Qr4n4POTxAE8kR4Q6O8Q4Q8Q4Q8Q4Q8Q4Q8', 'auditor', '555-7777', 'Nacional');

-- Inventario Inicial
INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen) 
SELECT 
  gen_random_uuid(),
  ta.id,
  100,
  10.50,
  'La Paz',
  'Almacén Central - Estante A1'
FROM tipos_ayuda ta
LIMIT 4;

INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
SELECT
  gen_random_uuid(),
  ta.id,
  50,
  8.00,
  'El Alto',
  'Almacén El Alto - Estante B2'
FROM tipos_ayuda ta
LIMIT 3;
