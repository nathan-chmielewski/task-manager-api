// Set up database for testing
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../../src/models/user')
const Task = require('../../src/models/task')

// Create user
// Create db ObjectId using mongoose
const userOneObjectId = new mongoose.Types.ObjectId()

// Create user to test other endpoints after create user
// Create jwt auth token in tokens array
const userOne = {
    _id: userOneObjectId,
    name: 'Bob Belcher',
    email: 'bob@bobsburgers.com',
    password: 'burgerOfTheDay',
    tokens: [{
        token: jwt.sign({
            id: userOneObjectId 
        }, process.env.JWT_SECRET)
    }]
}

const userTwoObjectId = new mongoose.Types.ObjectId()

const userTwo = {
    _id: userTwoObjectId,
    name: 'Linda Belcher',
    email: 'linda@bobsburgers.com',
    password: 'ilovetosinglala',
    tokens: [{
        token: jwt.sign({
            id: userTwoObjectId
        }, process.env.JWT_SECRET)
    }]
}

const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    description: 'First test task',
    completed: false,
    owner: userOneObjectId
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Second test task',
    completed: true,
    owner: userOneObjectId
}

const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Third test task',
    completed: false,
    owner: userTwoObjectId
}

const setupDatabase = async () => {
    // Delete all users from database - async function
    await User.deleteMany()
    await Task.deleteMany()

    // Create new User instances and save users to test db
    await new User(userOne).save()
    await new User(userTwo).save()

    // Create new Task instances and save tasks to test db
    await new Task(taskOne).save()
    await new Task(taskTwo).save()
    await new Task(taskThree).save()
}

module.exports = {
    userOneObjectId,
    userOne,
    userTwoObjectId,
    userTwo,
    taskOne,
    setupDatabase
}