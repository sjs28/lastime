let express = require('express');
let { ObjectId } = require('mongodb');
let { format } = require('date-and-time');
let store = require('../modules/store')

const DATEFORMAT = 'YYYY-MM-DD';

var router = express.Router();

//////// CORE ////////
router.get('/', function (req, res) {
    res.status(200).send("No content");
})

//////// TASKS ////////
//#region Tasks
router.get('/tasks', async function (req, res) {
    //get list of tasks
    let dt = new Date();
    let q = {
        "status": { "$nin": ["archived"] }
    };


    if (req.query.search) {
        q.$text = { "$search": req.query.search };
    }

    let tasks = await store.queryRecords('tasks', q, { "lastDone": 1 })
    res.status(200).send(JSON.stringify(tasks));
})

router.post('/tasks/create', async function (req, res) {
    //Create a new task
    //Validate iputs
    let task = req.body.task;
    try {
        if (!task.title) {
            throw new Error("Missing data!");
        }

    } catch (e) {
        res.status(400).send(e.Error)
        return;
    }

    //Insert
    await store.insertRecord('tasks', task);

    //Respond
    res.status(200).send('Success')
})

router.post('/tasks/update', async function (req, res) {
    //Update a task
    let input = req.body;
    let query = { _id: new ObjectId(req.body.id) };
    let update = { $set: {} };
    if (input.complete) {
        //Task has been done
        let task = await store.queryRecords('tasks', query);
        let done = format(new Date(), DATEFORMAT);
        update.$set.lastDone = done
        let history;
        if (task.hasOwnProperty("history") && task.history.length > 0){
            history = task.history;
        }else{
            history = [];
        }
        history.push(done);
        update.$set.history = history;

    }

    if (input.archive) {
        //Simple archiving, probably need a cleanup job to move to another collection - TODO
        update.$set.status = "archived";
        update.$set.archivedOn = format(new Date(), DATEFORMAT);
    }

    if (input.edit) {
        //Take the raw edits from the UI and push into DB. Probably want to validate some stuff or do permissions... TODO
        update.$set = input.item;
    }

    let result = await store.updateOneRecord('tasks', query, update);
    res.status(200).send('Success');
})
//#endregion

//////// USERS ////////
//#region Users
router.get('/users', async function (req, res, next) {
    let users = await store.queryRecords('users', {});
    let result = [];
    if (users.length) {
        users.forEach(function (user) {
            result.push(user.displayName);
        })
    }

    res.status(200).send(JSON.stringify(result));
})

//#endregion

//#region Processors
async function runBgUpdate() {
    //Here for potential future use
}
//#endregion

//Exports
module.exports = { router, runBgUpdate };