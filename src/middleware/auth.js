const { request } = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

// Define express app middleware function
const auth = async (req, res, next) => {
    
    // Try to authenticate user, validate token
    try {

        // Get Bearer value from req Authorization header
        // And remove 'Bearer ' from token string
        // If no token provided, catch will catch the error
        const token = req.header('Authorization').replace('Bearer ', '')

        // Check that jwt token is valid by calling .verify() and passing
        // in token and signature, will return token payload/body if verified
        // Verify token takes two args - token, secret
         // .verify returns the payload or an error
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Get user from id stored in decoded jwt payload
        // And check that token is still part of user's tokens array
        // This will look for a user with the decoded id and 
        // that has the given token value in their tokens array
        const user = await User.findOne( { 
            _id: decoded.id,
            'tokens.token': token
        })

        // If no user found with id and token, throw error
        if (!user) {
            throw new Error()
        }

        // User found, proceed to route handler
        // And give route handler access to fetched user
        // and token by adding properties to request
        request.user = user
        request.token = token
        next()

    } catch (e) {
        // Send Unauthorized status and error message
        res.status(401).send( {
            error: 'Please authenticate.'
        })
    }
    

}

// export auth function
module.exports = auth

/*
// Define express middleware function that will run between request coming
// to the server and the route handler 
// Define middleware function as argument passed to app.use(...) function
// New request -> middleware function -> denied OR route handler
// 3 args: req (HTTP request), res (response), next (func object to continue to route handler)
app.use((req, res, next) => {
    console.log(req.method, req.path)

    if (req.method === 'GET') {
        return res.send('GET request denied.')
    } else {
        next()
    }
    // Call next() to perform route handler
    // Do not call next() to deny request
})
*/