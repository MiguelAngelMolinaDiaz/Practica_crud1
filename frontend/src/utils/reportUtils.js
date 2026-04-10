/**
 * ========================================
 *  UTILIDADES DE REPORTES Y EXPORTACIÓN
 * ========================================
 * 
 * Proporciona funciones para generar reportes profesionales en:
 *   - Excel: Usando librería ExcelJS (formato XLSX moderno)
 *   - PDF: Usando librería jsPDF
 * 
 * Características:
 *   - Formato profesional con colores y estilos personalizados
 *   - Nombres de archivo únicos con timestamp (evita sobrescrituras)
 *   - Headers congelados en Excel
 *   - Paginación automática en PDF
 *   - Manejo centralizado de transformación de datos
 *   - Soporte para relaciones (category.name, etc)
 * 
 * Librerías utilizadas:
 *   - ExcelJS: Para generación de hojas de cálculo profesionales
 *   - jsPDF: Para generación de PDF con tablas
 * 
 * Flujo típico:
 *   1. Obtener datos de API
 *   2. Formatear datos con formatDataForExport()
 *   3. Exportar a Excel o PDF según lo requiera usuario
 *   4. Archivo se descarga automáticamente al navegador
 */

import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';

/**
 * FUNCIÓN: Exportar a Excel
 * 
 * Genera un archivo Excel profesional con:
 *   - Título en las primeras filas
 *   - Información de generación (fecha, cantidad de registros)
 *   - Encabezados con formato gris oscuro y bordes
 *   - Datos con alternancia de colores (zebra striping)
 *   - Ancho de columnas automático
 *   - Filas congeladas (headers permanentes al hacer scroll)
 *   - Autofiltro en encabezados
 *   - Formatos de número para precio y stock
 * 
 * @param {Array} data - Array de objetos con datos a exportar
 *   Ejemplo: [{ name: 'Laptop', price: 999, stock: 5 }]
 * 
 * @param {String} filename - Nombre del archivo (default: 'reporte.xlsx')
 *   Se agregará timestamp automáticamente
 * 
 * @param {String} sheetname - Nombre de la hoja Excel (default: 'Datos')
 * 
 * Estilos aplicados:
 *   - Título: 16pt, blanco, fondo azul (#0D6EFD)
 *   - Info: 9pt cursiva, gris
 *   - Encabezados: 11pt bold blanco, fondo gris oscuro (#495057)
 *   - Datos pares: fondo gris muy claro (#F8F9FA)
 *   - Datos impares: blanco
 * 
 * Formato de archivo:
 *   - Tipo: XLSX (Open Office XML - formato moderno)
 *   - Nombre incluye: {nombre}_{YYYY-MM-DD_HH-MM-SS}.xlsx
 *   - Descarga automáticamente en navegador
 * 
 * @example
 *   const products = await fetch('/api/products').then(r => r.json());
 *   const formatted = formatDataForExport(products.data, [
 *       { key: 'name', label: 'Nombre' },
 *       { key: 'price', label: 'Precio' }
 *   ]);
 *   await exportToExcel(formatted, 'productos', 'Inventario');
 */
