import * as functions from 'firebase-functions';
import { getDoc } from './helpers';

/**
 * Auth triggers - automatically triggered based on auth events
 */

// Send a verification email to the user when they create an account
// This makes it automatic and server-side, preventing any client-side exploits
const beforeCreate = functions
    .runWith({ secrets: ['GMAIL_PASSWORD'] })
    .auth.user()
    .beforeCreate((user, context) => {
        if (!user || !user.email || !user.emailVerified) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                "User or user's email is null, or they're already verified"
            );
        }

        // TODO: Write to a firestore collection that's triggered by 'Trigger Email'
        // // nodemailer config
        // const mailTransport = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: 'venato.jobapp@gmail.com',
        //         pass: process.env.GMAIL_PASSWORD,
        //     },
        // });

        // // Generate and send verification link
        // return auth.generateEmailVerificationLink(user.email).then((link) => {
        //     // Build and send email
        //     const mailOptions = {
        //         from: 'Venato',
        //         to: user.email,
        //         subject: 'Welcome to Venato!',
        //         html: `<p style="font-size: 16px;">Thanks for signing up</p>
        //        <p style="font-size: 16px;">Verification link: ${link}</p>
        //        <p style="font-size: 12px;">Stay tuned for more updates soon</p>
        //        <p style="font-size: 12px;">Best Regards,</p>
        //        <p style="font-size: 12px;">-The Venato Team</p>`,
        //     };
        //
        //     return mailTransport
        //         .sendMail(mailOptions)
        //         .then(() => console.log(`Email successfully sent to: ${user.email}`))
        //         .catch((err: string) => console.log(`Error sending email: ${err}`));
        // });
    });

// When a user signs up, create a default document for them in firestore
const onUserSignup = functions.auth.user().onCreate((user) => {
    const defaultDoc = {
        boards: {},
    };
    return getDoc(`users/${user.uid}`).set(defaultDoc);
});

// When a user tries to sign in, verify that their email is verified
const beforeSignIn = functions.auth.user().beforeSignIn((user) => {
    if (!user.emailVerified) {
        throw new functions.auth.HttpsError(
            'permission-denied',
            `The email "${user.email}" has not been verified. Please check your email`
        );
    }
});

// On account deletion, delete user data in db
// (Note: don't delete multiple users at the same time with the admin SDK, this won't trigger)
const onUserDeleted = functions.auth.user().onDelete((user) => {
    const promises = [];

    // Delete user's jobs
    getDoc(`users/${user.uid}`)
        .get()
        .then((doc) => {
            const jobIds = Object.values(doc.data()?.boards).flat();
            jobIds.forEach((jobId) => {
                promises.push(getDoc(`jobs/${jobId}`).delete());
            });
        })
        .catch((err) => `Error getting user document: ${err}`);

    // Delete user's document
    promises.push(getDoc(`users/${user.uid}`).delete());

    return Promise.all(promises);
});

export { beforeCreate, onUserSignup, beforeSignIn, onUserDeleted };
