import { closeConnection, connect } from "./db.js"

const generarReporte = (query, collection, callback) => {
    const client = connect()
    const db = client.db("stupendo")
    db.collection(collection)
        .aggregate(query)
        .toArray()
        .then(callback)
        .catch(error => console.error(error))
        .finally(() => closeConnection(client))

}

export default generarReporte;