export const exportToExcel = async (data, filename = 'reporte.xlsx', sheetname = 'Datos') => {
  try {
    // Validar que hay datos
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // CREAR WORKBOOK Y WORKSHEET
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetname);

    // Metadatos del documento
    workbook.creator = 'CRUD-Mongo Sistema';
    workbook.created = new Date();
    workbook.modified = new Date();

    // OBTENER ENCABEZADOS DEL PRIMER OBJETO
    const headers = Object.keys(data[0]);
    const headerCount = headers.length;

    // ===== FILA 1: TÍTULO =====
    // Fusionar celdas para título centrado
    worksheet.mergeCells('A1', String.fromCharCode(64 + headerCount) + '1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = sheetname.toUpperCase();
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D6EFD' } // Azul profesional
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // ===== FILA 2: INFORMACIÓN DEL REPORTE =====
    worksheet.mergeCells('A2', String.fromCharCode(64 + headerCount) + '2');
    const infoCell = worksheet.getCell('A2');
    const now = new Date();
    infoCell.value = `Generado: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')} | Total: ${data.length} registros`;
    infoCell.font = { size: 9, italic: true, color: { argb: 'FF666666' } };
    infoCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    // ===== FILA 3: ENCABEZADOS =====
    const headerRow = worksheet.getRow(3);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header.toUpperCase();
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF495057' } // Gris oscuro
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
    headerRow.height = 25;

    // ===== FILAS DE DATOS =====
    data.forEach((row, rowIndex) => {
      const dataRow = worksheet.getRow(rowIndex + 4);
      headers.forEach((header, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1);
        cell.value = row[header];
        
        // FORMATO DE NÚMEROS
        // Detectar y formatear precios
        if (header.toLowerCase().includes('precio') && typeof row[header] === 'number') {
          cell.numFmt = '"$"#,##0.00';
        }
        
        // Detectar y formatear stock
        if (header.toLowerCase().includes('stock') && typeof row[header] === 'number') {
          cell.numFmt = '#,##0';
        }
        
        // ALINEACIÓN: Números a derecha, texto a izquierda
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: typeof row[header] === 'number' ? 'right' : 'left' 
        };
        
        // BORDES: Líneas tenuces alrededor de cada celda
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D1D1' } },
          left: { style: 'thin', color: { argb: 'FFD1D1D1' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D1D1' } },
          right: { style: 'thin', color: { argb: 'FFD1D1D1' } }
        };
        
        // ZEBRA STRIPING: Filas alternas con color claro
        if (rowIndex % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' } // Gris muy claro
          };
        }
      });
      dataRow.height = 20;
    });

    // ===== AJUSTE AUTOMÁTICO DE COLUMNAS =====
    headers.forEach((header, index) => {
      const column = worksheet.getColumn(index + 1);
      let maxLength = header.length;
      
      // Calcular el ancho máximo basado en contenido
      data.forEach(row => {
        const value = String(row[header] || '');
        maxLength = Math.max(maxLength, value.length);
      });
      
      // Establecer ancho entre 12 y 60 caracteres
      column.width = Math.max(12, Math.min(maxLength + 4, 60));
    });

    // ===== AUTOFILTRO =====
    // Permite al usuario filtrar datos en Excel
    worksheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: headers.length }
    };

    // ===== CONGELAR FILAS =====
    // Las 3 primeras filas (título, info, encabezados) quedan fijas al hacer scroll
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 3 }
    ];

    // ===== GENERAR NOMBRE ÚNICO =====
    // Incluir timestamp para evitar sobrescrituras
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const baseFilename = filename.replace('.xlsx', '');
    const uniqueFilename = `${baseFilename}_${timestamp}.xlsx`;

    // ===== DESCARGAR ARCHIVO =====
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = uniqueFilename;
    link.click();
    window.URL.revokeObjectURL(url);

    console.log(`✅ Excel profesional generado: ${uniqueFilename}`);
  } catch (error) {
    console.error('Error al generar Excel:', error);
    alert('Error al generar el reporte Excel: ' + error.message);
  }
};

