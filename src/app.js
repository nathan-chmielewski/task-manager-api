// Set up express application and export app
// This allows access to express app without starting up server with app.listen
// to be able to access express app for testing purposes w/o running server
const express = require('express')
// Run mongoose.js file - nothing is being exported from the file so no var created to store ref
// Connects mongoose to the database
require('./db/mongoose')
// Import User router
const userRouter = require('./routers/user')
// Import Task router
const taskRouter = require('./routers/task')
// Create new express application
const app = express()

 // Configure express to automatically parse data from HTTP request body to js object
app.use(express.json())

// Register imported routers with app so that it can be used
app.use(userRouter) 
app.use(taskRouter)

// Export express app
module.exports = app