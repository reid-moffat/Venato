import * as functions from 'firebase-functions';
import { getCollection, auth, getTimestamp } from './helpers';

/**
 * CRON jobs - automatically triggered on a set schedule
 */

// Removes users that have been unverified for at least a day
// if there's bugs, try https://github.com/firebase/functions-samples/blob/main/delete-unused-accounts-cron/functions/index.js
const purgeUnverifiedUsers = functions.pubsub.schedule('every day 00:00').onRun(async (context) => {
    const unVerifiedUsers: string[] = [];

    // Go through users in batches of 1000
    const listAllUsers = (nextPageToken: string | undefined) => {
        return auth
            .listUsers(1000, nextPageToken)
            .then((listUsersResult) => {
                // Get unverified users
                listUsersResult.users.forEach((userRecord) => {
                    if (
                        !userRecord.emailVerified &&
                        new Date(userRecord.metadata.creationTime).getTime() <
                            Date.now() - 24 * 60 * 60 * 1000
                    ) {
                        unVerifiedUsers.push(userRecord.uid);
                    }
                });

                // List next page if it exists
                if (listUsersResult.pageToken) {
                    listAllUsers(listUsersResult.pageToken);
                }
                return null;
            })
            .catch((error) => {
                console.log('Error listing users:', error);
            });
    };
    await listAllUsers(undefined);

    return Promise.all(unVerifiedUsers.map((user) => auth.deleteUser(user)))
        .then(() => console.log(`Successfully deleted ${unVerifiedUsers.length} unverified users`))
        .catch((err) => console.log(`Failed to delete unverified users: ${err}`));
});

// Remove any old data in the db that's not needed anymore
const purgeExpiredData = functions.pubsub.schedule('every day 00:00').onRun((context) => {
    // Remove jobs that have been deleted for 30 days
    const jobsToDelete: Promise<FirebaseFirestore.WriteResult>[] = [];
    getCollection('jobs')
        .where('deletedTime', '<', getTimestamp(30))
        .get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                jobsToDelete.push(doc.ref.delete());
            });
            return null;
        })
        .catch((err) => console.log(`Error getting expired jobs from firestore: ${err}`));

    // Remove emails have been sent at least a day ago
    const emailsToDelete: Promise<FirebaseFirestore.WriteResult>[] = [];
    getCollection('emails')
        .where('delivery.endTime', '<', getTimestamp(1))
        .where('delivery.state', '==', 'SUCCESS')
        .get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                emailsToDelete.push(doc.ref.delete());
            });
        })
        .catch((err) => console.log(`Error getting sent emails from firestore: ${err}`));

    // Make a response message and return all the promises
    let returnMessage = '';
    if (jobsToDelete.length > 0) {
        returnMessage += `Successfully purged ${jobsToDelete.length} jobs (30+ days deleted)`;
    }
    if (emailsToDelete.length > 0) {
        returnMessage +=
            (jobsToDelete.length > 0 ? '. ' : '') +
            `Successfully purged ${emailsToDelete.length} emails (sent at least a day ago)`;
    }

    return Promise.all([jobsToDelete.flat(), emailsToDelete.flat()])
        .then(() => console.log(returnMessage || 'No jobs or emails to purge from firestore'))
        .catch((err) => console.log(`Error purging deleted jobs: ${err}`));
});

const dataIntegrityCheck = functions.pubsub.schedule('every day 00:00').onRun((context) => {
    console.log('Running data integrity check');

    // TODO (make sure that all db data makes sense (e.g. no users with more than the limit of jobs, no invalid ids, etc))
});

export { purgeUnverifiedUsers, purgeExpiredData, dataIntegrityCheck };