/**
 * FUNCIÓN: Exportar a PDF
 * 
 * Genera un archivo PDF profesional con:
 *   - Encabezado con título en azul
 *   - Información de fecha, usuario y cantidad de registros
 *   - Tabla con datos formateados
 *   - Encabezados repetidos en cada página (si hay varias)
 *   - Paginación automática
 *   - Filas alternas con fondo gris
 *   - Footer con número de página
 *   - Nombres únicos con timestamp
 * 
 * @param {Array} data - Array de datos a exportar
 * 
 * @param {String} filename - Nombre del archivo (default: 'reporte.pdf')
 *   Se agregará timestamp automáticamente
 * 
 * @param {String} title - Título del reporte que aparece en el header
 *   (default: 'Reporte')
 * 
 * @param {Array} columns - Configuración de columnas a mostrar
 *   Ejemplo: [
 *     { key: 'name', label: 'Nombre', width: 50 },
 *     { key: 'price', label: 'Precio', width: 30 }
 *   ]
 * 
 * @param {String} userName - Nombre del usuario que genera el reporte
 *   (default: 'Admin')
 * 
 * Configuración de página:
 *   - Orientación: Horizontal (Landscape) para mejor ajuste de datos
 *   - Tamaño: A4
 *   - Márgenes: 15mm
 * 
 * Estilos:
 *   - Encabezados: Azul (#0D6EFD) fondo, texto blanco
 *   - Datos: Negro sobre blanco/gris alternado
 *   - Footer: Gris claro con página y copyright
 * 
 * Características de paginación:
 *   - Detecta automáticamente cuando hace falta nueva página
 *   - Repite encabezados  en cada página nueva
 *   - Contadores de página en footer
 * 
 * @example
 *   const products = [
 *     { name: 'Laptop', price: 999, stock: 5 }
 *   ];
 *   exportToPDF(products, 'productos', 'Inventario', [
 *       { key: 'name', label: 'Nombre', width: 50 },
 *       { key: 'price', label: 'Precio', width: 30 }
 *   ], 'Juan Admin');
 */
export const exportToPDF = (data, filename = 'reporte.pdf', title = 'Reporte', columns = [], userName = 'Admin') => {
  try {
    // ===== CREAR DOCUMENTO PDF =====
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape format
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;
    
    // ===== HEADER: TÍTULO =====
    pdf.setFontSize(18);
    pdf.setTextColor(13, 110, 253); // Azul profesional
    pdf.text(title, margin, yPosition);
    yPosition += 10;
    
    // Línea divisoria
    pdf.setDrawColor(13, 110, 253);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    
    // ===== INFORMACIÓN DEL REPORTE =====
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    const now = new Date();
    const fecha = now.toLocaleDateString('es-ES');
    const hora = now.toLocaleTimeString('es-ES');
    
    pdf.text(`Fecha: ${fecha} ${hora}`, margin, yPosition);
    pdf.text(`Usuario: ${userName}`, pageWidth - margin - 80, yPosition);
    yPosition += 8;
    
    pdf.text(`Total registros: ${data.length}`, margin, yPosition);
    yPosition += 10;
    
    // ===== TIMESTAMP ÚNICO PARA DESCARGA =====
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const baseFilename = filename.replace('.pdf', '');
    const uniqueFilename = `${baseFilename}_${timestamp}.pdf`;
    
    // ===== PREPARAR DATOS PARA TABLA =====
    const tableColumns = columns.map(c => c.label);
    const tableData = data.map(row => 
      columns.map(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'Sí' : 'No';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).substring(0, 50); // Limitar longitud
      })
    );
    
    // ===== DIBUJAR TABLA =====
    let xPos = margin;
    const colWidths = columns.map(c => c.width || 25);
    
    // ===== ENCABEZADOS =====
    pdf.setFontSize(10);
    pdf.setFillColor(13, 110, 253);
    pdf.setTextColor(255, 255, 255);
    
    let xCurrent = xPos;
    columns.forEach((col, idx) => {
      pdf.rect(xCurrent, yPosition, colWidths[idx], 8, 'F');
      pdf.text(col.label, xCurrent + 2, yPosition + 5);
      xCurrent += colWidths[idx];
    });
    
    yPosition += 10;
    
    // ===== FILAS DE DATOS =====
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    
    let rowCount = 0;
    tableData.forEach(row => {
      // ===== PAGINACIÓN: Detectar cuando hace falta nueva página =====
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
        
        // Repetir encabezados en nueva página
        pdf.setFontSize(9);
        pdf.setFillColor(13, 110, 253);
        pdf.setTextColor(255, 255, 255);
        
        let xCurrent = xPos;
        columns.forEach((col, idx) => {
          pdf.rect(xCurrent, yPosition, colWidths[idx], 8, 'F');
          pdf.text(col.label, xCurrent + 2, yPosition + 5);
          xCurrent += colWidths[idx];
        });
        
        yPosition += 10;
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
      }
      
      // ===== ZEBRA STRIPING: Filas alternas con fondo gris =====
      if (rowCount % 2 === 0) {
        pdf.setFillColor(240, 240, 240);
        xCurrent = xPos;
        columns.forEach((col, idx) => {
          pdf.rect(xCurrent, yPosition, colWidths[idx], 7, 'F');
          xCurrent += colWidths[idx];
        });
      }
      
      // Dibujar celdas de datos
      xCurrent = xPos;
      row.forEach((cell, idx) => {
        pdf.text(String(cell), xCurrent + 2, yPosition + 5);
        xCurrent += colWidths[idx];
      });
      
      yPosition += 7;
      rowCount++;
    });
    
    // ===== FOOTER =====
    yPosition = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    pdf.text(`Página ${pdf.internal.pages.length - 1}`, pageWidth - margin - 20, yPosition + 5);
    pdf.text('© CRUD-Mongo Sistema de Gestión', margin, yPosition + 5);
    
    // ===== DESCARGAR =====
    pdf.save(uniqueFilename);
    
    console.log(`✅ PDF generado: ${uniqueFilename}`);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Error al generar el reporte PDF');
  }
};

