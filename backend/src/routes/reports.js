const express = require('express');
const { verifyToken, verifyRole, setCurrentUser } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const { getTemplate, getAvailableTemplates } = require('../utils/reportTemplates');

const router = express.Router();

// Todas las rutas de reportes requieren autenticación
router.use(verifyToken, setCurrentUser);

// Solo admins y auditores pueden generar reportes
router.use(verifyRole(['administrador', 'auditor']));

// Reporte de entregas por municipio
router.get('/deliveries', async (req, res) => {
  try {
    const { municipality, dateFrom, dateTo } = req.query;
    
    let query = `
      SELECT
        ea.municipio,
        ta.nombre as aid_type,
        COUNT(*) as total_deliveries,
        SUM(ea.cantidad) as total_quantity,
        COUNT(DISTINCT ea.censado_id) as beneficiaries
      FROM entregas_ayuda ea
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND ea.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    if (dateFrom) {
      query += ` AND ea.fecha_entrega >= $${values.length + 1}`;
      values.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND ea.fecha_entrega <= $${values.length + 1}`;
      values.push(dateTo);
    }
    
    query += ' GROUP BY ea.municipio, ta.nombre ORDER BY ea.municipio, ta.nombre';
    
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Deliveries report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reporte de inventario
router.get('/inventory', async (req, res) => {
  try {
    const { municipality } = req.query;
    
    let query = `
      SELECT
        i.municipio,
        ta.nombre as aid_type,
        i.cantidad,
        i.costo_unitario,
        (i.cantidad * i.costo_unitario) as total_value
      FROM inventario i
      JOIN tipos_ayuda ta ON i.tipo_ayuda_id = ta.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND i.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    query += ' ORDER BY i.municipio, ta.nombre';
    
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reporte de beneficiarios por municipio
router.get('/beneficiaries', async (req, res) => {
  try {
    const { municipality } = req.query;
    
    let query = `
      SELECT
        c.municipio,
        COUNT(*) as total_beneficiaries,
        SUM(c.miembros_familia) as total_family_members,
        COUNT(DISTINCT d.censado_id) as assisted_beneficiaries
      FROM censados c
      LEFT JOIN entregas_ayuda d ON c.id = d.censado_id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND c.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    query += ' GROUP BY c.municipio';
    
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Beneficiaries report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reporte de entregas por municipio
router.get('/deliveries_by_municipality', async (req, res) => {
  try {
    const { municipality, dateFrom, dateTo } = req.query;
    
    let query = `
      SELECT
        ea.municipio,
        ta.nombre as aid_type,
        COUNT(*) as total_deliveries,
        SUM(ea.cantidad) as total_quantity,
        COUNT(DISTINCT ea.censado_id) as beneficiaries
      FROM entregas_ayuda ea
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND ea.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    if (dateFrom) {
      query += ` AND ea.fecha_entrega >= $${values.length + 1}`;
      values.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND ea.fecha_entrega <= $${values.length + 1}`;
      values.push(dateTo);
    }
    
    query += ' GROUP BY ea.municipio, ta.nombre ORDER BY ea.municipio, ta.nombre';
    
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Deliveries by municipality report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reporte de alertas de duplicidad
router.get('/duplicate_alerts', async (req, res) => {
  try {
    const { municipality } = req.query;
    
    let query = `
      SELECT
        c.municipio,
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN da.estado_alerta = 'pendiente' THEN 1 END) as pending,
        COUNT(CASE WHEN da.estado_alerta = 'revisada' THEN 1 END) as reviewed,
        COUNT(CASE WHEN da.estado_alerta = 'resuelta' THEN 1 END) as resolved
      FROM alertas_duplicidad da
      JOIN censados c ON da.censado_id = c.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND c.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    query += ' GROUP BY c.municipio';
    
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Duplicate alerts report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reporte de bitácora de auditoría
router.get('/audit_log', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let query = `
      SELECT
        ba.id,
        ba.usuario_id,
        u.nombre as user_name,
        ba.accion,
        ba.nombre_tabla,
        ba.id_registro,
        ba.fecha,
        ba.direccion_ip
      FROM bitacora_auditoria ba
      LEFT JOIN usuarios u ON ba.usuario_id = u.id
      WHERE 1=1
    `;
    const values = [];
    
    if (dateFrom) {
      query += ` AND ba.fecha >= $${values.length + 1}`;
      values.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND ba.fecha <= $${values.length + 1}`;
      values.push(dateTo);
    }
    
    query += ' ORDER BY ba.fecha DESC';
    
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Audit log report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias para mantener retrocompatibilidad
router.get('/duplicate-alerts', async (req, res) => {
  try {
    const { municipality } = req.query;
    
    let query = `
      SELECT
        c.municipio,
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN da.estado_alerta = 'pendiente' THEN 1 END) as pending,
        COUNT(CASE WHEN da.estado_alerta = 'revisada' THEN 1 END) as reviewed,
        COUNT(CASE WHEN da.estado_alerta = 'resuelta' THEN 1 END) as resolved
      FROM alertas_duplicidad da
      JOIN censados c ON da.censado_id = c.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND c.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    query += ' GROUP BY c.municipio';
    
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Duplicate alerts report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reporte para entes de control
router.get('/control-entities', async (req, res) => {
  try {
    const { municipality, dateFrom, dateTo } = req.query;
    
    let query = `
      SELECT
        ea.municipio,
        ta.nombre as aid_type,
        COUNT(*) as total_deliveries,
        SUM(ea.cantidad) as total_items,
        COUNT(DISTINCT ea.censado_id) as total_beneficiaries,
        u.nombre as operator_name,
        ea.fecha_entrega::DATE as delivery_date
      FROM entregas_ayuda ea
      JOIN usuarios u ON ea.operador_id = u.id
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND ea.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    if (dateFrom) {
      query += ` AND ea.fecha_entrega >= $${values.length + 1}`;
      values.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND ea.fecha_entrega <= $${values.length + 1}`;
      values.push(dateTo);
    }
    
    query += ' GROUP BY ea.municipio, ta.nombre, u.nombre, ea.fecha_entrega::DATE ORDER BY ea.fecha_entrega::DATE DESC';
    
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Control entities report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// NUEVAS RUTAS PARA DESCARGAR CSV CUSTOMIZABLES
// ==================================================

// Obtener plantillas disponibles
router.get('/templates/list', async (req, res) => {
  try {
    const templates = getAvailableTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Descargar reporte en Excel profesional
router.get('/excel/download/:reportType', async (req, res) => {
  try {
    const { reportType } = req.params;
    const { municipality, dateFrom, dateTo } = req.query;

    // Obtener la plantilla
    const template = getTemplate(reportType);
    if (!template) {
      return res.status(404).json({ error: 'Plantilla de reporte no encontrada' });
    }

    console.log(`\n📊 Generando Excel: ${template.name}`);

    let data = [];
    let query = '';
    let values = [];

    // Construir query específica según el tipo de reporte
    switch (reportType) {
      case 'deliveries':
        query = `
          SELECT ea.*, c.primer_nombre, c.primer_apellido, c.cedula, 
                 ta.nombre as aid_type_name, ta.unidad, u.nombre as operator_name
          FROM entregas_ayuda ea
          JOIN censados c ON ea.censado_id = c.id
          JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
          JOIN usuarios u ON ea.operador_id = u.id
          WHERE 1=1
        `;
        if (municipality) {
          query += ` AND ea.municipio = $${values.length + 1}`;
          values.push(municipality);
        }
        if (dateFrom) {
          query += ` AND ea.fecha_entrega >= $${values.length + 1}`;
          values.push(dateFrom);
        }
        if (dateTo) {
          query += ` AND ea.fecha_entrega <= $${values.length + 1}`;
          values.push(dateTo);
        }
        query += ' ORDER BY ea.fecha_entrega DESC';
        break;

      case 'deliveries_by_municipality':
        query = `
          SELECT ea.municipio, ta.nombre as aid_type, COUNT(*) as total_deliveries,
                 SUM(ea.cantidad) as total_quantity, COUNT(DISTINCT ea.censado_id) as beneficiaries
          FROM entregas_ayuda ea
          JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
          WHERE 1=1
        `;
        if (municipality) {
          query += ` AND ea.municipio = $${values.length + 1}`;
          values.push(municipality);
        }
        if (dateFrom) {
          query += ` AND ea.fecha_entrega >= $${values.length + 1}`;
          values.push(dateFrom);
        }
        if (dateTo) {
          query += ` AND ea.fecha_entrega <= $${values.length + 1}`;
          values.push(dateTo);
        }
        query += ' GROUP BY ea.municipio, ta.nombre ORDER BY ea.municipio, ta.nombre';
        break;

      case 'inventory':
        query = `
          SELECT i.*, ta.nombre as aid_type_name
          FROM inventario i
          JOIN tipos_ayuda ta ON i.tipo_ayuda_id = ta.id
          WHERE 1=1
        `;
        if (municipality) {
          query += ` AND i.municipio = $${values.length + 1}`;
          values.push(municipality);
        }
        query += ' ORDER BY i.municipio, ta.nombre';
        break;

      case 'beneficiaries':
        query = `
          SELECT * FROM censados WHERE 1=1
        `;
        if (municipality) {
          query += ` AND municipio = $${values.length + 1}`;
          values.push(municipality);
        }
        query += ' ORDER BY primer_nombre, primer_apellido';
        break;

      case 'duplicate_alerts':
        query = `
          SELECT ad.*, c.cedula, c.primer_nombre, c.primer_apellido,
                 ta.nombre as aid_type_name, c.municipio
          FROM alertas_duplicidad ad
          JOIN censados c ON ad.censado_id = c.id
          JOIN tipos_ayuda ta ON ad.tipo_ayuda_id = ta.id
          WHERE 1=1
        `;
        if (municipality) {
          query += ` AND c.municipio = $${values.length + 1}`;
          values.push(municipality);
        }
        query += ' ORDER BY ad.fecha_alerta DESC';
        break;

      case 'audit_log':
        query = `
          SELECT ba.*, u.nombre as user_name
          FROM bitacora_auditoria ba
          LEFT JOIN usuarios u ON ba.usuario_id = u.id
          WHERE 1=1
        `;
        if (dateFrom) {
          query += ` AND ba.fecha >= $${values.length + 1}`;
          values.push(dateFrom);
        }
        if (dateTo) {
          query += ` AND ba.fecha <= $${values.length + 1}`;
          values.push(dateTo);
        }
        query += ' ORDER BY ba.fecha DESC';
        break;

      case 'control-entities':
        query = `
          SELECT ea.*, c.cedula, c.primer_nombre, c.primer_apellido, c.telefono, c.email,
                 ta.nombre as aid_type_name, u.nombre as operator_name
          FROM entregas_ayuda ea
          JOIN censados c ON ea.censado_id = c.id
          JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
          JOIN usuarios u ON ea.operador_id = u.id
          WHERE 1=1
        `;
        if (municipality) {
          query += ` AND ea.municipio = $${values.length + 1}`;
          values.push(municipality);
        }
        if (dateFrom) {
          query += ` AND ea.fecha_entrega >= $${values.length + 1}`;
          values.push(dateFrom);
        }
        if (dateTo) {
          query += ` AND ea.fecha_entrega <= $${values.length + 1}`;
          values.push(dateTo);
        }
        query += ' ORDER BY ea.fecha_entrega DESC';
        break;

      default:
        return res.status(400).json({ error: 'Tipo de reporte no soportado' });
    }

    // Ejecutar query
    const result = await global.db.query(query, values);
    data = result.rows;

    console.log(`  Registros encontrados: ${data.length}`);

    if (data.length === 0) {
      return res.status(404).json({ error: 'No hay datos para este reporte' });
    }

    // Aplicar transformaciones de la plantilla
    const transformedData = template.transforms ? template.transforms(data) : data;

    // Crear workbook de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // Información del reporte
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES');
    const timeStr = now.toLocaleTimeString('es-ES');

    // Estilos
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
    const headerFont = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    const titleFont = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1F4E78' } };
    const infoFont = { name: 'Arial', size: 9 };
    const border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    // Fila 1: Título del sistema (centrado)
    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'SISTEMA DE CONTROL Y TRAZABILIDAD DE AYUDAS HUMANITARIAS';
    titleCell.font = titleFont;
    titleCell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E8F5' } };
    worksheet.getRow(1).height = 18;

    // Obtener información del usuario
    let userName = req.user.email;
    try {
      const userResult = await global.db.query('SELECT nombre FROM usuarios WHERE id = $1', [req.user.id]);
      if (userResult.rows.length > 0) {
        userName = userResult.rows[0].nombre;
      }
    } catch (err) {
      console.warn('Error obteniendo nombre del usuario:', err);
    }

    // Información del encabezado - cada elemento en su propia fila (vertical)
    let row = 2;
    
    // Fila 2: Reporte
    worksheet.mergeCells(`A${row}:L${row}`);
    worksheet.getCell(`A${row}`).value = `Reporte: ${template.name}`;
    worksheet.getCell(`A${row}`).font = { name: 'Arial', size: 10, bold: true };
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'center' };
    worksheet.getRow(row).height = 14;
    row++;
    
    // Fila 3: Generado por
    worksheet.mergeCells(`A${row}:L${row}`);
    worksheet.getCell(`A${row}`).value = `Generado por: ${userName}`;
    worksheet.getCell(`A${row}`).font = infoFont;
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'center' };
    worksheet.getRow(row).height = 14;
    row++;
    
    // Fila 4: Generado (fecha y hora)
    worksheet.mergeCells(`A${row}:L${row}`);
    worksheet.getCell(`A${row}`).value = `Generado el: ${dateStr} ${timeStr}`;
    worksheet.getCell(`A${row}`).font = infoFont;
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'center' };
    worksheet.getRow(row).height = 14;
    row++;
    
    // Fila 5: Municipio (si aplica)
    if (municipality) {
      worksheet.mergeCells(`A${row}:L${row}`);
      worksheet.getCell(`A${row}`).value = `Municipio: ${municipality}`;
      worksheet.getCell(`A${row}`).font = infoFont;
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'center' };
      worksheet.getRow(row).height = 14;
      row++;
    }
    
    // Fila 6: Período (si aplica)
    if (dateFrom || dateTo) {
      const inicio = dateFrom ? new Date(dateFrom).toLocaleDateString('es-ES') : 'Inicio';
      const fin = dateTo ? new Date(dateTo).toLocaleDateString('es-ES') : 'Hoy';
      worksheet.mergeCells(`A${row}:L${row}`);
      worksheet.getCell(`A${row}`).value = `Período: ${inicio} - ${fin}`;
      worksheet.getCell(`A${row}`).font = infoFont;
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'center' };
      worksheet.getRow(row).height = 14;
      row++;
    }
    
    // Fila 7: Total Registros
    worksheet.mergeCells(`A${row}:L${row}`);
    worksheet.getCell(`A${row}`).value = `Total Registros: ${data.length}`;
    worksheet.getCell(`A${row}`).font = infoFont;
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'center' };
    worksheet.getRow(row).height = 14;
    row++;
    
    // Espacio en blanco
    row += 1;

    // Encabezados de las columnas
    const headerRow = worksheet.getRow(row);
    template.fields.forEach((field, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = field.label;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
      cell.border = border;
    });
    headerRow.height = 25;
    row++;

    // Datos
    transformedData.forEach((item) => {
      const dataRow = worksheet.getRow(row);
      template.fields.forEach((field, index) => {
        const cell = dataRow.getCell(index + 1);
        cell.value = item[field.value] || '';
        cell.border = border;
        cell.alignment = { horizontal: 'left', vertical: 'center', wrapText: true };
      });
      dataRow.height = 18;
      row++;
    });

    // Ajustar ancho de columnas automáticamente según contenido
    template.fields.forEach((field, index) => {
      const columnIndex = index + 1;
      const column = worksheet.getColumn(columnIndex);
      
      let maxLength = field.label.length + 2; // Comenzar con el label
      
      // Revisar el contenido de cada celda para encontrar la más larga
      transformedData.forEach((item) => {
        const cellValue = item[field.value];
        const cellLength = cellValue ? cellValue.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      
      // Establecer ancho con máximo de 40 y mínimo de 12
      column.width = Math.max(12, Math.min(40, maxLength + 2));
    });

    // Enviar Excel
    const filename = `Reporte_${template.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    console.log(`  ✓ Excel generado exitosamente: ${filename}`);
  } catch (error) {
    console.error('Excel download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Descargar reporte en CSV plano
router.get('/csv/download/:reportType', async (req, res) => {
  try {
    const { reportType } = req.params;
    const { municipality, dateFrom, dateTo } = req.query;

    // Obtener la plantilla
    const template = getTemplate(reportType);
    if (!template) {
      return res.status(404).json({ error: 'Plantilla de reporte no encontrada' });
    }

    console.log(`\n📄 Generando CSV: ${template.name}`);

    let data = [];
    let query = '';
    let values = [];

    // Construir query específica según el tipo de reporte (mismo que Excel)
    switch (reportType) {
      case 'deliveries':
        query = `
          SELECT ea.*, c.primer_nombre, c.primer_apellido, c.cedula, 
                 ta.nombre as aid_type_name, ta.unidad, u.nombre as operator_name
          FROM entregas_ayuda ea
          JOIN censados c ON ea.censado_id = c.id
          JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
          JOIN usuarios u ON ea.operador_id = u.id
          WHERE 1=1
        `;
        if (municipality) {
          query += ` AND ea.municipio = $${values.length + 1}`;
          values.push(municipality);
        }
        if (dateFrom) {
          query += ` AND ea.fecha_entrega >= $${values.length + 1}`;
          values.push(dateFrom);
        }
        if (dateTo) {
          query += ` AND ea.fecha_entrega <= $${values.length + 1}`;
          values.push(dateTo);
        }
        query += ' ORDER BY ea.fecha_entrega DESC';
        break;

      case 'deliveries_by_municipality':
        query = `
          SELECT ea.municipio, ta.nombre as aid_type, COUNT(*) as total_deliveries,
                 SUM(ea.cantidad) as total_quantity, COUNT(DISTINCT ea.censado_id) as beneficiaries
          FROM entregas_ayuda ea
          JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
          WHERE 1=1
        `;
        if (municipality) {
          query += ` AND ea.municipio = $${values.length + 1}`;
          values.push(municipality);
        }
        if (dateFrom) {
          query += ` AND ea.fecha_entrega >= $${values.length + 1}`;
          values.push(dateFrom);
        }
        if (dateTo) {
          query += ` AND ea.fecha_entrega <= $${values.length + 1}`;
          values.push(dateTo);
        }
        query += ' GROUP BY ea.municipio, ta.nombre ORDER BY ea.municipio, ta.nombre';
        break;

      case 'inventory':
        query = `
          SELECT i.*, ta.nombre as aid_type_name
          FROM inventario i
          JOIN tipos_ayuda ta ON i.tipo_ayuda_id = ta.id
          WHERE 1=1
        `;
        if (municipality) {
          query += ` AND i.municipio = $${values.length + 1}`;
          values.push(municipality);
        }
        query += ' ORDER BY i.municipio, ta.nombre';
        break;

      case 'beneficiaries':
        query = `
          SELECT * FROM censados WHERE 1=1
        `;
        if (municipality) {
          query += ` AND municipio = $${values.length + 1}`;
          values.push(municipality);
        }
        query += ' ORDER BY primer_nombre, primer_apellido';
        break;

      case 'duplicate_alerts':
        query = `
          SELECT ad.*, c.cedula, c.primer_nombre, c.primer_apellido,
                 ta.nombre as aid_type_name, c.municipio
          FROM alertas_duplicidad ad
          JOIN censados c ON ad.censado_id = c.id
          JOIN tipos_ayuda ta ON ad.tipo_ayuda_id = ta.id
          WHERE 1=1
        `;
        if (municipality) {
          query += ` AND c.municipio = $${values.length + 1}`;
          values.push(municipality);
        }
        query += ' ORDER BY ad.fecha_alerta DESC';
        break;

      case 'audit_log':
        query = `
          SELECT ba.*, u.nombre as user_name
          FROM bitacora_auditoria ba
          LEFT JOIN usuarios u ON ba.usuario_id = u.id
          WHERE 1=1
        `;
        if (dateFrom) {
          query += ` AND ba.fecha >= $${values.length + 1}`;
          values.push(dateFrom);
        }
        if (dateTo) {
          query += ` AND ba.fecha <= $${values.length + 1}`;
          values.push(dateTo);
        }
        query += ' ORDER BY ba.fecha DESC';
        break;

      case 'control-entities':
        query = `
          SELECT ea.*, c.cedula, c.primer_nombre, c.primer_apellido, c.telefono, c.email,
                 ta.nombre as aid_type_name, u.nombre as operator_name
          FROM entregas_ayuda ea
          JOIN censados c ON ea.censado_id = c.id
          JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
          JOIN usuarios u ON ea.operador_id = u.id
          WHERE 1=1
        `;
        if (municipality) {
          query += ` AND ea.municipio = $${values.length + 1}`;
          values.push(municipality);
        }
        if (dateFrom) {
          query += ` AND ea.fecha_entrega >= $${values.length + 1}`;
          values.push(dateFrom);
        }
        if (dateTo) {
          query += ` AND ea.fecha_entrega <= $${values.length + 1}`;
          values.push(dateTo);
        }
        query += ' ORDER BY ea.fecha_entrega DESC';
        break;

      default:
        return res.status(400).json({ error: 'Tipo de reporte no soportado' });
    }

    // Ejecutar query
    const result = await global.db.query(query, values);
    data = result.rows;

    console.log(`  Registros encontrados: ${data.length}`);

    if (data.length === 0) {
      return res.status(404).json({ error: 'No hay datos para este reporte' });
    }

    // Aplicar transformaciones de la plantilla
    const transformedData = template.transforms ? template.transforms(data) : data;

    // Crear CSV usando json2csv sin encabezado
    try {
      const parser = new Parser({ 
        fields: template.fields.map(f => ({ label: f.label, value: f.value })),
        header: true,
        quote: '"',
        delimiter: ','
      });
      const csv = parser.parse(transformedData);

      // Agregar BOM (Byte Order Mark) para UTF-8 afina las tildes en Excel
      const csvWithBom = '\ufeff' + csv;

      // Enviar CSV
      const filename = `Reporte_${template.name}_${new Date().toISOString().split('T')[0]}.csv`;
      res.set('Content-Type', 'text/csv; charset=utf-8');
      res.set('Content-Disposition', `attachment; filename="${filename}"`);
      res.end(csvWithBom, 'utf8');
      console.log(`  ✓ CSV generado exitosamente: ${filename}`);
    } catch (parseError) {
      console.error('JSON to CSV parse error:', parseError);
      return res.status(500).json({ error: 'Error al generar CSV' });
    }
  } catch (error) {
    console.error('CSV download error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
