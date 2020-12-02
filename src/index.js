// Import express app from app.js and start server
const app = require('./app')

// Heroku port - access via environment variable value
// dev.env defines environment variables on dev run
const port = process.env.PORT // || 3000 provided by env-cmd defined in dev.env locally

// Start up the server
// optional callback arg - runs when server is up and running
// Running server is an asynch process
app.listen(port, () => { 
    console.log('Server is up on port: ' + port)
})
