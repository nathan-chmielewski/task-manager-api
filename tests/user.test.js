// Testing user-related functionality
// Import supertest and express app
const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneObjectId, userOne, setupDatabase } = require('./fixtures/db')

// Define Jest global function that runs before each test case
beforeEach(setupDatabase)

// Define Jest global function that runs after each test case
// afterEach(() => {
// })

// Test sign up using POST /users
test('Should sign up new user', async () => {
    // Call supertest, passing in app, to send things off to endpoint,
    // and using methods to specify request 
    // to pass valid data in body of request
    // user .send method to send object in request body
    // .expect to expect 201 status code
    // Store response in response const to have access to user profile, token
    // returned from router
    const response = await request(app).post('/users').send({
        name: 'Nathan',
        age: 32,
        email: 'nathanch@me.com',
        password: 'myapp123!'
    }).expect(201)

    // Find user in response, assert it is not null
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assert response body contains user object with matching name, email, and token
    expect(response.body).toMatchObject({
        user: {
            name: 'Nathan',
            email: 'nathanch@me.com'
        },
        token: user.tokens[0].token
    })

    // Assert plain text password is not stored in db
    expect(user.password).not.toBe('myapp123!')
})

// Test successful login
test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    // Assert token added to user tokens array in db matches response token returned
    // This is user's second token - first token created when userOne instantiated above
    const user = await User.findById(userOneObjectId)
    expect(user.tokens[1].token).toBe(response.body.token)

})

// Test unsuccessful login with nonexistent user
test('Should not login nonexistent user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: 'notauserpw'
    }).expect(400)
})

// Test get user profile
// Set Authorization in header with Bearer string and token we created in userOne object above
// Using .set to set the header
test('Should get profile of user', async () => {
    const response = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

// Test not get user profile when user is unauthenticated
// Expect 401 - status code sent back from auth middleware defined in auth.js
// No Authorization set in header
test('Should not get profile of unauthenticated user', async () => {
    const response = await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

// Test delete account
// Sends authorization in header
test('Should delete user account', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    // Assert userOne is no longer in db using userOne ObjectId
    const user = await User.findById(userOneObjectId)
    expect(user).toBeNull()
})

// Test unsuccessful delete account of unauthorized user
// Does not send authorization in header
test('Should not delete account of unauthorized user', async () => {
    const response = await request(app)
        .delete('/users/me')
        .send()
        .expect(401) // or 500
})

// Test upload avatar
// Requires authorization
// Use .attach('', '') supertest method to attach image from fixtures dir
// router looks for 'avatar' field in request body
test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)

    // Get user, ensure binary image data stored in db
    const user = await User.findById(userOneObjectId)
    // Check that avatar property is of Buffer Type
    // Using toEqual instead of toBe, which compares object properties
    // toBe uses === (triple equality)
    // expect.any(...) takes constructor fn for a type, to check if 
    // user.avatar is that type
    expect(user.avatar).toEqual(expect.any(Buffer))
})

// Test user update
// Requires auth
// Tests successful name update
test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Gene'
        })
        .expect(200)
    
    // Get user from db and confirm name change
    const user = await User.findById(userOneObjectId)
    expect(user.name).toBe('Gene')
})

// Test failed user update
// Requires auth
// Test failed update of property that DNE
test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Brooklyn'
        })
        .expect(400)
})

//
// User Test Ideas
//
// Should not signup user with invalid name/email/password
// Should not update user if unauthenticated
// Should not update user with invalid name/email/password
// Should not delete user if unauthenticated
