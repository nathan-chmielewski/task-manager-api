const sgMail = require('@sendgrid/mail')

// Set API key on sendgrid module - associate with our account
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Define send welcome email function when a user signs up
// export function
// .send(...) is an async function that returns a Promise
const sendWelcomeEmail = async (email, name) => {
    try {    
        await sgMail.send({
            to: email,
            from: 'brightsidenate@gmail.com',
            subject: 'Welcome to Task Manager!',
            // ES6 template string feature - backticks, inject name variable value
            text: `Welcome to the app, ${name}. Let me know what you think!`
        })
    } catch (e) {
        
    }

}

const sendCancellationEmail = async (email, name) => {
    try {
        await sgMail.send({
            to: 'brightsidenate@gmail.com',
            from: 'brightsidenate@gmail.com',
            subject: 'We\'re sorry to see you go',
            text: `We hate to see you go, ${name}. We'd love to hear what we could have done differently.`
        })
    } catch (e) {

    }
}


/*
// Send email
sgMail.send({
    to: 'brightsidenate@gmail.com',
    from: 'brightsidenate@gmail.com',
    subject: 'hello from sendgrid',
    text: 'hello world!'
})
*/

// Export object of functions to export
module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}