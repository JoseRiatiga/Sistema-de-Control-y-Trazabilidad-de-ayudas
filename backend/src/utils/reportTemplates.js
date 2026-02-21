/**
 * Plantillas customizables para generación de reportes en CSV
 * Similar al sistema de estilos del PDF
 */

const reportTemplates = {
  // Reporte de Entregas
  deliveries: {
    name: 'Entregas',
    description: 'Reporte detallado de entregas de ayudas',
    fields: [
      { label: 'Fecha', value: 'fecha_entrega' },
      { label: 'Beneficiario', value: 'beneficiary_name' },
      { label: 'Cédula', value: 'cedula' },
      { label: 'Tipo de Ayuda', value: 'aid_type_name' },
      { label: 'Cantidad', value: 'cantidad' },
      { label: 'Unidad', value: 'unidad' },
      { label: 'Operador', value: 'operator_name' },
      { label: 'Municipio', value: 'municipio' }
    ],
    transforms: (data) => {
      return data.map(row => ({
        fecha_entrega: row.fecha_entrega ? new Date(row.fecha_entrega).toLocaleDateString('es-ES') : '',
        beneficiary_name: `${row.primer_nombre} ${row.primer_apellido}`,
        cedula: row.cedula,
        aid_type_name: row.aid_type_name,
        cantidad: row.cantidad,
        unidad: row.unidad,
        operator_name: row.operator_name,
        municipio: row.municipio
      }));
    }
  },

  // Reporte de Entregas por Municipio
  deliveries_by_municipality: {
    name: 'Entregas por Municipio',
    description: 'Resumen de entregas agrupadas por municipio',
    fields: [
      { label: 'Municipio', value: 'municipio' },
      { label: 'Tipo de Ayuda', value: 'aid_type' },
      { label: 'Total Entregas', value: 'total_deliveries' },
      { label: 'Cantidad Total', value: 'total_quantity' },
      { label: 'Beneficiarios', value: 'beneficiaries' }
    ],
    transforms: (data) => {
      return data.map(row => ({
        municipio: row.municipio,
        aid_type: row.aid_type,
        total_deliveries: row.total_deliveries,
        total_quantity: row.total_quantity,
        beneficiaries: row.beneficiaries
      }));
    }
  },

  // Reporte de Inventario
  inventory: {
    name: 'Inventario',
    description: 'Estado actual del inventario por ubicación',
    fields: [
      { label: 'Municipio', value: 'municipio' },
      { label: 'Tipo de Ayuda', value: 'aid_type_name' },
      { label: 'Cantidad Disponible', value: 'cantidad' },
      { label: 'Costo Unitario', value: 'costo_unitario' },
      { label: 'Valor Total', value: 'valor_total' },
      { label: 'Ubicación Almacén', value: 'ubicacion_almacen' }
    ],
    transforms: (data) => {
      return data.map(row => ({
        municipio: row.municipio,
        aid_type_name: row.aid_type_name,
        cantidad: row.cantidad,
        costo_unitario: parseFloat(row.costo_unitario || 0).toFixed(2),
        valor_total: (row.cantidad * parseFloat(row.costo_unitario || 0)).toFixed(2),
        ubicacion_almacen: row.ubicacion_almacen || 'Sin especificar'
      }));
    }
  },

  // Reporte de Beneficiarios
  beneficiaries: {
    name: 'Beneficiarios',
    description: 'Listado de beneficiarios registrados',
    fields: [
      { label: 'Cédula', value: 'cedula' },
      { label: 'Nombre', value: 'nombre_completo' },
      { label: 'Teléfono', value: 'telefono' },
      { label: 'Email', value: 'email' },
      { label: 'Dirección', value: 'direccion' },
      { label: 'Municipio', value: 'municipio' },
      { label: 'Miembros Familia', value: 'miembros_familia' }
    ],
    transforms: (data) => {
      return data.map(row => ({
        cedula: row.cedula,
        nombre_completo: `${row.primer_nombre} ${row.primer_apellido}`,
        telefono: row.telefono || '',
        email: row.email || '',
        direccion: row.direccion || '',
        municipio: row.municipio,
        miembros_familia: row.miembros_familia || 1
      }));
    }
  },

  // Reporte de Alertas de Duplicidad
  duplicate_alerts: {
    name: 'Alertas de Duplicidad',
    description: 'Detección de entregas duplicadas o sospechosas',
    fields: [
      { label: 'Beneficiario', value: 'beneficiary_name' },
      { label: 'Cédula', value: 'cedula' },
      { label: 'Tipo de Ayuda', value: 'aid_type_name' },
      { label: 'Última Entrega', value: 'fecha_ultima_entrega' },
      { label: 'Días Desde Última', value: 'dias_desde_ultima_entrega' },
      { label: 'Estado', value: 'estado_alerta' },
      { label: 'Municipio', value: 'municipio' }
    ],
    transforms: (data) => {
      const statusTranslations = {
        'pendiente': 'Pendiente',
        'revisada': 'Revisada',
        'resuelta': 'Resuelta'
      };
      
      return data.map(row => ({
        beneficiary_name: `${row.primer_nombre} ${row.primer_apellido}`,
        cedula: row.cedula,
        aid_type_name: row.aid_type_name,
        fecha_ultima_entrega: row.fecha_ultima_entrega ? new Date(row.fecha_ultima_entrega).toLocaleDateString('es-ES') : '',
        dias_desde_ultima_entrega: row.dias_desde_ultima_entrega || 'N/A',
        estado_alerta: statusTranslations[row.estado_alerta] || row.estado_alerta,
        municipio: row.municipio
      }));
    }
  },

  // Reporte de Auditoria
  audit_log: {
    name: 'Bitácora de Auditoría',
    description: 'Registro de cambios en el sistema',
    fields: [
      { label: 'Fecha', value: 'fecha' },
      { label: 'Acción', value: 'accion' },
      { label: 'Tabla', value: 'nombre_tabla' },
      { label: 'Usuario', value: 'user_name' },
      { label: 'Municipio', value: 'municipio' }
    ],
    transforms: (data) => {
      const actionTranslations = {
        'INSERT': 'Creación',
        'UPDATE': 'Modificación',
        'DELETE': 'Eliminación',
        'CREAR': 'Creación',
        'ELIMINAR': 'Eliminación',
        'MODIFICAR': 'Modificación'
      };
      
      const tableTranslations = {
        'entregas_ayuda': 'Entregas de Ayuda',
        'censados': 'Beneficiarios',
        'tipos_ayuda': 'Tipos de Ayuda',
        'inventario': 'Inventario',
        'usuarios': 'Usuarios',
        'alertas_duplicidad': 'Alertas de Duplicidad',
        'comprobantes_entrega': 'Comprobantes de Entrega',
        'bitacora_auditoria': 'Bitácora de Auditoría'
      };
      
      return data.map(row => ({
        fecha: row.fecha ? new Date(row.fecha).toLocaleString('es-ES') : '',
        accion: actionTranslations[row.accion] || row.accion,
        nombre_tabla: tableTranslations[row.nombre_tabla] || (row.nombre_tabla || '').replace(/_/g, ' ').toUpperCase(),
        user_name: row.user_name || 'Sistema',
        municipio: row.municipio || 'N/A'
      }));
    }
  },

  // Reporte para Entes de Control
  'control-entities': {
    name: 'Entes de Control',
    description: 'Reporte detallado para auditoría por parte de entes de control',
    fields: [
      { label: 'Fecha Entrega', value: 'fecha_entrega' },
      { label: 'Beneficiario', value: 'beneficiary_name' },
      { label: 'Cédula', value: 'cedula' },
      { label: 'Teléfono', value: 'telefono' },
      { label: 'Email', value: 'email' },
      { label: 'Tipo de Ayuda', value: 'aid_type_name' },
      { label: 'Cantidad', value: 'cantidad' },
      { label: 'Unidad', value: 'unidad' },
      { label: 'Operador', value: 'operator_name' },
      { label: 'Municipio', value: 'municipio' }
    ],
    transforms: (data) => {
      return data.map(row => ({
        fecha_entrega: row.fecha_entrega ? new Date(row.fecha_entrega).toLocaleDateString('es-ES') : '',
        beneficiary_name: `${row.primer_nombre} ${row.primer_apellido}`,
        cedula: row.cedula,
        telefono: row.telefono || '',
        email: row.email || '',
        aid_type_name: row.aid_type_name,
        cantidad: row.cantidad,
        unidad: row.unidad,
        operator_name: row.operator_name,
        municipio: row.municipio
      }));
    }
  }
};

