import nodemailer from 'nodemailer';
import AdmZip from 'adm-zip';
import fs from 'fs';


function sendEmail() {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'ricardo.landinez@estupendo.com.co',
            pass: 'Terry040804'
        }
    });

    const zip = new AdmZip();
    const zipFilePath = './Reporte_Estupendo.zip'; // Cambiar la ruta y nombre del archivo .zip

    const filesToCompress = [
        './Reporte_documentos_autorizados_emision_EmpresasBodytech.xlsx', // Cambiar las rutas a los documentos que deseas comprimir
        // './Reporte_documentos_autorizados_emision.xlsx',
        // './Reporte_documentos_autorizados_nomina.xlsx',
        // './Reporte_documentos_rechazados_emision.xlsx',
        // './Reporte_documentos_recepcionados.xlsx'
    ];

    filesToCompress.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath);
            const fileName = filePath.split('/').pop(); // Obtener el nombre del archivo
            zip.addFile(fileName, fileContent); // Agregar archivo al ZIP
        } else {
            console.error(`Archivo no encontrado: ${filePath}`);
        }
    });

    zip.writeZip(zipFilePath);

    const mailOptions = {
        from: 'ricardo.landinez@estupendo.com.co',
        to: 'ismary.lara@estupendo.com.co', // Cambia el correo de destino
      //cc: 'correo.en.copia@example.com', 
        bcc: 'soporte.stupendo@estupendo.com.co',
        subject: 'Reporte documentos emitidos y autorizados por el grupo Bodytech',
        html: `
        Buen día estimado equipo de Estupendo,<br><br>
        Reciban un cordial saludo. Este mensaje automático tiene como propósito reportar, de manera quincenal, los documentos emitidos y autorizados por las empresas asociadas a BODYTECH, detalladas a continuación:<br><br>
        - INVERDESA COMERCIAL S.A.S   NIT 900018477<br>
        - INVERSIONES EN RECREACION DEPORTE Y SALUD S.A.   NIT 830033206<br>
        - INCITEDIGITAL S.A.S NIT 901361991<br>
        - FITNESS MARKET SAS  NIT 830080000<br><br>
        Es relevante mencionar que si alguna de estas empresas no aparece reflejada en el reporte, se debe a que el número de documentos es igual a 0, lo que indica que no se emitieron documentos durante ese período de 15 días.<br><br>
        <strong>Por favor, NO responder a este mensaje, ya que se ha generado automáticamente</strong>.<br><br>
        Saludos cordiales.
    `,
        attachments: [
            {
                filename: 'Reporte_electronico.zip',
                path: zipFilePath
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error al enviar el correo:', error);
        } else {
            console.log('Correo enviado:', info.response);
        }
    });
}

sendEmail();



export default sendEmail
