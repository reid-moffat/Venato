import * as functions from 'firebase-functions';
import {
    getCollection,
    getRelativeTimestamp,
    verifyIsAuthenticated,
    verifyDocPermission,
} from './helpers';

/**
 * Callable functions for getting data from firestore
 * Note: There is an overlap between some, so some functions are helpers used in multiple functions
 */

// Gets all the job boards (name + list of jobs) for the currently signed-in user
const getJobBoards = (uid: string) => {
    return getCollection(`boards`)
        .where('userId', '==', uid)
        .get()
        .then((boards) => (boards.empty ? [] : boards.docs.map((board) => board.data())))
        .catch((err) => functions.logger.log(`Error fetching user job boards: ${err}`));
};

const getJobDeadlines = (jobId: string) => {
    return getCollection(`deadlines`)
        .where('metaData.jobId', '==', jobId)
        .get()
        .then((deadlines) => {
            if (deadlines.empty) return [];

            return deadlines.docs.map((doc) => {
                const { metaData: foo, ...deadline } = doc.data();
                return deadline;
            });
        })
        .catch((err) => `Error fetching job deadlines: ${err}`);
};

const getJobInterviewQuestions = (jobId: string) => {
    return getCollection(`interviewQuestions`)
        .where('metaData.jobId', '==', jobId)
        .get()
        .then((questions) => {
            if (questions.empty) return [];

            return questions.docs.map((doc) => {
                const { metaData: foo, ...question } = doc.data();
                return question;
            });
        })
        .catch((err) => `Error fetching job interview questions: ${err}`);
};

const getJobContacts = (jobId: string) => {
    return getCollection(`contacts`)
        .where('metadata.jobId', '==', jobId)
        .get()
        .then((contacts) => {
            if (contacts.empty) return [];

            return contacts.docs.map((doc) => {
                const { metaData: foo, ...contact } = doc.data();
                return contact;
            });
        })
        .catch((err) => `Error fetching job contacts: ${err}`);
};

// Gets all jobs for the current user
const getUserJobs = async (uid: string) => {
    const jobs = await getCollection('jobs')
        .where('metaData.userId', '==', uid)
        .get()
        .then((userJobs) => {
            const jobList: any[] = [];
            userJobs.forEach((job) => {
                // Remove the query helper fields (positionSearchable, userId) and add the job id
                const { metaData: foo, ...jobData } = job.data();
                jobList.push({ ...jobData, id: job.id });
            });
            return jobList;
        })
        .catch((err) => `Error fetching user jobs: ${err}`);

    if (typeof jobs === 'string') {
        throw new functions.https.HttpsError('internal', jobs);
    }

    // Get the deadlines and interview questions for each job
    const promises: Promise<null>[] = [];
    jobs.forEach((job) => {
        promises.push(
            getJobDeadlines(job.id).then((deadlines) => {
                job.deadlines = deadlines;
                return null;
            })
        );
        promises.push(
            getJobInterviewQuestions(job.id).then((questions) => {
                job.questions = questions;
                return null;
            })
        );
        promises.push(
            getJobContacts(job.id).then((contacts) => {
                job.contacts = contacts;
                return null;
            })
        );
    });

    return Promise.all(promises)
        .then(() => jobs)
        .catch((err) => functions.logger.log(`Error fetching user jobs: ${err}`));
};

// Returns the next 3 job events for the currently signed-in user
const getUpcomingEvents = async (uid: string) => {
    return getCollection('deadlines')
        .where('metaData.userId', '==', uid)
        .where('date', '>=', getRelativeTimestamp(0))
        .orderBy('date')
        .limit(3)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) return [];

            return snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    location: data.location,
                    // eslint-disable-next-line no-underscore-dangle
                    date: data.date._seconds,
                    title: data.title,
                    company: data.company,
                };
            });
        })
        .catch((err) => `Error fetching upcoming events: ${err}`);
};

// Returns all job boards for the current signed-in user (each has a name + array of job ids)
const getHomepageData = functions.https.onCall((data: object, context: any) => {
    verifyIsAuthenticated(context);

    return Promise.all([getUpcomingEvents(context.auth.uid), getJobBoards(context.auth.uid)])
        .then((userData) => ({ events: userData[0], boards: userData[1] }))
        .catch((err) => `Error fetching homepage data: ${err}`);
});

