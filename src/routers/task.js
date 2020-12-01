const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const { request } = require('express')

const taskRouter = new express.Router()

// Task(resource) creation endpoint
taskRouter.post('/tasks', auth, async (req, res) => {
    // retrieve js object of json data sent from http request
    // express parses it

    // create new task instance using req body
    const task = new Task({
        // ES6 spread operator to copy all req.body properties to this object
        ...req.body,
        // Owner is authenticated user's _id property
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }

    /*
    // Create task doc in db
    task.save().then((result) => {
        // send back task as json data
        // result is the new task created, could just use task here
        res.status(201)
        res.send(result)
    }).catch((error) => {
        // Bad request
        res.status(400)
        res.send(error)
    })
    */
})

// Read all tasks
// Requires authentication

// Filter options using query string
// GET /tasks?completed=true or false, or not provided
// Retrieve query from req.query.completed property

// Pagination options: limit, skip
// Limit allows us to limit the num of results sent for any given request 
// Skip allows you to iterate over pages
// GET /tasks?limit=10&skip=0 <-- first 10 results
// Setting skip=10 provides the 2nd 10 results, skipping the first 10 results

// Sort options: field to sort by, and order (asc, or desc)
// GET /tasks?sortBy=createdAt_asc
taskRouter.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    // If query string 'completed' provided, assign match.completed property
    // If no query string provided, match object empty, returns all tasks
    if (req.query.completed) {
        // Set match object property 'completed' to true if query 'true' string
        // provided, or will be assigned false Boolean
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const splitQuery = req.query.sortBy.split('_')
        // console.log(par)
        // Set sort property - name of field is first val in parts
        // Set field value to asc or desc based second val in parts
        sort[splitQuery[0]] = splitQuery[1] === 'asc' ? 1 : -1
    }

    try {
        // Return all tasks only created by the authenticated user
        // Populate virtual property
        // Fetch all tasks created by this user and store them
        // in an array of Task objects on the user.tasks property

        // Populate the user virtual property 'tasks' and send 
        // the property back
        // specifying which tasks to populate by defining match object properties

        // Mongoose document method populate() 
        // Converts owner property from id of owner to entire User profile
        // Populate data from a relationship - pass in property name as string
        // This will find the user associated with this task, and task.owner
        // will be the entire user document instead of just the user _id

        await req.user.populate({
            path: 'tasks',
            // Match options object - define field .completed true or false
            match,
            options: {
                // If limit/skip value provided in query, set limit/skip
                // If limit/skip value provided is NAN or DNE, js will just ignore it
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                // Sort options object - define field to sort by and order (1 or -1)
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)

        // OR find all tasks with owner === user._id
        // and send tasks array back        
        // const tasks = await Task.find({
        //     owner: req.user._id
        // })
        // res.send(tasks)
    } catch(e) {
        res.send(500).send(e)
    }

    /*
    Task.find({}).then((tasks) => {
        res.send(tasks)
    }).catch((error) => {
        // Internal server error
        res.status(500).send()
    })
    */
})

// Read single task using id route parameter
// Requires authentication
taskRouter.get('/tasks/:id', auth, async (req, res) => {

    // get id from route param
    // const id = req.params.id

    try {
        // const task = await Task.findById(id)

        // Find task using task id passed in with request and 
        // authenticated user's id as owner 
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })

        // If task does not exist or owner does not match authenticated user
        // return 404
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }

    /*
    // find using id
    Task.findById(id).then((task) => {
        if (!task) {
            // Bad request, no task found for id
            return res.status(404).send()
        }

        // Return task
        res.send(task)

    }).catch((error) => {
        // Internal server error
        res.status(500).send()
    })
    */
})

// Task update route handler
// Requires authentication
taskRouter.patch('/tasks/:id', auth, async (req, res) => {
    // Catch invalid property type update
    const updates = Object.keys(req.body)
    const validUpdates = ['description', 'completed']

    const isValidOperation = updates.every((update) => {
        return validUpdates.includes(update)
    })

    // send response if invalid operation
    if (!isValidOperation) {
        return res.status(400).send('Error: Invalid property update.')
    }

    try {
        // findByIdAndUpdate() bypasses mongoose validators and middleware
        // replace with findById() then save()
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
        //     new: true,
        //     runValidators: true
        // })

        // Find task by id and owner (user _id)
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })

        // No task with that id found, or authenticated user is not the owner
        if (!task) {
            return res.status(404).send()
        }

        // Update task fields that have been sent via req body
        // Dynamic, may be different each call
        updates.forEach((update) => {
            task[update] = req.body[update]
        })

        await task.save()

        // task found and updated
        res.send(task)
    } catch (e) {
        // Internal server error or validator error
        res.status(400).send(e)
    }
})

// Delete task route handler
// Requires authentication
taskRouter.delete('/tasks/:id', auth, async (req, res) => {

    try {
        // Attempt to delete task by id using req.params id passed in
        // and owner, the authenticated user _id
        // If Promise fulfilled - task found, returned as value and deleted
        // If rejected - no task found in db
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id
        })

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)

    } catch (e) {
        // Internal server error
        res.status(500).send(e)
    }
}) 

module.exports = taskRouter