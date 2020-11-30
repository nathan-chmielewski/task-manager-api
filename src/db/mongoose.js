// Mongoose - object data modeling library to enforce data structure in mongodb
const mongoose = require('mongoose')
// Validator npm library to validate document fields 
// const validator = require('validator')

// Mongoose uses mongodb library behind the scenes
// So everything in mongodb.js is relevant
// create connection URL, and specify database name as part of string 
// const connectionURL = 'mongodb://127.0.0.1:27017/task-manager-api'

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    // When mongoose works with mongodb, indeces are created to quickly access data
    // Set to true
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

/*

// User model
// Takes two args, name of model as String, second arg is fields with properties
// defined for the field, e.g. type
// Mongoose takes the name of the model, lowercased and pluralized, using that
// name as a new collection name in MongoDB
const User = mongoose.model('User', {
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
        type: 'String',
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            // Must set value toLowercase() or Password with capital P would pass validator
            if (value.toLowercase().includes('password')) {
                throw new Error('Password field invalid. Password must contain at least 7 characters and may not include the phrase \'password\'')
            }
        }
    } 
})


// Create instanses of the model
const user = new User({
    name: '    Nathan    ',
    email: '   NATHANCH@ME.COM   ',
    password: '1234pwpw'
})

// Use methods on instance to save to database
// .save() returns a promise
user.save().then(() => {
    console.log(user)
}).catch((error) => {
    // The error is a validation object of what went wrong
    // Base level validation from Mongoose
    console.log('Error occurred saving user to database.', error)
})




// Create Task model
const Task = mongoose.model('Task', {
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    }
})



// Create Task instance
const task = new Task({
    description: '             Take vitamins',
    // completed: false
})

// Insert task instance to database
task.save().then(() => {
    console.log(task)
}).catch((error) => {
    console.log('Error occurred saving task to database', error)
})

*/