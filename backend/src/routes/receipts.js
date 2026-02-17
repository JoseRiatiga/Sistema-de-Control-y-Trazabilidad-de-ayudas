const express = require('express');
const { verifyToken, setCurrentUser } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken, setCurrentUser);

// Generar comprobante de entrega
router.post('/:deliveryId', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { signedByBeneficiary } = req.body;
    
    // Obtener datos de la entrega
    const deliveryQuery = `
      SELECT ad.*, c.first_name, c.last_name, c.identification, c.address, c.municipality,
             at.name as aid_type_name, at.unit, u.name as operator_name
      FROM aid_deliveries ad
      JOIN censados c ON ad.censado_id = c.id
      JOIN aid_types at ON ad.aid_type_id = at.id
      JOIN users u ON ad.operator_id = u.id
      WHERE ad.id = $1
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
    
    const receiptQuery = `
      INSERT INTO delivery_receipt (id, delivery_id, receipt_number, receipt_hash, signed_by, beneficiary_signature)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const receiptResult = await global.db.query(receiptQuery, [
      receiptId,
      deliveryId,
      delivery.receipt_number,
      receiptHash,
      req.userId,
      signedByBeneficiary || false
    ]);
    
    const receipt = receiptResult.rows[0];
    
    // Generar PDF
    const pdfBuffer = generateReceiptPDF(delivery, receipt);
    
    // Guardar PDF
    const receiptDir = path.join(__dirname, '../../receipts');
    if (!fs.existsSync(receiptDir)) {
      fs.mkdirSync(receiptDir, { recursive: true });
    }
    
    const pdfPath = path.join(receiptDir, `${receipt.receipt_number}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    // Actualizar ruta del PDF en la base de datos
    await global.db.query(
      'UPDATE delivery_receipt SET pdf_path = $1 WHERE id = $2',
      [pdfPath, receiptId]
    );
    
    res.json({
      message: 'Comprobante generado exitosamente',
      receipt: {
        id: receipt.id,
        receipt_number: receipt.receipt_number,
        receipt_hash: receipt.receipt_hash,
        generated_at: receipt.generated_at,
        pdf_path: pdfPath
      }
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
      SELECT dr.*, ad.receipt_number
      FROM delivery_receipt dr
      JOIN aid_deliveries ad ON dr.delivery_id = ad.id
      WHERE dr.id = $1
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

// Descargar PDF del comprobante
router.get('/:receiptId/download', async (req, res) => {
  try {
    const query = 'SELECT pdf_path FROM delivery_receipt WHERE id = $1';
    const result = await global.db.query(query, [req.params.receiptId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comprobante no encontrado' });
    }
    
    const pdfPath = result.rows[0].pdf_path;
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'Archivo PDF no encontrado' });
    }
    
    res.download(pdfPath);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Función para generar PDF del comprobante
function generateReceiptPDF(delivery, receipt) {
  const doc = new PDFDocument();
  const buffers = [];
  
  doc.on('data', buffers.push.bind(buffers));
  
  // Encabezado
  doc.fontSize(20).text('COMPROBANTE DE ENTREGA', 100, 50);
  doc.fontSize(12).text(`Sistema de Control y Trazabilidad de Ayudas Humanitarias`, 100, 80);
  
  doc.moveTo(50, 120).lineTo(550, 120).stroke();
  
  // Información del comprobante
  doc.fontSize(11).text(`Número de Comprobante: ${receipt.receipt_number}`, 70, 140);
  doc.text(`Fecha de Emisión: ${new Date(receipt.generated_at).toLocaleDateString()}`, 70, 160);
  doc.text(`Hash de Verificación: ${receipt.receipt_hash.substring(0, 16)}...`, 70, 180);
  
  doc.moveTo(50, 210).lineTo(550, 210).stroke();
  
  // Datos del beneficiario
  doc.fontSize(12).font('Helvetica-Bold').text('BENEFICIARIO', 70, 230);
  doc.fontSize(11).font('Helvetica').text(`Nombre: ${delivery.first_name} ${delivery.last_name}`, 70, 250);
  doc.text(`Cédula: ${delivery.identification}`, 70, 270);
  doc.text(`Dirección: ${delivery.address}`, 70, 290);
  doc.text(`Municipio: ${delivery.municipality}`, 70, 310);
  
  doc.moveTo(50, 330).lineTo(550, 330).stroke();
  
  // Datos de la entrega
  doc.fontSize(12).font('Helvetica-Bold').text('DESCRIPCIÓN DE LA AYUDA', 70, 350);
  doc.fontSize(11).font('Helvetica')
    .text(`Tipo de Ayuda: ${delivery.aid_type_name}`, 70, 370)
    .text(`Cantidad: ${delivery.quantity} ${delivery.unit}`, 70, 390)
    .text(`Fecha de Entrega: ${new Date(delivery.delivery_date).toLocaleDateString()}`, 70, 410)
    .text(`Operador: ${delivery.operator_name}`, 70, 430);
  
  if (delivery.notes) {
    doc.text(`Observaciones: ${delivery.notes}`, 70, 450);
  }
  
  doc.moveTo(50, 480).lineTo(550, 480).stroke();
  
  // Firmas
  doc.fontSize(11)
    .text('Firma del Operador', 100, 520)
    .text('_________________________', 100, 540)
    .text(`${delivery.operator_name}`, 100, 555);
  
  if (receipt.beneficiary_signature) {
    doc.text('Firma del Beneficiario', 350, 520)
      .text('_________________________', 350, 540)
      .text(`${delivery.first_name} ${delivery.last_name}`, 350, 555);
  }
  
  doc.moveTo(50, 600).lineTo(550, 600).stroke();
  doc.fontSize(10).text(
    'Este documento es válido como comprobante de entrega. Hash para verificación: ' + receipt.receipt_hash,
    70, 620, { width: 450 }
  );
  
  doc.end();
  
  return Buffer.concat(buffers);
}

module.exports = router;
