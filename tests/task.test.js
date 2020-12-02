// Testing task-related functionality
// Import supertest, express app, Test model
const request = require('supertest')
const Task = require('../src/models/task')
const app = require('../src/app')
const { 
    userOne, 
    userTwo, 
    taskOne, 
    setupDatabase 
} = require('./fixtures/db')

// Define Jest global function that runs before each test case
// to setup the db
beforeEach(setupDatabase)

// Test successful create task
test('Should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'From jest test'
        })
        .expect(201)
    
    // Test that task is found in db
    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    // Test that task .completed property is default set to false
    expect(task.completed).toBe(false)
})

// Test successful get tasks for userOne
test('Should fetch all userOne tasks', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.length).toEqual(2)
})

// Test unsuccessful userTwo delete one of userOne's tasks
test('Should not delete unauthorized task', async () => {
    await request(app) 
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)

    // Check that task is still in test db
    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})

//
// Task Test Ideas
//
// Should not create task with invalid description/completed
// Should not update task with invalid description/completed
// Should delete user task
// Should not delete task if unauthenticated
// Should not update other users task
// Should fetch user task by id
// Should not fetch user task by id if unauthenticated
// Should not fetch other users task by id
// Should fetch only completed tasks
// Should fetch only incomplete tasks
// Should sort tasks by description/completed/createdAt/updatedAt
// Should fetch page of tasks