const mongoose = require('mongoose')


// Create Task schema and
// Enable timestamps option
const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    // Store id of user who created it
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // Store reference to mongoose User model
        ref: 'User'
    }
}, {
    timestamps: true
})

// Create Task model
const Task = mongoose.model('Task', taskSchema)

// Export Task
module.exports = Task