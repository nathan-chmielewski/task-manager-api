const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
// Use ES6 destructuring to import sendWelcomeEmail fn from 
// object being exported in account
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')

const userRouter = new express.Router()

// Setting up multiple express routers and combining them to make up the complete application
// One new router for User-related routes
// Separate new router for Task-related routes
// Create a new router -> Setup routes -> Register with app
// Customize router using router methods

// Route handlers
// Express provides methods for HTTP methods to perform CRUD ops
// .get, .post, .patch, .delete
// which take path, and callback args
// Callback runs when particular route is accessed
// Callback args are request and response from HTTP request 
// POST request used to create a new user

// REST api route for creating a new user
// User (resource) creation endpoint
userRouter.post('/users', async (req, res) => {
    // retrieve json data sent from http request
    // express parses it after configuring from app.use(...) call above

    // Create new user using json data from request body
    const user = new User(req.body)

    // Handle individual errors from individual Promises
    // using try catch block
    try {
        // Save new user in db
        await user.save()
        // Send welcome email to new user using email, name already validated 
        // from user creation
        // Async function call
        // No need to use await - we don't need node to wait for the sendgrid server
        // to send a response back before continuing to send 201
        sendWelcomeEmail(user.email, user.name)
        // Create and save auth token for new user- as they should be logged in after signing up
        // generateAuthToken() is an asynch function - required await keyword
        const token = await user.generateAuthToken()

        // Everything after await call runs if Promise from save() call
        // above is fulfilled 
        // If save promise is rejected, catch block will run
        // Send back newly created user
        res.status(201)
        // Send back user public profile
        res.send({
            user,
            token
        }) 
    } catch(e) {
        // Send bad request
        res.status(400).send(e)
    }

    /*
    // Create user doc in database
    user.save().then((result) => {
        // If fulfilled, send back user as json data
        res.status(201)
       res.send(result)
    }).catch((error) => {
       // Set status to 400 - Bad Request
       res.status(400)
       // Send error response
       res.send(error)
    })
    */
})

// Route handler endpoint for user login
// Login sends back authentication token for HTTP requests
// to use for further requests that require authentication
// using json web token (JWT)
userRouter.post('/users/login', async (req, res) => {
    // Find user by email and password

    try {
        // Call static method on User to check login credentials, returns Promise 
        const user = await User.findByCredentials(req.body.email, req.body.password)
        // Call user method to generate authentication token
        const token = await user.generateAuthToken()

        // Send back object with user data and jwt token
        res.send({
            user,
            token
        })

    } catch (e) {
        res.status(400).send(e)
    }
})

// Logout route handler - requires authentication
userRouter.post('/users/logout', auth, async (req, res) => {
    // Retrieve token from this login authentication
    // We want the token from this request so that if the user
    // is logged into many devices, they log out of this specific device

    // We have access to user and token that were added to req
    // from auth
    // Remove given token from user's tokens array
    try {
        // Using filter method, return true to include all tokens
        // that do not equal token used in this auth
        req.user.tokens = req.user.tokens.filter((token) => {
            return req.token !== token.token
        })
        // Update user tokens array in db
        await req.user.save()
        res.send()
        // res.send('User logged out.')

    } catch (e) {
        // Internal server error
        res.status(500).send({
            error: e
        })
    }
})

// Route handler for user to log out of all logged in sessions
// Requires authentication
userRouter.post('/users/logoutall', auth, async (req, res) => {
    try {
        // Delete all tokens assigned to user tokens array
        req.user.tokens = []
        await req.user.save()
        res.send()
        // res.send('User logged out of all sessions.')
        
    } catch (e) {
        // Internal server error
        res.status(500).send({
            error: e
        })
    }
})

// Read multiple users
// Pass in auth middleware function as 2nd arg
// to run before running route handler
userRouter.get('/users/me', auth, async (req, res) => {

    // Send back user profile
    res.send(req.user)
})

/*
// Read individual user by id
// id is dynamic value, capture using Route parameter
userRouter.get('/users/:id', async (req, res) => {
    // req gives access to parameters through .params object
    // to extract route parameter id
    const id = req.params.id

    // Async version of below
    try {
        const user = await User.findById(id)
        if (!user) {
            return res.status(404).send()
        }

        res.send(user)

    } catch(e) {
        res.status(500).send()
    }

    // Mongoose automatically converts string id from param into ObjectID object for mongodb
    User.findById(id).then((user) => {
        // No user exists in db with that id, send back 404
        if (!user) {
            res.status(404)
            return res.send()
        }

        // User found, send back user
        res.send(user)

    }).catch((error) => {
        // Internal server error, unable to perform find operation 
        res.status(500)
        res.send()
    })
})
*/

