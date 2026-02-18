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
    const { signedByBeneficiary } = req.body;
    
    console.log('\n📄 Generando comprobante para entrega:', deliveryId);
    const deliveryQuery = `
      SELECT ea.*, c.primer_nombre, c.primer_apellido, c.cedula, c.direccion, c.municipio,
             ta.nombre as aid_type_name, ta.unidad, u.nombre as operator_name
      FROM entregas_ayuda ea
      JOIN censados c ON ea.censado_id = c.id
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
      JOIN usuarios u ON ea.operador_id = u.id
      WHERE ea.id = $1
    `;
    
    const deliveryResult = await global.db.query(deliveryQuery, [deliveryId]);
    if (deliveryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entrega no encontrada' });
    }
    
    const delivery = deliveryResult.rows[0];
    
    // Crear comprobante en la base de datos
    const receiptId = uuidv4();
    const receiptHash = require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(delivery) + Date.now())
      .digest('hex');
    
    // Usar el campo numero_comprobante que ya existe en entregas_ayuda
    const receiptNumber = delivery.numero_comprobante;
    
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
    
    // Generar PDF
    const pdfBuffer = await generateReceiptPDF(delivery, receipt);
    
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
function generateReceiptPDF(delivery, receipt) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('error', reject);
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      
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
      doc.fontSize(11).font('Helvetica').text(`Nombre: ${delivery.primer_nombre} ${delivery.primer_apellido}`, 70, 250);
      doc.text(`Cédula: ${delivery.cedula}`, 70, 270);
      doc.text(`Dirección: ${delivery.direccion || 'N/A'}`, 70, 290);
      doc.text(`Municipio: ${delivery.municipio}`, 70, 310);
      
      doc.moveTo(50, 330).lineTo(550, 330).stroke();
      
      // Datos de la entrega
      doc.fontSize(12).font('Helvetica-Bold').text('DESCRIPCIÓN DE LA AYUDA', 70, 350);
      doc.fontSize(11).font('Helvetica')
        .text(`Tipo de Ayuda: ${delivery.aid_type_name}`, 70, 370)
        .text(`Cantidad: ${delivery.cantidad} ${delivery.unidad}`, 70, 390)
        .text(`Fecha de Entrega: ${new Date(delivery.fecha_entrega).toLocaleDateString('es-ES')}`, 70, 410)
        .text(`Operador: ${delivery.operator_name}`, 70, 430);
      
      if (delivery.notas) {
        doc.text(`Observaciones: ${delivery.notas}`, 70, 450);
      }
      
      doc.moveTo(50, 480).lineTo(550, 480).stroke();
      
      // Firmas
      doc.fontSize(11)
        .text('Firma del Operador', 100, 520)
        .text('_________________________', 100, 540)
        .text(`${delivery.operator_name}`, 100, 555);
      
      if (receipt.firma_beneficiario) {
        doc.text('Firma del Beneficiario', 350, 520)
          .text('_________________________', 350, 540)
          .text(`${delivery.primer_nombre} ${delivery.primer_apellido}`, 350, 555);
      }
      
      doc.moveTo(50, 600).lineTo(550, 600).stroke();
      doc.fontSize(10).text(
        'Este documento es válido como comprobante de entrega. Hash para verificación: ' + receipt.hash_comprobante,
        70, 620, { width: 450 }
      );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = router;
