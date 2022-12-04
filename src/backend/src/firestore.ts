import * as functions from "firebase-functions";
import { getDoc } from "./helpers";

/**
 * Contains firestore triggers
 *
 * These are automatically triggered by firebase when a document with the specified path is changed
 * in the specified way
 * e.g. When a document in /jobs/* is created, make a searchable field for the position and add the
 * company and location to a list of companies and locations respectively in firestore
 */

// Removes any event from the db when toDelete is set to true
const purgeDeletedEvent = functions.firestore
    .document('events/{eventId}')
    .onUpdate((change, context) => {
        if (change.after.data().toDelete) {
            return change.after.ref.delete();
        }
        return null;
    });

// Makes searchable fields for the jobs on create and add company/location to db
const onJobCreate = functions.firestore.document('jobs/{jobId}').onCreate((snap, context) => {
    const data = snap.data();
    data.userID = context.auth?.uid;
    const promises = [];

    // Add searchable job position field and the company + location to db
    promises.push(
        snap.ref.update({
            positionSearchable: data.info.position
                .replace('/[!@#$%^&*()_-+=,:.]/g', '')
                .toLowerCase()
                .split(' '),
        })
    );
    promises.push(getDoc(`companies/${data.info.company}`).set({}));
    promises.push(getDoc(`locations/${data.info.location}`).set({}));

    return Promise.all(promises);
});

export { purgeDeletedEvent, onJobCreate };