/**
 * Traduce estados de alertas
 */
function translateStatus(status) {
  const translations = {
    'pendiente': 'Pendiente',
    'revisada': 'Revisada',
    'resuelta': 'Resuelta'
  };
  return translations[status] || status;
}

/**
 * Traduce acciones de auditoría
 */
function translateAction(action) {
  const translations = {
    'INSERT': 'Creación',
    'UPDATE': 'Modificación',
    'DELETE': 'Eliminación'
  };
  return translations[action] || action;
}

/**
 * Traduce nombres de tablas
 */
function translateTableName(tableName) {
  const translations = {
    'entregas_ayuda': 'Entregas de Ayuda',
    'censados': 'Beneficiarios',
    'tipos_ayuda': 'Tipos de Ayuda',
    'inventario': 'Inventario',
    'usuarios': 'Usuarios',
    'alertas_duplicidad': 'Alertas de Duplicidad',
    'comprobantes_entrega': 'Comprobantes de Entrega',
    'bitacora_auditoria': 'Bitácora de Auditoría'
  };
  return translations[tableName] || tableName.replace(/_/g, ' ').toUpperCase();
}

/**
 * Obtiene una plantilla por nombre
 */
function getTemplate(templateName) {
  return reportTemplates[templateName] || null;
}

/**
 * Obtiene lista de plantillas disponibles
 */
function getAvailableTemplates() {
  return Object.keys(reportTemplates).map(key => ({
    id: key,
    name: reportTemplates[key].name,
    description: reportTemplates[key].description
  }));
}

module.exports = {
  reportTemplates,
  getTemplate,
  getAvailableTemplates,
  translateStatus,
  translateAction,
  translateTableName
};