/**
 * FUNCIÓN: Formatear datos para exportación
 * 
 * Transforma datos de la API para exportación:
 *   - Selecciona solo campos deseados
 *   - Extrae valores de objetos anidados (.name)
 *   - Aplica transformaciones personalizadas
 *   - Sustituye valores null/undefined con 'N/A'
 * 
 * @param {Array} data - Datos originales de la API
 *   Ejemplo: [{
 *     name: 'Laptop',
 *     price: 999,
 *     category: { _id: '123', name: 'Electrónica' }
 *   }]
 * 
 * @param {Array} fieldsToExport - Configuración de campos a exportar
 *   Puede ser:
 *   1. Strings simples (se exportan con el mismo nombre):
 *      ['name', 'price']
 *   
 *   2. Objetos con transformación:
 *      [
 *        { key: 'category', label: 'Categoría' },  // Extrae category.name
 *        { key: 'price', label: 'Precio', 
 *          transform: (val) => '$' + val }  // Transformación personalizada
 *      ]
 * 
 * @returns {Array} Array de objetos transformados listos para exportar
 * 
 * Transformaciones automáticas:
 *   - Si valor es objeto con .name: Extrae el .name
 *   - Si valor es null/undefined: Reemplaza con 'N/A'
 *   - Si existe función transform: Aplica transformación personalizada
 * 
 * @example
 *   const products = [
 *     { name: 'Laptop', price: 999, category: { name: 'Electronics' } }
 *   ];
 *   
 *   const formatted = formatDataForExport(products, [
 *     'name',
 *     { key: 'price', label: 'Precio' },
 *     { key: 'category', label: 'Categoría' }
 *   ]);
 *   
 *   // Resultado:
 *   // [{ name: 'Laptop', Precio: 999, Categoría: 'Electronics' }]
 */
export const formatDataForExport = (data, fieldsToExport = []) => {
  return data.map(item => {
    const formatted = {};
    fieldsToExport.forEach(field => {
      // CASO 1: Field es un string (campo simple)
      if (typeof field === 'string') {
        formatted[field] = item[field];
      } 
      // CASO 2: Field es un objeto (con transformaciones)
      else {
        const value = item[field.key];
        
        // Si hay función transform, aplicarla
        if (field.transform && typeof field.transform === 'function') {
          formatted[field.label] = field.transform(value);
        } 
        // Si es un objeto con propiedad .name (como category, subcategory, etc)
        else if (value && typeof value === 'object' && value.name) {
          formatted[field.label] = value.name;
        } 
        // Valor por defecto
        else {
          formatted[field.label] = value ?? 'N/A';
        }
      }
    });
    return formatted;
  });
};
