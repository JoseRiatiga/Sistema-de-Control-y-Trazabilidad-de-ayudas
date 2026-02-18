const express = require('express');
const { verifyToken, setCurrentUser } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken, setCurrentUser);

// Generar comprobante de entrega
router.post('/:deliveryId', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { signedByBeneficiary, relatedDeliveries } = req.body;
    
    console.log('\n📄 Generando comprobante para entrega(s)');
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
    
    // Generar PDF con TODAS las entregas
    const pdfBuffer = await generateReceiptPDF(deliveries, receipt);
    
    // Guardar PDF
    const receiptDir = require('path').join(__dirname, '../../receipts');
    if (!require('fs').existsSync(receiptDir)) {
      require('fs').mkdirSync(receiptDir, { recursive: true });
    }
    
    const pdfPath = require('path').join(receiptDir, `${receipt.numero_comprobante}.pdf`);
    require('fs').writeFileSync(pdfPath, pdfBuffer);
    
    // Actualizar ruta del PDF en la base de datos
    await global.db.query(
      'UPDATE comprobantes_entrega SET ruta_pdf = $1 WHERE id = $2',
      [pdfPath, receiptId]
    );
    
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
router.get('/download/delivery/:deliveryId', async (req, res) => {
  try {
    const query = 'SELECT ruta_pdf FROM comprobantes_entrega WHERE entrega_id = $1 ORDER BY creado_en DESC LIMIT 1';
    const result = await global.db.query(query, [req.params.deliveryId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comprobante no encontrado para esta entrega' });
    }

    const pdfPath = result.rows[0].ruta_pdf;
    res.download(pdfPath);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Función para generar PDF del comprobante
function generateReceiptPDF(deliveries, receipt) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('error', reject);
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      
      const mainDelivery = deliveries[0];
      
      // Encabezado
      doc.fontSize(20).text('COMPROBANTE DE ENTREGA', 100, 50);
      doc.fontSize(12).text(`Sistema de Control y Trazabilidad de Ayudas Humanitarias`, 100, 80);
      
      doc.moveTo(50, 120).lineTo(550, 120).stroke();
      
      // Información del comprobante
      doc.fontSize(11).text(`Número de Comprobante: ${receipt.numero_comprobante}`, 70, 140);
      doc.text(`Fecha de Emisión: ${new Date(receipt.creado_en || Date.now()).toLocaleDateString()}`, 70, 160);
      doc.text(`Hash de Verificación: ${receipt.hash_comprobante.substring(0, 16)}...`, 70, 180);
      
      doc.moveTo(50, 210).lineTo(550, 210).stroke();
      
      // Datos del beneficiario
      doc.fontSize(12).font('Helvetica-Bold').text('BENEFICIARIO', 70, 230);
      doc.fontSize(11).font('Helvetica').text(`Nombre: ${mainDelivery.primer_nombre} ${mainDelivery.primer_apellido}`, 70, 250);
      doc.text(`Cédula: ${mainDelivery.cedula}`, 70, 270);
      doc.text(`Dirección: ${mainDelivery.direccion || 'N/A'}`, 70, 290);
      doc.text(`Municipio: ${mainDelivery.municipio}`, 70, 310);
      
      doc.moveTo(50, 330).lineTo(550, 330).stroke();
      
      // Tabla de entregas
      doc.fontSize(12).font('Helvetica-Bold').text('DESCRIPCIÓN DE LAS AYUDAS', 70, 350);
      
      let yPosition = 380;
      
      // Encabezados de tabla
      doc.fontSize(9).font('Helvetica-Bold')
        .text('Tipo de Ayuda', 70, yPosition)
        .text('Cantidad', 250, yPosition)
        .text('Fecha', 350, yPosition)
        .text('Obs.', 450, yPosition);
      
      doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();
      
      yPosition += 25;
      
      // Filas de la tabla
      doc.fontSize(9).font('Helvetica');
      
      deliveries.forEach((delivery, index) => {
        const truncatedNotes = delivery.notas ? delivery.notas.substring(0, 20) : '-';
        
        doc.text(delivery.aid_type_name.substring(0, 20), 70, yPosition)
          .text(`${delivery.cantidad} ${delivery.unidad}`, 250, yPosition)
          .text(new Date(delivery.fecha_entrega).toLocaleDateString('es-ES'), 350, yPosition)
          .text(truncatedNotes, 450, yPosition);
        
        yPosition += 20;
        
        // Separador cada 5 filas
        if ((index + 1) % 5 === 0 && index < deliveries.length - 1) {
          doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
          yPosition += 10;
        }
      });
      
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      
      yPosition += 20;
      
      // Resumen
      const totalAmount = deliveries.length;
      doc.fontSize(11).font('Helvetica-Bold')
        .text(`Total de ítems entregados: ${totalAmount}`, 70, yPosition);
      
      yPosition = Math.min(yPosition + 40, 520);
      
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      
      // Firmas
      doc.fontSize(11).font('Helvetica-Bold')
        .text('Firma del Operador', 100, yPosition + 20)
        .text('_________________________', 100, yPosition + 40)
        .font('Helvetica')
        .text(`${mainDelivery.operator_name}`, 100, yPosition + 55);
      
      if (receipt.firma_beneficiario) {
        doc.font('Helvetica-Bold')
          .text('Firma del Beneficiario', 350, yPosition + 20)
          .text('_________________________', 350, yPosition + 40)
          .font('Helvetica')
          .text(`${mainDelivery.primer_nombre} ${mainDelivery.primer_apellido}`, 350, yPosition + 55);
      }
      
      doc.moveTo(50, yPosition + 85).lineTo(550, yPosition + 85).stroke();
      doc.fontSize(8).text(
        'Este documento es válido como comprobante de entrega. Hash para verificación: ' + receipt.hash_comprobante,
        70, yPosition + 100, { width: 450 }
      );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = router;
