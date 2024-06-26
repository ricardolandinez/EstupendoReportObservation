import dotenv from "dotenv";
import generarReporte from "./generador.js";
import { generarAutorizados, generarEventos, generarNomina, generarRecepcion, generarRecepcionPerenco, generarRechazados, formatHistorial, generarEmpresasBodytech, adquirentesSinEventos, generarClientesEstupendo } from "./callbacks.js";
import { ObjectId } from 'mongodb';

dotenv.config()

const query = [
    {
        $match: {
            tipo_documento: "01",
            formaPago: "2",
            created_at: {
                $gte: new Date("2022-07-13T00:00:00-05:00"),
                $lte: new Date("2023-10-26T23:59:59-05:00")
            }
        }
    },
    {
        $addFields: {
            emisorObjectId: { $toObjectId: "$emisor_id" }
        }
    },
    {
        $group: {
            _id: "$emisorObjectId",
            totalDocumentos_autorizados: {
                $sum: { $cond: [{ $eq: ["$estado", 2] }, 1, 0] }
            },
            totalDocumentos_sinEventos: {
                $sum: {
                    $cond: [
                        {
                            $and: [
                                { $eq: ["$estado", 2] },
                                { $eq: ["$acuse_recibo", false] },
                                { $eq: ["$reclamo", false] },
                                { $eq: ["$recibo_bien_servicio", false] },
                                { $eq: ["$aceptacion", false] },
                                { $eq: ["$aceptacion_tacita", false] },
                                { $eq: ["$titulo_valor", false] }
                            ]
                        },
                        1,
                        0
                    ]
                }
            }
        }
    },
    {
        $sort: {
            totalDocumentos_autorizados: -1
        }
    },
    {
        $lookup: {
            from: "clientes",
            localField: "_id",
            foreignField: "_id",
            as: "clienteInfo"
        }
    },
    {
        $project: {
            razon_social: { $arrayElemAt: ["$clienteInfo.nombre_identificacion", 0] },
            nit: { $arrayElemAt: ["$clienteInfo.identificacion", 0] },
            totalDocumentos_autorizados: 1,
            totalDocumentos_sinEventos: 1
        }
    }
]

const eventos = [{
    $match: {
        "radian.evento_pre_radian": true
    }
},
{
    $addFields: {
        nuevo_id: { $toString: "$_id" }
    }
},
{
    $lookup: {
        from: "documentos_eventos",
        let: { cliente_id: "$nuevo_id" },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ["$emisor_id", "$$cliente_id"] },
                            {
                                $gte: ["$created_at", new Date("2023-01-01T00:00:00Z")]
                            },
                            {
                                $lt: ["$created_at", new Date("2023-09-30T23:59:59Z")]
                            }
                        ]
                    }
                }
            }
        ],
        as: "documentos_eventos"
    }
},
{
    $project: {
        identificacion: 1,
        nombre_identificacion: 1,
        totalDocumentos_eventos: {
            $size: {
                $ifNull: ["$documentos_eventos", []]
            }
        }
    }
},
{ $sort: { totalDocumentos_eventos: -1 } },
]

const nomina = [
    {
        $match: {
            estado: 2,
            created_at: {
                $gte: new Date("2023-09-01T00:00:00Z"),
                $lt: new Date("2023-09-30T23:59:59Z")
            }
        }
    },
    {
        $addFields: {
            emisorObjectId: { $toObjectId: "$empleador_id" }
        }
    },
    {
        $group: {
            _id: "$emisorObjectId",
            totalDocumentos_rechazado: { $sum: 1 }
        }
    },
    {
        $sort: {
            totalDocumentos_rechazado: -1
        }
    },
    {
        $lookup: {
            from: "clientes",
            localField: "_id",
            foreignField: "_id",
            as: "clienteInfo"
        }
    },
    {
        $project: {
            razon_social: { $arrayElemAt: ["$clienteInfo.nombre_identificacion", 0] },
            nit: { $arrayElemAt: ["$clienteInfo.identificacion", 0] },
            totalDocumentos_rechazado: "$totalDocumentos_rechazado"
        }
    }
]

