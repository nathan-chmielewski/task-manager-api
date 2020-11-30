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

// Heroku port - access via environment variable value
// dev.env defines environment variables on dev run
const port = process.env.PORT // || 3000 provided by env-cmd defined in dev.env locally

// Configure express to automatically parse data from HTTP request body to js object
app.use(express.json())

// Register imported routers with app so that it can be used
app.use(userRouter) 
app.use(taskRouter)

// Start up the server
// optional callback arg - runs when server is up and running
// Running server is an asynch process
app.listen(port, () => { 
    console.log('Server is up on port: ' + port)
})
