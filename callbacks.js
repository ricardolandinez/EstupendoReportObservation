import ExcelJS from "exceljs";
import moment from "moment-timezone";

// autorizados
const generarAutorizados = (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');


    worksheet.addRow(['Razón Social', 'NIT', 'Total Documentos autorizados']);


    data.forEach(item => {
        worksheet.addRow([item.razon_social, item.nit, item.totalDocumentos_autorizados]);
    });


    const filename = 'Reporte_documentos_autorizados_emision.xlsx';
    workbook.xlsx.writeFile(filename)
        .then(() => {
            console.log(`Reporte generado exitosamente en ${filename}`);
        })
        .catch(error => {
            console.error('Error al generar el reporte:', error);
        });

}
// eventos
const generarEventos = (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    worksheet.addRow(['Razón Social', 'NIT', 'Total Eventos']);

    data = data.map(document => {
        return {
            razon_social: document.nombre_identificacion,
            nit: document.identificacion,
            totalDocumentos_eventos: document.totalDocumentos_eventos
        }
    }).forEach(item => {
        worksheet.addRow([item.razon_social, item.nit, item.totalDocumentos_eventos]);
    });


    const filename = 'Reporte_eventos.xlsx';
    workbook.xlsx.writeFile(filename)
        .then(() => {
            console.log(`Reporte generado exitosamente en ${filename}`);
        })
        .catch(error => {
            console.error('Error al generar el reporte:', error);
        });
}

// nomina
const generarNomina = (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    worksheet.addRow(['Razón Social', 'NIT', 'Total Documentos Nomina']);

    data = data.map(document => {
        return {
            razon_social: document.razon_social,
            nit: document.nit,
            totalDocumentos_nomina: document.totalDocumentos_rechazado
        }
    }).forEach(item => {
        worksheet.addRow([item.razon_social, item.nit, item.totalDocumentos_nomina]);
    });

    const filename = 'Reporte_documentos_autorizados_nomina.xlsx';
    workbook.xlsx.writeFile(filename)
        .then(() => {
            console.log(`Reporte generado exitosamente en ${filename}`);
        })
        .catch(error => {
            console.error('Error al generar el reporte:', error);
        });

}

// recepcion
const generarRecepcion = (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');


    worksheet.addRow(['Razón Social', 'NIT', 'Total Documentos Recepcion']);

    data = data.map(document => {
        return {
            razon_social: document.razon_social,
            nit: document.nit,
            totalDocumentos_recepcionados: document.totalDocumentos_rechazado
        }
    }).forEach(item => {
        worksheet.addRow([item.razon_social, item.nit, item.totalDocumentos_recepcionados]);
    });

    const filename = 'Reporte_documentos_recepcionados.xlsx';
    workbook.xlsx.writeFile(filename)
        .then(() => {
            console.log(`Reporte generado exitosamente en ${filename}`);
        })
        .catch(error => {
            console.error('Error al generar el reporte:', error);
        });

}

// rechazados
const generarRechazados = (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');


    worksheet.addRow(['Razón Social', 'NIT', 'Total Documentos Rechazados']);

    data = data.map(document => {
        return {
            razon_social: document.razon_social,
            nit: document.nit,
            totalDocumentos_rechazado: document.totalDocumentos_rechazado
        }
    }).forEach(item => {
        worksheet.addRow([item.razon_social, item.nit, item.totalDocumentos_rechazado]);
    });


    const filename = 'Reporte_documentos_rechazados_emision.xlsx';
    workbook.xlsx.writeFile(filename)
        .then(() => {
            console.log(`Reporte generado exitosamente en ${filename}`);
        })
        .catch(error => {
            console.error('Error al generar el reporte:', error);
        });

}

// recepcion observaciones
function adjustToColombiaTime(date) {
    if (!date) return null;
    const offset = -5; // Colombia UTC -5:00
    const hoursInMilliseconds = offset * 60 * 60 * 1000;
    const adjustedDate = new Date(date.getTime() + hoursInMilliseconds);
    return adjustedDate;
}