const recepcion = [
    {
        $match: {
            created_at: {
                $gte: new Date("2023-09-01T00:00:00Z"),
                $lte: new Date("2023-09-30T23:59:59Z")
            }
        }
    },
    {
        $addFields: {
            emisorObjectId: { $toObjectId: "$receptor_id" }
        }
    },
    {
        $group: {
            _id: "$emisorObjectId",
            totalDocumentos_rechazado: { $sum: 1 }
        }
    },
    {
        $sort: {
            totalDocumentos_rechazado: -1
        }
    },
    {
        $lookup: {
            from: "clientes",
            localField: "_id",
            foreignField: "_id",
            as: "clienteInfo"
        }
    },

    {
        $project: {
            razon_social: { $arrayElemAt: ["$clienteInfo.nombre_identificacion", 0] },
            nit: { $arrayElemAt: ["$clienteInfo.identificacion", 0] },
            totalDocumentos_rechazado: "$totalDocumentos_rechazado"
        }
    }
]

const rechazados = [
    {
        $match: {
            estado: 3,
            created_at: {
                $gte: new Date("2023-09-01T00:00:00Z"),
                $lt: new Date("2023-09-30T00:00:00Z")
            }
        }
    },
    {
        $addFields: {
            emisorObjectId: { $toObjectId: "$emisor_id" }
        }
    },
    {
        $group: {
            _id: "$emisorObjectId",
            totalDocumentos_rechazado: { $sum: 1 }
        }
    },
    {
        $sort: {
            totalDocumentos_rechazado: -1
        }
    },
    {
        $lookup: {
            from: "clientes",
            localField: "_id",
            foreignField: "_id",
            as: "clienteInfo"
        }
    },

    {
        $project: {
            razon_social: { $arrayElemAt: ["$clienteInfo.nombre_identificacion", 0] },
            nit: { $arrayElemAt: ["$clienteInfo.identificacion", 0] },
            totalDocumentos_rechazado: "$totalDocumentos_rechazado"
        }
    }
]



