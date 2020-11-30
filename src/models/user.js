const mongoose = require('mongoose')
// Validator npm library to validate document fields 
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

// Define User schema, and specify schema options
const userSchema = new mongoose.Schema({
    // name field required, age field optional
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        // Set default age value to field
        default: 0,
        // Define validator function, with arg value to validate
        validate(value) {
            // Throw error if problem with value
            if (value < 0) {
                throw new Error('Age must be a nonnegative number.')
            }
        }
    },
    email: {
        // Guarantee that user email is unique
        // Creates index in db to guarantee uniqueness
        unique: true,
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            // If .isEmail() fails, throw error
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email address provided.')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            // Must set value toLowercase() or Password with capital P would pass validator
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password field invalid. Password must contain at least 7 characters and may not include the phrase \'password\'')
            }
        }
    },
    // Array of objects with token property
    tokens : [{
        token: {
            type: String,
            required: true
        }
    }],
    // Avatar image property stores buffer of binary image data
    // Multer handles all validation for image size/type
    avatar: {
        type: Buffer
    }  
}, {
    timestamps: true
})

// virtual property - a relationship between two entities
// Not actually changing what we store in a user document
// Just defines mongoose relationship
// 2 args - name of attribute, object to configure individual fields
userSchema.virtual('tasks', {
    // ref of Task model
    ref: 'Task',
    // Where the local data is stored - we use the owner object id on the task,
    // the user's _id
    // - The local field, the user's _id is a relationship between that and
    // the Task owner field which is also a user _id
    localField: '_id',
    // Name of the field on the Task that is going to create this relationship
    // the owner field
    foreignField: 'owner'
})

// Define instance method to generate auth token
userSchema.methods.generateAuthToken = async function () {
    // create new json web token authentication token with .sign()
    // client can use token to perform 'privileged' operations
    // sign takes two args
    // First arg is object/payload that uniquely identifies the user,
    // contains data embedded in token we need to store
    // a unique identifier for user being authenticated
    // Second arg is a 'secret' used to sign the token to ensure
    // it has not been tampered with 
    // Third arg - time until expiration
    const token = jwt.sign({
        // Store user's id from database  as UID
        // Need to call toString on _id because it is an ObjectID type
        // need String type for jwt
        id: this._id.toString()
     }, process.env.JWT_SECRET)


    // Token is made up 3 parts separated by a period
     // 1 - base-64 encoded json string header, contains meta info on type of token and algo to generate it
     // 2 - payload, or body - base-64 encoded json string containing data we provided
     // 3 - signature - used to verify the token
     // Data is verifiable via the secret signature provided that was used in algo to generate it

     // add new user token to the user's tokens array
     this.tokens.push({ token })
     // Save user to save new token to db
     await this.save()

     return token
}

// When we use res.send(...), Express calls JSON.stringify on the object
// being sent back. Defining toJSON instance method - toJSON gets called
// before the object is stringified. The object returned from toJSON
// is stringified into JSON. This allows us to define what properties of the
// object we want to expose and what properties to hide 
userSchema.methods.toJSON = function() {
    // user === this
    // Get raw object with user data - without Mongoose metadata
    const userObject = this.toObject()

    // Delete password, tokens, avatar from user object 
    // to send back user profile without this data from user doc in db
    // in order to hide private data that the user does not need
    // to be exposed to, even when logged in
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    // userObject will be stringified by Express and sent with the res.send() call 
    return userObject
}

// Define a static method to User model to check email/password for login
// Returns Promise
userSchema.statics.findByCredentials = async (email, password) => {
    
    // find user by email
    const user = await User.findOne( {
        email
    })

    // If no user found, Promise rejected
    // Keep login errors generic
    if (!user) {
        throw new Error('Unable to login.')
    }

    // Hashing vs Encryption
    // With encryption algo - you can always get the original value back
    // Hashing algos are oneway - you cannot reverse the process

    // To validate login, compare hashed pw provided on login with hashed pw stored in db
    // using bcrypt method compare()
    // Takes two args - plaintext input password, hashed pw stored in db
    // bcrypt hashes provided plaintext pw and compares to hashed pw stored in db

    // User found, verify plaintext password passed in with
    // hashed password in db accessible from user.password just found
    const verifyPassword = await bcrypt.compare(password, user.password)
    
    if (!verifyPassword) {
        throw new Error('Unable to login.')
    }

    // user found and password verified, return user
    return user
} 


// Set up a pre- middleware function on User Schema to do something 
// before an event
// Function passed in must be ES6, not an arrow (=>) bc arrow does not
// bind 'this'
// Middleware allows us to provide this definition once to be used
// both on route for user creation and route for user update
userSchema.pre('save', async function(next) {
    // this refers to value which is doc that is about to be saved
    // to be able to access user properties
    // (const user = this)

    // Get hashed password by calling hash() which returns a Promise, so use await
    // hash() takes two args, plaintext password, and number of rounds to perform
    // hashing algo
    // Hash password if password field is being modified (or will run on user creation)
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8)
    }

    // Function takes arg next - a function object that is called to 
    // signal that the function is complete. next is implemented in order
    // to be able to account for async processes that may be occurring in pre
    next()
})

// Delete user taks when user is removed from db
userSchema.pre('remove', async function(next) {

    // Delete ALL tasks owned by this user before user is removed
    await Task.deleteMany({
        owner: this._id
    })

    // Continue to route handler
    next()
})

// Define Mongoose Model using User Schema
const User = mongoose.model('User', userSchema)

module.exports = User