const formatHistorial = (historial) => {
    return historial.filter(entry => entry && entry.Usuario && entry.Accion && entry.Fecha)
        .map((entry, index) => {
            let adjustedDate = adjustToColombiaTime(entry.Fecha);
            let fechaString = adjustedDate ? adjustedDate.toISOString().slice(0, 19).replace('T', ' ') : 'Fecha no definida';
            return `${index + 1}. ${entry.Usuario}: ${entry.Accion}; Fecha: ${fechaString}`
        }).join(' || ');
}

const formatToBogotaDate = (date) => {
    return moment(date).tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
};


const generarRecepcionPerenco = (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');


    worksheet.addRow([
        'FechaRecepcion',
        'FechaEmision',
        'Proveedor',
        'NitProveedor',
        'TipoDocumento',
        'TipoPago',
        'NumeralDocumento',
        'DocumentoReferenciado',
        'Subtotal',
        'ValorTotal',
        "Workflow",
        "Usuarios",
        "Estado",
        'OrdenDeCompra',
        'DatosAdicionales',
        "Observaciones"
    ]);

    data = data.map(document => {
        return {

            FechaRecepcion: formatToBogotaDate(document.created_at),
            FechaEmision: formatToBogotaDate(document.fecha_emision),
            Proveedor: document.razon_social_emisor,
            NitProveedor: document.nit_emisor,
            TipoDocumento: document.tipo_documento,
            TipoPago: document.formaPago,
            NumeralDocumento: document.numeral,
            DocumentoReferenciado: document.documentRef,
            SubTotal: document.sub_total,
            ValorTotal: document.valor_total,
            Workflow: document.workflowTitulo,
            Usuarios: document.usuarios,
            Estado: document.estado,
            OrdenDeCompra: document.orden_compra,
            DatosAdicionales: document.dato_adicional,
            Observaciones: formatHistorial(document.historial_wf)
        }
    }).sort((a, b) => {
        if (a.FechaRecepcion < b.FechaRecepcion) return -1;
        if (a.FechaRecepcion > b.FechaRecepcion) return 1;
        return 0;
    }).forEach(item => {
        worksheet.addRow(
            [
                item.FechaRecepcion,
                item.FechaEmision,
                item.Proveedor,
                item.NitProveedor,
                item.TipoDocumento,
                item.TipoPago,
                item.NumeralDocumento,
                item.DocumentoReferenciado,
                item.SubTotal,
                item.ValorTotal,
                item.Workflow,
                item.Usuarios,
                item.Estado,
                item.OrdenDeCompra,
                item.DatosAdicionales,
                item.Observaciones
            ]
        );
    })

    const filename = 'Reporte_documentos_recepcionados_Observaciones_PerencoOilAndGas_SEPTIEMBRE-OCTUBRE.xlsx';
    workbook.xlsx.writeFile(filename)
        .then(() => {
            console.log(`Reporte generado exitosamente en ${filename}`);
        })
        .catch(error => {
            console.error('Error al generar el reporte:', error);
        });

}
//Bodytech
const generarEmpresasBodytech = (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');


    worksheet.addRow(['Razón Social', 'NIT', 'Total Documentos autorizados']);

    data = data.map(document => {
        return {
            razon_social: document.razon_social,
            nit: document.nit,
            totalDocumentos_autorizados: document.totalDocumentos_autorizados || 0
     }
    }).forEach(item => {
        worksheet.addRow([item.razon_social, item.nit, item.totalDocumentos_autorizados]);
    });


    const filename = 'Reporte_documentos_autorizados_emision_EmpresasBodytech.xlsx';
    workbook.xlsx.writeFile(filename)
        .then(() => {
            console.log(`Reporte generado exitosamente en ${filename}`);
        })
        .catch(error => {
            console.error('Error al generar el reporte:', error);
        });

}
export { generarAutorizados, generarEventos, generarNomina, generarRecepcion, generarRechazados, generarRecepcionPerenco, formatHistorial, generarEmpresasBodytech };