const recepcionadosPerencos = [
    {
        $match: {
            receptor_id: "5d780d6900679c1ffc549f8e",
            formaPago:"2",
            "historial_wf.accion":{
                $nin: ["evento031","evento032","evento033"]
            },
            

            created_at: {
                $gte: new Date("2023-01-01T00:00:00-05:00"),
                $lte: new Date("2023-12-31T23:59:59-05:00")
            }
        }
    },
    {
        $addFields: {
            receptorObjectId: { $toObjectId: "$receptor_id" },
            emisorObjectId: { $toObjectId: "$emisor_id" },
            usuariosObjectIds: { $map: { input: "$usuarios", as: "usuario", in: { $toObjectId: "$$usuario" } } }

        }
    },
    {
        $lookup: {
            from: "usuarios",
            localField: "usuariosObjectIds",
            foreignField: "_id",
            as: "infoUsuarios"
        }
    },
    {
        $addFields: {
            usuariosNombres: { $map: { input: "$infoUsuarios", as: "usuario", in: "$$usuario.nombre" } }
        }
    },
    {
        $lookup: {
            from: "clientes",
            localField: "receptorObjectId",
            foreignField: "_id",
            as: "receptorInfo"
        }
    },
    {
        $unwind: "$receptorInfo"
    },
    {
        $lookup: {
            from: "clientes",
            localField: "emisorObjectId",
            foreignField: "_id",
            as: "emisorInfo"
        }
    },
    {
        $unwind: "$emisorInfo"
    },
    {
        $addFields: {
            tipo_documento: {
                $cond: [
                    {
                        $and: [
                            { $eq: ["$tipo_documento", "01"] },
                            { $eq: ["$tituloValor", true] },
                        ]
                    },
                    "Título Valor",
                    {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$tipo_documento", "01"] },
                                    { $eq: ["$fisico", true] }
                                ]
                            },
                            "Factura Fisica",
                            {
                                $cond: [
                                    { $eq: ["$tipo_documento", "01"] },
                                    "Factura Electrónica",
                                    {
                                        $cond: [
                                            { $eq: ["$tipo_documento", "02"] },
                                            "Factura de Exportación",
                                            {
                                                $cond: [
                                                    {
                                                        $and: [
                                                            { $eq: ["$tipo_documento", "91"] },
                                                            { $eq: ["$fisico", true] }
                                                        ]
                                                    },
                                                    "Nota Crédito Física",
                                                    {
                                                        $cond: [
                                                            { $eq: ["$tipo_documento", "91"] },
                                                            "Nota Crédito",
                                                            {
                                                                $cond: [
                                                                    {
                                                                        $and: [
                                                                            { $eq: ["$tipo_documento", "92"] },
                                                                            { $eq: ["$fisico", true] }
                                                                        ]
                                                                    },
                                                                    "Nota Débito Física",
                                                                    {
                                                                        $cond: [
                                                                            { $eq: ["$tipo_documento", "92"] },
                                                                            "Nota Débito",
                                                                            {
                                                                                $cond: [
                                                                                    { $eq: ["$tipo_documento", "03"] },
                                                                                    "Factura Contingencia Proveedor",
                                                                                    {
                                                                                        $cond: [
                                                                                            { $eq: ["$tipo_documento", "04"] },
                                                                                            "Factura Contingencia DIAN",
                                                                                            "No mapeado"
                                                                                        ]
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            estado: {
                $switch: {
                    branches: [
                        { case: { $eq: [{ $toString: "$estado" }, "0"] }, then: "Recibido" },
                        { case: { $eq: [{ $toString: "$estado" }, "1"] }, then: "En Proceso" },
                        { case: { $eq: [{ $toString: "$estado" }, "2"] }, then: "Aceptado" },
                        { case: { $eq: [{ $toString: "$estado" }, "3"] }, then: "Rechazado" },
                        { case: { $eq: [{ $toString: "$estado" }, "5"] }, then: "Sin validacion Dian" },
                        { case: { $eq: [{ $toString: "$estado" }, "6"] }, then: "Rechazado por parametros" }
                    ],
                    default: "Estado desconocido"
                }
            },

            documentRef: { $ifNull: ["$documentRef", ""] },
            orden_compra: { $ifNull: ["$orden_compra", ""] },
            dato_adicional: { $ifNull: ["$dato_adicional", ""] },



        }
    },
    {
        $unwind: {
            path: "$historial_wf",
            preserveNullAndEmptyArrays: true
        }
    },

    {
        $addFields: {
            "historial_wf.usuarioObjectId": { $toObjectId: "$historial_wf.usuario" }
        }
    },
    {
        $lookup: {
            from: "usuarios",
            localField: "historial_wf.usuarioObjectId",
            foreignField: "_id",
            as: "historial_wf.usuarioInfo"
        }
    },
    {
        $unwind: {
            path: "$historial_wf.usuarioInfo",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $addFields: {
            "historial_wf.usuario": "$historial_wf.usuarioInfo.nombre"

        }
    },
    {
        $addFields: {
            workflowObjectId: { $toObjectId: "$workflow" }
        }
    },
    {
        $lookup: {
            from: "clientes",
            let: { wf_id: "$workflowObjectId" },
            pipeline: [
                { $unwind: "$workflows" },
                { $match: { $expr: { $eq: ["$workflows._id", "$$wf_id"] } } },
                { $project: { workflowTitulo: "$workflows.titulo", _id: 0 } }
            ],
            as: "workflowInfo"
        }
    },
    {
        $unwind: {
            path: "$workflowInfo",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $addFields: {
            workflowTitulo: "$workflowInfo.workflowTitulo"
        }
    },
    {
        $addFields: {
            workflowTitulo: { $ifNull: ["$workflowTitulo", "No Asignado"] },

        }
    },

    {
        $group: {
            _id: "$_id",
            usuarios: { $first: "$usuariosNombres" },
            historial_wf: { $push: "$historial_wf" },
            workflowTitulo: { $first: "$workflowTitulo" },
            razon_social_receptor: { $first: "$receptorInfo.nombre_identificacion" },
            razon_social_emisor: { $first: "$emisorInfo.nombre_identificacion" },
            emisor_id: { $first: "$emisor_id" },
            numeral: { $first: "$numeral" },
            sub_total: { $first: "$sub_total" },
            valor_total: { $first: "$valor_total" },
            created_at: { $first: "$created_at" },
            fecha_emision: { $first: "$fecha_emision" },
            orden_compra: { $first: "$orden_compra" },
            dato_adicional: { $first: "$dato_adicional" },
            nit_emisor: { $first: "$emisorInfo.identificacion" },
            formaPago: {
                $first: {
                    $cond: {
                        if: { $eq: ["$formaPago", "2"] },
                        then: "Pago a Crédito",
                        else: "Pago a Contado"
                    }
                }
            },
            tipo_documento: { $first: "$tipo_documento" },
            estado: { $first: "$estado" },

            documentRef: { $first: "$documentRef" }
        }
    },
    {
        $project: {
            workflowTitulo: 1,
            usuarios: {
                $cond: [
                    { $isArray: "$usuarios" },
                    {
                        $cond: [
                            { $eq: ["$usuarios", []] },
                            "No Asignado",
                            {
                                $reduce: {
                                    input: "$usuarios",
                                    initialValue: "",
                                    in: {
                                        $concat: [
                                            "$$value",
                                            {
                                                $cond: [
                                                    { $eq: ["$$value", ""] },
                                                    "",
                                                    ", " // este es el separador entre los nombres
                                                ]
                                            },
                                            "$$this"
                                        ]
                                    }
                                }
                            }
                        ]
                    },
                    ""
                ]
            },
            razon_social_receptor: 1,
            razon_social_emisor: 1,
            emisor_id: 1,
            numeral: 1,
            sub_total: 1,
            valor_total: 1,
            created_at: 1,
            fecha_emision: 1,
            orden_compra: 1,
            dato_adicional: 1,
            nit_emisor: 1,
            formaPago: 1,
            tipo_documento: 1,
            estado: 1,
            documentRef: 1,
            historial_wf: {
                $map: {
                    input: "$historial_wf",
                    as: "historialItem",
                    in: {
                        Usuario: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: [{ $ifNull: ["$$historialItem.accion", false] }, false] },
                                        { $eq: [{ $ifNull: ["$$historialItem.usuario", false] }, false] }
                                    ]
                                },
                                "$$REMOVE", // No incluir si no hay 'accion' ni 'usuario'
                                { $ifNull: ["$$historialItem.usuario", "Automatico"] }
                            ]
                        },
                        Accion: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$$historialItem.accion", "evento030"] }, then: "Acuse del Recibo" },
                                    { case: { $eq: ["$$historialItem.accion", "evento032"] }, then: "Aceptación Bien/Servicio" },
                                    { case: { $eq: ["$$historialItem.accion", "evento031"] }, then: "Reclamo" },
                                    { case: { $eq: ["$$historialItem.accion", "evento033"] }, then: "Aceptación Expresa" }
                                ],
                                default: "$$historialItem.accion"
                            }
                        },
                        Fecha: "$$historialItem.created_at"
                    }
                }
            },

        }
    }
];


const empresaBodytech = [
    {
        $match: {
            estado: 2,
            created_at: {
                $gte: new Date("2024-02-21T00:00:00-05:00"),
                $lte: new Date("2024-02-21T23:59:59-05:00")
            }
        }
    },
    {
        $addFields: {
            emisorObjectId: { $toObjectId: "$emisor_id" }
        }
    },
    {
        $lookup: {
            from: "clientes",
            localField: "emisorObjectId",
            foreignField: "_id",
            as: "clienteInfo"
        }
    },
    {
        $unwind: {
            path: "$clienteInfo",
            preserveNullAndEmptyArrays: true  // Preserva los documentos sin coincidencias
        }
    },
    {
        $group: {
            _id: "$emisorObjectId",
            razon_social: { $first: "$clienteInfo.nombre_identificacion" },
            nit: { $first: "$clienteInfo.identificacion" },
            totalDocumentos_autorizados: { $sum: 1 }
        }
    },
    {
        $match: {
            _id: {
                $in: [
                    new ObjectId("5dc19bbb745ded0e54558bf8"), //Bodytech
                    new ObjectId("5daa37133d260c05363220ea"), //Inverdesa
                    new ObjectId("613b8a03d21eb0313d246f4d"), //incite
                    new ObjectId("5db32e17aa46a10537614676") //fitnesMarket
                ]
            }
        }
    },
    {
        $sort: {
            totalDocumentos_autorizados: -1
        }
    }
]

const adquirenteNoEventos = [
    {
        $match: {
            tipo_documento: "01",
            formaPago: "2",
            estado: 2,
            acuse_recibo: false,
            emisor_id: "5d795c8100679c723a736637",
            created_at: {
                $gte: new Date("2022-07-13T00:00:00-05:00"),
                $lte: new Date("2023-11-01T23:59:59-05:00")
            }
        }
    },
    {
        $addFields: {
            receptorObjectId: { $toObjectId: "$receptor_id" }
        }
    },
    {
        $lookup: {
            from: "clientes",
            localField: "receptorObjectId",
            foreignField: "_id",
            as: "clienteInfo"
        }
    },
    {
        $unwind: "$clienteInfo"
    },
    {
        $group: {
            _id: "$clienteInfo._id",
            razon_social: { $first: "$clienteInfo.nombre_identificacion" },
            nombre_comercial: { $first: "$clienteInfo.nombre_comercial" },
            nit: { $first: "$clienteInfo.identificacion" },
            email: { $first: "$clienteInfo.email" },
            telefono: { $first: "$clienteInfo.telefono" },
            municipio: { $first: "$clienteInfo.municipio" },
            direccion: { $first: "$clienteInfo.dir_matriz" },
            documentosSinEventos: { $sum: 1 }
        }
    },
    {
        $sort: {
            documentosSinEventos: -1
        }
    },
    { $limit: 3 },

    {
        $project: {
            _id: 0,
            razon_social: 1,
            nombre_comercial: 1,
            nit: 1,
            email: 1,
            telefono: 1,
            municipio: 1,
            direccion: 1,
            documentosSinEventos: 1
        }
    }
]


const clientesEstupendo = [
    {
        $match: {
            roles: {
                $in: ["ComPagos", "Emisor", "Nomina", "Race", "Soporte"]
            },
            esActivo: false

        }
    },

    {
        $project: {
            nombre_identificacion: 1,
            identificacion: 1,
            roles: 1,
            email: 1,
            municipio: 1,
            telefono: 1,
            dir_matriz: 1,
        }
    }
]

const bolsaConjuntoTrue = [
    {
        $match: {
            contrato: { $exists: true },
            "contrato.id_holding": { $exists: true },
            "contrato.conjunto": "true",
            "esActivo": true
        }
    },
    {
        $addFields: {
            planExpedicionDate: {
                $toDate: "$contrato.planExpedicion"
            },
            contratados: "$contrato.contratados",
            restantes: "$contrato.cantidad",
            consumidos: "$contrato.consumidos"
        }
    },
    {
        $project: {
            identificacion: 1,
            nombre_identificacion: 1,
            contratados: 1,
            restantes: 1,
            consumidos: 1,
            contrato: {
                $cond: {
                    if: { $gte: ["$planExpedicionDate", new Date()] },
                    then: "Vigente",
                    else: "Expirado"
                }
            },
            planExpedicionDate: 1,


        }
    }
]


const bolsaConjuntoFalse = [

]


// generarReporte(query, "documentos",generarAutorizados )
// generarReporte(eventos, "clientes", generarEventos)
// generarReporte(nomina, "documentos_nomina", generarNomina)
// generarReporte(recepcion, "documentos_rec", generarRecepcion)
// generarReporte(rechazados, "documentos", generarRechazados)

//generarReporte(recepcionadosPerencos, "documentos_rec", generarRecepcionPerenco)
 generarReporte(empresaBodytech, "documentos", generarEmpresasBodytech)
// generarReporte(adquirenteNoEventos, "documentos", adquirentesSinEventos )

// generarReporte(clientesEstupendo, "clientes", generarClientesEstupendo)






