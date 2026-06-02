let { MongoClient, ObjectId } = require('mongodb');
let { Sema } = require('async-sema');

let dbname = "lastime";
let sem = new Sema(1);

//Mongodb
const uri = process.env.MONGO_CONN_STR;
let client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
initDB();

async function initDB(){
    await sem.acquire()
    let results = false;
    try {
        await client.connect();
        let db = client.db(dbname);
        let coll = db.collection("tasks");
        await coll.createIndex({title: "text"});
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await client.close();
        sem.release();
        return results;
    }
}

//#region Database Helpers
/**
 * 
 * @param {string} collection - Name of the collection to query
 * @param {object} query - Object with a mongodb query structure
 * @param {object} [sort] - Object denoting sort order 
 * @param {number} [limit=null] - Limit the number of records returned
 * @returns {Array} - Array of records from collection
 */
async function queryRecords(collection, query, sort = null, limit = null) {
    await sem.acquire()
    let results = false;
    try {
        await client.connect();
        let db = client.db(dbname);
        let coll = db.collection(collection);
        if (!sort) {
            results = await coll.find(query).toArray();
        } else {
            if (!limit) {
                results = await coll.find(query).sort(sort).toArray();
            } else {
                results = await coll.find(query).sort(sort).limit(limit).toArray();
            }

        }

    }
    catch (e) {
        console.log(e);
    }
    finally {
        await client.close();
        sem.release();
        return results;
    }
}

/**
 * 
 * @param {string} collection - Name of the collection to query
 * @param {object} agg - Mongodb aggregation object 
 * @returns 
 */
async function aggregateRecords(collection, agg) {
    await sem.acquire()
    let results = false;
    try {
        await client.connect();
        let db = client.db(dbname);
        let coll = db.collection(collection);
        results = await coll.aggregate(agg).toArray();
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await client.close();
        sem.release();
        return results;
    }
}

/**
 * 
 * @param {string} collection - Name of the collection to query
 * @param {string} field - Name of the field to get distinct values from
 * @param {object} [query] - An optional query object
 * @returns 
 */
async function getDistinct(collection, field, query = {}) {
    await sem.acquire();
    let results = false;
    try {
        await client.connect();
        let db = client.db(dbname);
        let coll = db.collection(collection);
        results = await coll.distinct(field, query);
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await client.close();
        sem.release();
        return results;
    }
}

/**
 * 
 * @param {string} collection - The name of the collection to insert into 
 * @param {object} object - The JSON object to insert
 * @returns 
 */
async function insertRecord(collection, object) {
    await sem.acquire();
    let results = false;
    try {
        await client.connect();
        let db = client.db(dbname);
        let coll = db.collection(collection);
        await coll.insertOne(object);
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await client.close();
        sem.release();
        return results;
    }
}

/**
 * 
 * @param {string} collection - The name of the collection to work on
 * @param {object} query - Filter query to select the record to update
 * @param {object} update - Object with mongodb update schema
 * @param {object} [options] - Optional options object e.g. {upsert: true}
 * @returns 
 */
async function updateOneRecord(collection, query, update, options = null) {
    await sem.acquire();
    let results = false;
    try {
        await client.connect();
        let db = client.db(dbname);
        let coll = db.collection(collection);
        await coll.updateOne(query, update, options);
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await client.close();
        sem.release();
        return results;
    }
}

/**
 * 
 * @param {string} collection - The name of the collection to work in
 * @param {object} query - Filter query to select the record(s) to update
 * @param {object} update - MongoDB update schema
 * @param {object} [options] - Optional options object, e.g. {upsert: true}
 * @returns 
 */
async function updateManyRecords(collection, query, update, options = null) {
    await sem.acquire();
    let results = false;
    try {
        await client.connect();
        let db = client.db(dbname);
        let coll = db.collection(collection);
        await coll.updateMany(query, update, options);
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await client.close();
        sem.release();
        return results;
    }
}

/**
 * 
 * @param {string} collection - Name of collection to delete from
 * @param {object} query - Filter query to select record(s) for deletion
 * @returns 
 */
async function deleteRecords(collection, query, options = null) {
    await sem.acquire();
    let results = false;
    try {
        await client.connect();
        let db = client.db(dbname);
        let coll = db.collection(collection);
        await coll.deleteMany(query, options);
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await client.close();
        sem.release();
        return results;
    }
}

/**
 * 
 * @param {string} key - The name of the key-value pair to fetch the value for
 * @returns - The value (type: any)
 */
async function getKV(key) {
    try{
        let doc = await queryRecords('kv', { key: key }, {}, 1);
    let val = doc[0].value;
    return val;
    }catch (e){
        throw new Error('Key not found in key-value store!')
    }
    
}

/**
 * 
 * @param {string} key - The name of the key-value pair to set the value of
 * @param {*} value - The value to set (any type)
 * @param {string} setBy - The function or mechanism that set the value 
 */
async function setKV(key, value, setBy = null) {
    let query = {
        key: key
    };

    let update = {
        $set: {
            value: value,
            setBy: setBy,
            setAt: new Date().toISOString()
        }
    }

    updateOneRecord('kv', query, update,{upsert:true})
}


module.exports = { queryRecords, aggregateRecords, getDistinct, insertRecord, updateManyRecords, updateOneRecord, deleteRecords, getKV, setKV }