// Gets all the jobs for a given kanban board
const getKanbanBoard = functions.https.onCall(async (data: { boardId: string }, context: any) => {
    if (!data.boardId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            "A 'boardId' is required to call this function"
        );
    }
    await verifyDocPermission(context.auth.uid, `boards/${data.boardId}`);

    return getCollection('boards')
        .where('__name__', '==', data.boardId)
        .where('userId', '==', context.auth.uid)
        .get()
        .then((query) => {
            if (query.docs.length === 0) {
                throw new functions.https.HttpsError(
                    'not-found',
                    `No board with id ${data.boardId} found for user ${context.auth.uid}`
                );
            }
            if (query.docs.length !== 1) {
                throw new functions.https.HttpsError(
                    'internal',
                    `Multiple boards with id ${data.boardId} found for user ${context.auth.uid}`
                );
            }

            const board = query.docs[0].data();
            return { jobs: board.jobs, name: board.name };
        })
        .catch((err) => `Error getting kanban board with id ${data.boardId}: ${err}`);
});

// Returns all the jobs that belong to the currently signed-in user
const getJobs = functions.https.onCall((data: object, context: any) => {
    verifyIsAuthenticated(context);

    return getUserJobs(context.auth.uid);
});

// Returns all job deadlines for the currently signed-in user
const getDeadlines = functions.https.onCall((data: object, context: any) => {
    verifyIsAuthenticated(context);

    return getCollection('deadlines')
        .where('userId', '==', context.auth.uid)
        .get()
        .then((deadlines) =>
            deadlines.empty ? [] : deadlines.docs.map((deadline) => deadline.data())
        )
        .catch((err) => `Error getting calendar events: ${err}`);
});

// For searching or adding jobs, we need all the possible companies and/or locations
const getAllCompanies = functions.https.onCall((data: object, context: any) => {
    verifyIsAuthenticated(context);

    return getCollection('companies')
        .get()
        .then((companies) => companies.docs.map((company) => company.id))
        .catch((err) => err);
});
const getAllLocations = functions.https.onCall((data: object, context: any) => {
    verifyIsAuthenticated(context);

    return getCollection('locations')
        .get()
        .then((locations) => locations.docs.map((location) => location.id))
        .catch((err) => err);
});

// Search for a job by position, company, or location
const jobSearch = functions.https.onCall(
    (data: { company: string; position: string; location: string }, context: any) => {
        verifyIsAuthenticated(context);

        // Check which of the three inputs are given
        const queries: { position: string; company: string; location: string } = {
            position: data.position?.replace(/ +/g, ' ').trim() || '',
            company: data.company?.replace(/ +/g, ' ').trim() || '',
            location: data.location?.replace(/ +/g, ' ').trim() || '',
        };
        if (!queries.position && !queries.company && !queries.location) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'A company, position or location is required to search for jobs'
            );
        }

        // Build the query
        let query = getCollection('jobs').where('metaData.userId', '!=', context.auth.uid);
        if (queries.position) {
            query = query.where(
                'metaData.positionSearchable',
                'array-contains-any',
                data.position.toLowerCase().split(' ')
            );
        }
        if (queries.company) {
            query = query.where('details.company', '==', data.company);
        }
        if (queries.location) {
            query = query.where('details.location', '==', data.location);
        }

        // Execute the query and return the result
        return query
            .get()
            .then((jobs) => {
                if (jobs.empty) return [];

                return jobs.docs.map((doc) => ({
                    details: doc.data().details,
                    info: doc.data().info,
                    interviewQuestions: doc.data().interviewQuestions,
                }));
            })
            .catch((err) => `Error querying jobs questions: ${err}`);
    }
);

// Search for interview questions based on a company and/or position
const interviewQuestionsSearch = functions.https.onCall(
    (data: { position: string; company: string }, context: any) => {
        verifyIsAuthenticated(context);

        /*
        return getCollection('interviewQuestions')
            .where('metaData.userId', '!=', context.auth.uid)
            .get()
            .then((questions) => questions || []);
        */

        // Parse the search queries and verify at least one valid is given
        const queries: { position: string; company: string } = {
            position: data.position?.replace(/ +/g, ' ').trim() || '',
            company: data.company?.replace(/ +/g, ' ').trim() || '',
        };
        if (!queries.position && !queries.company) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'A company or position is required to search for interview questions'
            );
        }

        // Build the query
        let query = getCollection('interviewQuestions').where(
            'metaData.userId',
            '!=',
            context.auth.uid
        );
        if (queries.position) {
            query = query.where(
                'metaData.positionSearchable',
                'array-contains-any',
                data.position.toLowerCase().split(' ')
            );
        }
        if (queries.company) {
            query = query.where('metaData.company', '==', data.company);
        }

        // Execute the query and return the result
        return query
            .get()
            .then((questions) => {
                if (questions.empty) return [];

                return questions.docs.map((doc) => {
                    const { metaData: foo, ...question } = doc.data();
                    return question;
                });
            })
            .catch((err) => functions.logger.log(`Error querying interview questions: ${err}`));
    }
);

export {
    getHomepageData,
    getKanbanBoard,
    getJobs,
    getDeadlines,
    getAllCompanies,
    getAllLocations,
    jobSearch,
    interviewQuestionsSearch,
};
