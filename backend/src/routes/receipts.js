const express = require('express');
const { verifyToken, setCurrentUser } = require('../middleware/auth');
const { renderToBuffer, Document, Page, Text, View, Image, StyleSheet } = require('@react-pdf/renderer');
const React = require('react');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Crear referencia al logo para que require() lo cargue
let logoPath = path.join(__dirname, '../../assets/images/logo.png');
let logoDataUrl = null;

// Pre-cargar logo al iniciar el módulo
if (fs.existsSync(logoPath)) {
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    logoDataUrl = Buffer.from(logoBuffer);
    console.log('Logo pre-loaded al iniciar módulo, tamaño:', logoBuffer.length, 'bytes');
  } catch (e) {
    console.log('Error pre-cargando logo:', e.message);
  }
}

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken, setCurrentUser);

// Generar comprobante de entrega
router.post('/:deliveryId', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { signedByBeneficiary, relatedDeliveries } = req.body;
    
    console.log('\nGenerando comprobante para entrega(s)');
    console.log('  Param deliveryId:', deliveryId);
    console.log('  Body relatedDeliveries:', relatedDeliveries);
    console.log('  signedByBeneficiary:', signedByBeneficiary);
    
    // Obtener todas las entregas (la principal + las relacionadas)
    let deliveryIds = relatedDeliveries && Array.isArray(relatedDeliveries) && relatedDeliveries.length > 0 
      ? relatedDeliveries 
      : [deliveryId];
    
    console.log('  IDs finales a consultar:', deliveryIds);
    
    // Construir placeholders dinámicamente para IN clause
    const placeholders = deliveryIds.map((_, i) => `$${i + 1}`).join(', ');
    
    const deliveryQuery = `
      SELECT ea.*, c.primer_nombre, c.primer_apellido, c.cedula, c.direccion, c.municipio,
             ta.nombre as aid_type_name, ta.unidad, u.nombre as operator_name
      FROM entregas_ayuda ea
      JOIN censados c ON ea.censado_id = c.id
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
      JOIN usuarios u ON ea.operador_id = u.id
      WHERE ea.id IN (${placeholders})
      ORDER BY ea.fecha_entrega ASC
    `;
    
    console.log('  Query:', deliveryQuery);
    console.log('  Params:', deliveryIds);
    
    const deliveryResult = await global.db.query(deliveryQuery, deliveryIds);
    
    console.log('  Resultados encontrados:', deliveryResult.rows.length);
    
    if (deliveryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entrega no encontrada' });
    }
    
    const deliveries = deliveryResult.rows;
    const mainDelivery = deliveries[0];
    
    console.log('  Entregas a incluir en comprobante:', deliveries.length);
    
    // Crear comprobante en la base de datos
    const receiptId = uuidv4();
    const receiptHash = require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(deliveries) + Date.now())
      .digest('hex');
    
    // Usar el número de comprobante de la primera entrega
    const receiptNumber = mainDelivery.numero_comprobante;
    
    const receiptQuery = `
      INSERT INTO comprobantes_entrega (id, entrega_id, numero_comprobante, hash_comprobante, firmado_por, firma_beneficiario)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const receiptResult = await global.db.query(receiptQuery, [
      receiptId,
      deliveryId,
      receiptNumber,
      receiptHash,
      req.userId,
      signedByBeneficiary || false
    ]);
    
    const receipt = receiptResult.rows[0];
    
    // Generar PDF con @react-pdf/renderer
    const pdfBuffer = await generateReceiptPDF(deliveries, receipt, signedByBeneficiary || false);
    
    // Guardar PDF
    const receiptDir = path.join(__dirname, '../../receipts');
    if (!fs.existsSync(receiptDir)) {
      fs.mkdirSync(receiptDir, { recursive: true });
    }
    
    const pdfPath = path.join(receiptDir, `${receipt.numero_comprobante}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    // Actualizar ruta del PDF en la base de datos
    await global.db.query(
      'UPDATE comprobantes_entrega SET ruta_pdf = $1 WHERE id = $2',
      [pdfPath, receiptId]
    );

    console.log('  Comprobante generado y guardado correctamente');
    
    res.json({
      message: 'Comprobante generado exitosamente',
      id: receipt.id,
      receipt_number: receipt.numero_comprobante,
      hash: receipt.hash_comprobante
    });
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener comprobante
router.get('/:receiptId', async (req, res) => {
  try {
    const query = `
      SELECT cr.*, ea.numero_comprobante
      FROM comprobantes_entrega cr
      JOIN entregas_ayuda ea ON cr.entrega_id = ea.id
      WHERE cr.id = $1
    `;
    
    const result = await global.db.query(query, [req.params.receiptId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comprobante no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Descargar PDF del comprobante por receipt ID
router.get('/:receiptId/download', async (req, res) => {
  try {
    const query = 'SELECT ruta_pdf FROM comprobantes_entrega WHERE id = $1';
    const result = await global.db.query(query, [req.params.receiptId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comprobante no encontrado' });
    }

    const pdfPath = result.rows[0].ruta_pdf;
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'Archivo PDF no encontrado' });
    }

    res.download(pdfPath);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Descargar PDF del comprobante por delivery ID
// Busca el comprobante de la entrega directa O de entregas relacionadas del mismo beneficiario
router.get('/download/delivery/:deliveryId', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    // Primero intentar obtener el comprobante de la entrega directa
    let query = `
      SELECT ce.ruta_pdf 
      FROM comprobantes_entrega ce
      WHERE ce.entrega_id = $1 
      ORDER BY ce.creado_en DESC LIMIT 1
    `;
    
    let result = await global.db.query(query, [deliveryId]);
    
    // Si no encuentra comprobante directo, buscar el de entregas relacionadas
    if (result.rows.length === 0) {
      console.log('  Comprobante directo no encontrado para entrega:', deliveryId);
      console.log('  Buscando entregas relacionadas del mismo beneficiario...');
      
      // Obtener la entrega original para saber el censado_id y fecha
      const deliveryQuery = `
        SELECT censado_id, fecha_entrega, DATE(fecha_entrega) as fecha_dia
        FROM entregas_ayuda 
        WHERE id = $1
      `;
      
      const deliveryResult = await global.db.query(deliveryQuery, [deliveryId]);
      
      if (deliveryResult.rows.length === 0) {
        return res.status(404).json({ error: 'Entrega no encontrada' });
      }
      
      const { censado_id, fecha_dia } = deliveryResult.rows[0];
      
      // Buscar cualquier comprobante de entregas relacionadas del mismo beneficiario en el mismo día
      query = `
        SELECT ce.ruta_pdf 
        FROM comprobantes_entrega ce
        JOIN entregas_ayuda ea ON ce.entrega_id = ea.id
        WHERE ea.censado_id = $1 
          AND DATE(ea.fecha_entrega) = $2
        ORDER BY ce.creado_en DESC 
        LIMIT 1
      `;
      
      result = await global.db.query(query, [censado_id, fecha_dia]);
      
      if (result.rows.length === 0) {
        console.log('  Comprobante no encontrado para entregas relacionadas');
        return res.status(404).json({ error: 'Comprobante no encontrado para esta entrega o sus entregas relacionadas' });
      }
      
      console.log('  ✓ Comprobante encontrado en entregas relacionadas');
    }

    const pdfPath = result.rows[0].ruta_pdf;
    res.download(pdfPath);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Estilos para el PDF
const styles = {
  document: {
    size: 'A4',
  },
  page: {
    padding: 50,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#2c3e50',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 25,
  },
  logoContainer: {
    width: 90,
    height: 90,
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a252f',
    marginBottom: 8,
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#34495e',
    textAlign: 'left',
    fontWeight: 'normal',
    lineHeight: 1.4,
  },
  divider: {
    height: 1,
    backgroundColor: '#bdc3c7',
    marginVertical: 20,
  },
  infoSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ecf0f1',
    borderLeftWidth: 4,
    borderLeftColor: '#2c3e50',
  },
  infoLabel: {
    fontSize: 9,
    marginBottom: 4,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 10,
    marginBottom: 8,
    color: '#34495e',
  },
  beneficiarySection: {
    marginBottom: 25,
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#2c3e50',
    padding: 10,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  beneficiaryText: {
    fontSize: 10,
    marginBottom: 6,
    color: '#2c3e50',
    paddingLeft: 10,
  },
  tableSection: {
    marginBottom: 25,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#34495e',
    color: '#ffffff',
    padding: 12,
    marginBottom: 0,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    flex: 2,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    backgroundColor: '#f8f9fa',
  },
  tableCell: {
    fontSize: 9,
    flex: 2,
    color: '#34495e',
  },
  summarySection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#ecf0f1',
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  summaryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a252f',
  },
  signaturesSection: {
    marginTop: 35,
    paddingTop: 25,
    borderTopWidth: 1,
    borderTopColor: '#bdc3c7',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    flex: 1,
    marginHorizontal: 15,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2c3e50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#2c3e50',
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 9,
    color: '#34495e',
    marginTop: 4,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#bdc3c7',
  },
  footerText: {
    fontSize: 8,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  footerHash: {
    fontSize: 7,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Courier',
  },
};

// Función para generar PDF del comprobante
async function generateReceiptPDF(deliveries, receipt, signedByBeneficiary) {
  try {
    const mainDelivery = deliveries[0];
    const totalAmount = deliveries.length;

    // Intentar cargar el logo y redimensionarlo con sharp, convertir a JPG
    const logoPath = path.join(__dirname, '../../assets/images/logo.png');
    let logoDataUri = null;
    
    console.log('  Intentando cargar logo desde:', logoPath);
    console.log('  __dirname:', __dirname);
    
    if (fs.existsSync(logoPath)) {
      try {
        // Redimensionar imagen a 300x300 máximo manteniendo aspecto ratio
        // Convertir a JPG para mejor compatibilidad con @react-pdf/renderer
        const resizedLogoBuffer = await sharp(logoPath)
          .resize(300, 300, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 90 })
          .toBuffer();
        
        // Convertir a Data URI base64 (ahora como JPEG)
        logoDataUri = 'data:image/jpeg;base64,' + resizedLogoBuffer.toString('base64');
        console.log('  Logo convertido, redimensionado y cargado como Data URI, tamaño:', resizedLogoBuffer.length, 'bytes');
      } catch (e) {
        console.log('  Error al procesar logo:', e.message);
      }
    } else {
      console.log('  Logo NO encontrado en:', logoPath);
      // Intentar rutas alternativas
      const altPath1 = path.join(__dirname, '../../../assets/images/logo.png');
      const altPath2 = path.join(__dirname, '../../../../assets/images/logo.png');
      console.log('  Intentando rutas alternativas:');
      console.log('     - ', altPath1, 'existe:', fs.existsSync(altPath1));
      console.log('     - ', altPath2, 'existe:', fs.existsSync(altPath2));
    }

    // Crear documento usando componentes de @react-pdf/renderer
    const PDFDocument = (
      React.createElement(
        Document,
        { style: styles.document },
        React.createElement(
          Page,
          { style: styles.page },
          // Encabezado con logo a la izquierda y título a la derecha
          React.createElement(
            View,
            { style: styles.header },
            // Logo a la izquierda
            React.createElement(
              View,
              { style: styles.logoContainer },
              logoDataUri && React.createElement(
                Image,
                {
                  src: logoDataUri,
                  style: styles.logo
                }
              )
            ),
            // Título y subtítulo a la derecha
            React.createElement(
              View,
              { style: styles.headerText },
              React.createElement(
                Text,
                { style: styles.title },
                'COMPROBANTE DE ENTREGA'
              ),
              React.createElement(
                Text,
                { style: styles.subtitle },
                'Sistema de Control y Trazabilidad de Ayudas Humanitarias'
              )
            )
          ),
          
          // Información del comprobante
          React.createElement(
            View,
            { style: styles.infoSection },
            React.createElement(
              View,
              null,
              React.createElement(
                Text,
                { style: styles.infoLabel },
                'NÚMERO DE COMPROBANTE'
              ),
              React.createElement(
                Text,
                { style: styles.infoValue },
                receipt.numero_comprobante
              )
            ),
            React.createElement(
              View,
              null,
              React.createElement(
                Text,
                { style: styles.infoLabel },
                'FECHA DE EMISIÓN'
              ),
              React.createElement(
                Text,
                { style: styles.infoValue },
                new Date(receipt.creado_en || Date.now()).toLocaleDateString('es-ES')
              )
            ),
            React.createElement(
              View,
              null,
              React.createElement(
                Text,
                { style: styles.infoLabel },
                'CÓDIGO DE VERIFICACIÓN'
              ),
              React.createElement(
                Text,
                { style: styles.infoValue },
                receipt.hash_comprobante.substring(0, 16)
              )
            )
          ),
          
          // Datos del beneficiario
          React.createElement(
            View,
            { style: styles.beneficiarySection },
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              'INFORMACIÓN DEL BENEFICIARIO'
            ),
            React.createElement(
              Text,
              { style: styles.beneficiaryText },
              `Nombre: ${mainDelivery.primer_nombre} ${mainDelivery.primer_apellido}`
            ),
            React.createElement(
              Text,
              { style: styles.beneficiaryText },
              `Identificación: ${mainDelivery.cedula}`
            ),
            React.createElement(
              Text,
              { style: styles.beneficiaryText },
              `Dirección: ${mainDelivery.direccion || 'No especificada'}`
            ),
            React.createElement(
              Text,
              { style: styles.beneficiaryText },
              `Municipio: ${mainDelivery.municipio}`
            )
          ),
          
          // Tabla de entregas
          React.createElement(
            View,
            { style: styles.tableSection },
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              'DESCRIPCIÓN DE LAS AYUDAS'
            ),
            
            // Encabezados de tabla
            React.createElement(
              View,
              { style: styles.tableHeader },
              React.createElement(
                Text,
                { style: styles.tableHeaderCell },
                'Tipo de Ayuda'
              ),
              React.createElement(
                Text,
                { style: { ...styles.tableHeaderCell, flex: 1 } },
                'Cantidad'
              ),
              React.createElement(
                Text,
                { style: { ...styles.tableHeaderCell, flex: 1 } },
                'Fecha'
              )
            ),
            
            // Filas de la tabla
            deliveries.map((delivery, index) =>
              React.createElement(
                View,
                { style: index % 2 === 0 ? styles.tableRow : styles.tableRowAlt, key: index },
                React.createElement(
                  Text,
                  { style: styles.tableCell },
                  delivery.aid_type_name.substring(0, 25)
                ),
                React.createElement(
                  Text,
                  { style: { ...styles.tableCell, flex: 1 } },
                  `${delivery.cantidad} ${delivery.unidad}`
                ),
                React.createElement(
                  Text,
                  { style: { ...styles.tableCell, flex: 1 } },
                  new Date(delivery.fecha_entrega).toLocaleDateString('es-ES')
                )
              )
            )
          ),
          
          // Resumen
          React.createElement(
            View,
            { style: styles.summarySection },
            React.createElement(
              Text,
              { style: styles.summaryText },
              `Total de ítems entregados: ${totalAmount}`
            )
          ),
          
          // Sección de firmas
          React.createElement(
            View,
            { style: styles.signaturesSection },
            React.createElement(
              View,
              { style: styles.signatureBox },
              React.createElement(
                Text,
                { style: styles.signatureLabel },
                'Firma del Operador'
              ),
              React.createElement(
                View,
                { style: { height: 40 } }
              ),
              React.createElement(
                View,
                { style: styles.signatureLine }
              ),
              React.createElement(
                Text,
                { style: styles.signatureName },
                mainDelivery.operator_name
              )
            ),
            
            signedByBeneficiary && React.createElement(
              View,
              { style: styles.signatureBox },
              React.createElement(
                Text,
                { style: styles.signatureLabel },
                'Firma del Beneficiario'
              ),
              React.createElement(
                View,
                { style: { height: 40 } }
              ),
              React.createElement(
                View,
                { style: styles.signatureLine }
              ),
              React.createElement(
                Text,
                { style: styles.signatureName },
                `${mainDelivery.primer_nombre} ${mainDelivery.primer_apellido}`
              )
            )
          ),
          
          // Pie de página
          React.createElement(
            View,
            { style: styles.footer },
            React.createElement(
              Text,
              { style: styles.footerText },
              'Este documento es válido como comprobante de entrega de ayudas humanitarias.'
            ),
            React.createElement(
              Text,
              { style: styles.footerText },
              'Sistema de Control y Trazabilidad de Ayudas Humanitarias'
            ),
            React.createElement(
              Text,
              { style: styles.footerHash },
              `Código de Verificación: ${receipt.hash_comprobante}`
            )
          )
        )
      )
    );

    const pdfBuffer = await renderToBuffer(PDFDocument);
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

module.exports = router;