// Update user route handler for user to update their profile
// Requires authentication
userRouter.patch('/users/me', auth, async (req, res) => {

    // Call Object.keys(...) to return array of strings of properties
    // in req.body object
    const updates = Object.keys(req.body)
    // Define array of allowable fields that can be updated in each document
    const validUpdates = ['name', 'age', 'email', 'password']

    // Ensure all strings in updates array is found in allowedUpdates array
    // To catch an update call on fields that don't exist in document
    // Check validation using array every() function which takes a callback
    // which is called on every item in the array
    // .every() returns true if every callback returns true, else returns false
    const isValidOperation = updates.every((update) => {
        return validUpdates.includes(update)
    })

    if (!isValidOperation) {
        // req.body contains properties that are not allowed to be updated 
        // This whole thing isn't really necessary, it just gives the user
        // a readable error.
        // You already can't update properties that don't exist in the document
        return res.status(400).send('Error: Invalid properties to update.')
    }
    // Get user document and update fields via http request body
    try {
        // findByIDAndUpdate takes user doc id passed in req parameter,
        // user doc updated data passed from request body
        // and optional options

        // findByIDAndUpdate() BYPASSES Mongoose - this is why we had to set runValidators
        // Therefore, this will bypass any Mongoose Middleware that is set up
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        //     // Return updated user doc
        //     new: true,
        //     // Run validators on updated user doc based on User model
        //     runValidators: true
        // })

        // No longer need to fetch user, it is attached to req.user
        // from auth
        // const user = await User.findById(req.params.id)

        // If no user with id found - send 404 bad request error
        // if (!user) {
        //     return res.status(404).send()
        // }

        // Iterate over updates array to apply updates bc it could be a different
        // set updates every time.
        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })

        // save() updates the document, and executes any Mongoose
        // validation and middleware
        await req.user.save()

        res.send(req.user)

    } catch (e) {
        // Error may be internal server error - unable to connect to db
        // Error may also be validation related issue
        res.status(400).send(e)
    }


})

// Delete (resource) endpoint for user to remove themselves
userRouter.delete('/users/me', auth, async (req, res) => {

    try {
        // No longer need to find user by ID as auth will attach
        // user property to req
        // Delete user using id passed in from req.params
        // If Promise fulfilled - user found, send user deleted
        // If Promise rejected - no user found
        // const user = await User.findByIdAndDelete(req.user.id)

        // if (!user) {
        //     return res.status(404).send('No user found to delete.')
        // }

        // Mongoose document method remove() to remove user document from db
        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(req.user)

    } catch (e) {
        // Internal server error
        res.status(500).send(e)
    }

})


// POST Endpoint route handler for uploading a profile image
// The type of data that we're sending is form-data body, not json body
// that is why we need separate request from updating user profile
// using instance of multer 
const upload = new multer({
    // name for folder to store profile images
    // dest: 'avatars',
    limits: {
        fileSize: 1_000_000
    },
    // Validator
    fileFilter(req, file, cb) {
        
        // Call .match on file original name to check that file extension
        // that is attempting to be uploaded by client is a jpg, jpeg, or png
        // using .match with regex arg
        // If not an appropriate extension, send error via callback
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload jpeg, jpg, or png image file', false))
        }

        // Accept image file from client to execute route handler
        cb(undefined, true)
    }
})

// Post endpoint for user uploading an avatar (Create, Update)
// Requires authentication
// Register middleware multer .single() method with key - name of file 
// being sent via request body
// Define function as second arg to handle uncaught errors thrown by multer
// middleware when a file is too large or the wrong type
userRouter.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    // When not providing dest property with dir name value in multer object upload above,
    // file is available via req.file property here
    // file.buffer contains binary data of file
    // Use sharp npm module to normalize image being uploaded by client:
    // resize file, and set extension to png
    // req.user.avatar = req.file.buffer
    // sharp is async, must use await
    // Pass buffer data to sharp, and use .toBuffer() method to store returned data from sharp
    // as buffer data to store in buffer const
    // use .resize() to resize image, passing in object with width, height properties 
    // use .png() on returned value to convert to png
    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer()

    // Save buffer binary data of image returned from sharp to db
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    // Error occurred in multer middleware
    // send back error message as json
    // Defining this function to catch middleware errors replaces the html
    // that was being sent for uncaught errors 
    res.status(400).send({
        error: error.message
    })
})

// Delete endpoint route handler for user deleting an avatar (Delete)
// Requires authentication
userRouter.delete('/users/me/avatar', auth, async (req, res) => {
    // Remove user avatar image from db if it exists
    if (!req.user.avatar) {
        return res.status(400).send()
    }

    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

// Get endpoint route handler for retrieving avatar image by user id (Read)
// route URL (localhost:3000/users/[id]/avatar) can be used to view user avatar by id, or via an html image tag
userRouter.get('/users/:id/avatar', async (req, res) => {
    
    // try / catch block if image cannot be found
    try {
        // Search for image by user id
        // First retrieve user by id parameter passed in via request body
        const user = await User.findById(req.params.id)
        // No user found, or user does not have an avatar
        if (!user || !user.avatar) {
            // Send 404 via catch block
            throw new Error('User or image data not found')
        }

        // user with image found
        // Send back image data with header of type of image
        
        // Set response header - .set takes key value pair, the name of response
        // header and value to set it to, Content-Type image/jpg
        // When we do not set a header and send json back, express automatically sets header
        // with 'Content-Type', 'application/json'
        res.set('Content-Type', 'image/png')
        // send back data
        res.send(user.avatar)
        
    } catch (e) {
        // Image not found
        res.status(404).send({
            error: e.message
        })
    }
})

module.exports = userRouter