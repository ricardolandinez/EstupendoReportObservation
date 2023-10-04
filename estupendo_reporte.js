const ExcelJS = require('exceljs');
const { MongoClient, ObjectId } = require('mongodb'); 
const crypto = require('crypto');

async function getDocs(query, start, size) {

  const client = await MongoClient.connect(global.gConfig.mongouri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  if (!client) {
    return;
  }

  try {
    const db = client.db();
    const collection = db.collection('documentos_rec');
    const res = await collection.find(query).skip(start).limit(size).toArray();
    return res;
  } catch (err) {
    console.log('>>> ERROR', err);
  } finally {
    client.close();
  }
}

async function getTable(table, query) {

  const client = await MongoClient.connect(global.gConfig.mongouri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
  
  if (!client) {
    
    return;
  }

  try {
    const db = client.db();
    const collection = db.collection(table);
    const res = await collection.findOne(query);
    return res;  
  } catch (err) {
    console.log('>>> ERROR', err);
  } finally {
    client.close();
  }
}


function getTipoDocumento(item) {

  if (item.tituloValor && item.tituloValor == true) {
    return "Titulo Valor";
  }


  if (item.formaPago) {

    switch (item.formaPago) {
      case '1':
        return "Factura Contado";
      case '2':
        return "Factura Crédito";
    }
  }

  switch (item.tipo_documento) {
    case '01':
      return "Factura";

    case '04':
    case '91':
      return "Nota de Crédito";

    case '05':
    case '92':
      return "Nota de Débito";
  }
}


function getEstado(estado) {

  switch (estado) {
    case '0': case 0: return "Recibido";
    case '1': case 1: return "En Proceso";
    case '2': case 2: return "Aceptado";
    case '3': case 3: return "Rechazado";
    case '5': case 5: return "Sin validacion Dian";
    case '6': case 6: return "Rechazado por parametros";
  }

  return '';
}


function getEventos(acuse_recibo,reclamo,recibo_bien_servicio,aceptacion,aceptacion_tacita,titulo_valor) {

  var eventos = '';
   if(acuse_recibo){
    eventos+=' Acuse de recibido,';
   }
   if(recibo_bien_servicio){
    eventos+=' Recibo del bien o servicio,';
   }
   if(reclamo){
    eventos+=' Reclamo,';
   }
   if(aceptacion){
    eventos+=' Aceptacion expresa,';
   }
   if(aceptacion_tacita){
    eventos+=' Aceptacion tacita';
   }
   if(titulo_valor){
    eventos+=' Titulo valor,';
   }

   return eventos;
  
}

function getStatusAcuse(acuse) {
  if (acuse) {
    switch (acuse) {
      case 1:
        return 'ACEPTADO';
      case 2:
        return 'RECHAZADO';
      case 3:
        return 'ACEPTADO TACITAMENTE';
    }
  } else {
    return 'PENDIENTE';
  }
}

//function number_format(num) {
//  return (Math.round(num * 100) / 100).toFixed(2);
//}

function hashSha384(str) {
  let hash = crypto.createHash('sha384');
  let data = hash.update(str, 'utf-8');
  return data.digest('hex');
}


async function getListaUsuarios(usuarios) {

  let usersName = "No Asignado";

  if (usuarios) {

    // obtener cada usuario y obtener el nombre de cada uno
    let comma = '';
    usersName = '';

    for (let user of usuarios) {
      let userId = new ObjectId(user);
      const qUser = await getTable('usuarios', userId);

      if (qUser) {
        usersName += comma + qUser.nombre;
        comma = ', ';
      }
    }
  }

  return usersName;
}


function getAccion(wfaccion) {

  let accion = "";

  switch (wfaccion) {
    case 'asignar': accion = "Asignado"; break;
    case 'reasignar': accion = "Reasignado"; break;
    case 'aprobar': accion = "Aprobado"; break;
    case 'pendiente': accion = "Pendiente"; break;
    case 'rechazar': accion = "Rechazado"; break;
    case 'wf-eliminado': accion = "Workflow eliminado"; break;
    case 'evento030': accion = "Acuse del Recibo"; break;
    case 'evento032': accion = "Aceptacion Bien/Servicio"; break;
    case 'evento031': accion = "Reclamo"; break;
    case 'evento033': accion = "Aceptacion Expresa"; break;
  }

  return accion;
}


function getFecha(date) {

  if (!(date instanceof Date)) {
    return '';
  }

  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, '0');
  let day = String(date.getDate()).padStart(2, '0');

  let hour = String(date.getHours()).padStart(2, '0');
  let min = String(date.getMinutes()).padStart(2, '0');
  let sec = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
}


async function getObservations(historialWf) {

  if (!historialWf) {
    return '';
  }

  let sumaObserv = '';
  let contador = 0;
  let pipes = ''

  for (let hist of historialWf) {

    usuarioApr = 'Sistema';
    obser = '';
    fecha = '';

    let userId = new ObjectId(hist.usuario);
    let qUser = await getTable('usuarios', userId);

    if (qUser) {
      usuarioApr = qUser.nombre;
    }

    if (hist.accion) {
      obser = getAccion(hist.accion);
    }

    fecha = getFecha(hist.created_at);

    contador++;
    sumaObserv += `${pipes} ${contador}. ${usuarioApr}: ${obser}; Fecha: ${fecha}`;
    pipes = ' ||';
  }

  return sumaObserv;
}


module.exports = async (filePath, query) => {

  // variable para calcular el tiempo de ejecucion
  let time1 = process.hrtime();

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    filename: filePath,
    useStyles: true,
    useSharedStrings: false,
  });

  workbook.creator = 'Stupendo';
  workbook.lastModifiedBy = 'Stupendo';
  let worksheet = workbook.addWorksheet('Sheet1');

  worksheet.columns = [
    { header: 'Fecha Recepcion', key: 'fecha_emision' },
    { header: 'Fecha Emision', key: 'created_at' },
    { header: 'Proveedor', key: 'proveedor' },
    { header: 'Nit Proveedor', key: 'nit_proveedor' },
    { header: 'Tipo Documento', key: 'tipo_documento' },
    { header: 'Numero', key: 'numeral' },
    { header: 'Tipo Factura', key: 'tipo_factura' },
    { header: 'Documento Referenciado', key: 'documentRef' },
    { header: 'Valor', key: 'valor_total' },
    { header: 'Workflow', key: 'workflow' },
    { header: 'Usuario', key: 'usuarios' },
    { header: 'Estado ', key: 'estado' },
    { header: 'Orden de Compra ', key: 'orden_compra' },
    { header: 'Datos Adiccionales ', key: 'dato_adicional' },
    { header: 'Observaciones de cada aprobador  ', key: 'observacion' },

  ];

  let start = 0;
  const size = 75000;
  const timeoffset = 5 * 60 * 60 * 1000;

  var queryStr = JSON.stringify(query);
  console.log(`START QUERY ${start}-${queryStr}`);

  let promise = getDocs(query, start, size);
  let docs = await promise.then();

  console.log(`END QUERY ${start}-${start + docs.length}-${queryStr}`);

  // obtener el cliente para luego consultar el workflow
  let clienteId = new ObjectId(query.receptor_id);
  const receptor = await getTable("clientes", clienteId );

  while (promise && docs && docs.length > 0) {

    if (docs.length >= size) {

      start += size;
      console.log(`START QUERY ${start}-${queryStr}`);
      promise = getDocs(query, start, size);

    } else {
      promise = null;
    }

    let arrItemsExcel = [];
    
    // recorrer los documentos con un forEach para poder consultar los proveedores
    for (const item of docs) {
      
      let  objectId = new ObjectId(item.emisor_id);
      let proveedor = await getTable("clientes", objectId );

      // obtener el WorkFlow desde el cliente dado el ID del documento
      let workFlowName = 'No Asignado';
      for (const myWorkflow of receptor.workflows) {
        if (String(myWorkflow._id) == item.workflow) {
          workFlowName = myWorkflow.titulo;
        }
      }

      let observacion = await getObservations(item.historial_wf);
      let qUsers = await getListaUsuarios(item.usuarios);

      arrItemsExcel.push(
        {
          'fecha_emision': item.fecha_emision ? new Date(item.fecha_emision.getTime() - timeoffset) : '',
          'created_at': item.created_at ? new Date(item.created_at.getTime() - timeoffset) : '',
          'proveedor': proveedor.nombre_identificacion,
          'nit_proveedor': proveedor.identificacion,
          'tipo_documento':  item.fisico && item.fisico == true ? 'Físico' : 'Electrónico',
          'numeral': item.numeral,
          'tipo_factura': getTipoDocumento(item),
          'documentRef': item.documentRef ? item.documentRef : '',
          'valor_total': 'valor_total' in item ? item.valor_total : '',
          'workflow': workFlowName,
          'usuarios': qUsers,
          'estado': getEstado(item.estado),
          'orden_compra': item.orden_compra,
          'dato_adicional': item.dato_adicional,
          'observacion' : observacion,
        }
      );


      // validar tiempo de ejecucion en este punto para terminar ejecucion
      let time2 = process.hrtime(time1);

      // detener ejecucion cuando lleve 4' 45'' de ejecucion
      if (time2[0] >= 285) {
        promise = null;
        break;
      }

    }


    for (const excelrow of arrItemsExcel) {
      worksheet.addRow(excelrow).commit();
    };

    console.log(`>>> END MAP-${queryStr}`);

    if (promise) {
      docs = await promise.then();
      console.log(`END QUERY ${start}-${start + docs.length}-${queryStr}`);
    }
  
  }


  await worksheet.commit();
  await workbook.commit();
};