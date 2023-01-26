import React, { useState, useEffect } from 'react';
import { useAsync } from 'react-async-hook';
import dayjs from 'dayjs';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { CircularProgress } from '@mui/material';
import Month from './components/Month';
import JobDialog from '../job/JobDialog';
import taskLine from '../../../assets/task-line.png';

const getMonth = (month = Math.floor(dayjs().month())) => {
    const year = dayjs().year();
    const firstDayOfTheMonth = dayjs(new Date(year, month, 1)).day();
    let currMonthCount = 0 - firstDayOfTheMonth;

    return new Array(5)
        .fill([])
        .map(() =>
            new Array(7).fill(null).map(() => dayjs(new Date(year, month, ++currMonthCount)))
        );
};

const Calendar = () => {
    const getDeadlines = useAsync(httpsCallable(getFunctions(), 'getDeadlines'), []);

    const [currentMonth, setCurrentMonth] = useState(getMonth());
    const [monthIndex, setMonthIndex] = useState<number>(10);

    const [modalOpen, setModalOpen] = useState(false);
    const [currentJob, setCurrentJob] = useState(null);
    const [isEdit, setIsEdit] = useState<boolean>(false); // If this is an edit or a new job

    useEffect(() => {
        setCurrentMonth(getMonth(monthIndex));
    }, [monthIndex]);

    if (getDeadlines.loading) {
        return (
            <div>
                <CircularProgress />
            </div>
        );
    }
    if (getDeadlines.error) {
        return <p>Error: {getDeadlines.error.message}</p>;
    }

    const deadlines: object[] = getDeadlines.result.data;
    // console.log(JSON.stringify(deadlines, null, 4));

    // Events loaded
    // CalendarState.addJobs(getJobs.result.data);

    // Get the 3 most immediate tasks
    // const taskDates = Object.entries(CalendarState.events)
    //     .map((elem) => elem[0])
    //     .sort()
    //     .filter((e) => e >= dayjs().format('YY-MM-DD'))
    //     .slice(0, 3);
    // const recent = [
    //     ...CalendarState.events[taskDates[0]].map((e) => ({ ...e, date: taskDates[0] })),
    //     ...CalendarState.events[taskDates[1]].map((e) => ({ ...e, date: taskDates[1] })),
    //     ...CalendarState.events[taskDates[2]].map((e) => ({ ...e, date: taskDates[2] })),
    // ].slice(0, 3);

    /*
    const formatDate = (date) => {
        const split = date.split('-');
        return `${split[1] === '11' ? 'Nov. ' : 'Dec. '} ${(split[2] * 1).toString()}`;
    };
    */

    return (
        <div className="h-screen flex flex-col">
            {modalOpen && (
                <JobDialog
                    setOpen={setModalOpen}
                    setCurrentJob={setCurrentJob}
                    jobData={currentJob}
                    isEdit={isEdit}
                    index={0}
                    state={[]}
                    setState={false}
                />
            )}
            <h1 className="grid place-content-center text-3xl mt-5">Upcoming Tasks</h1>
            {/* <div className="grid grid-cols-3 gap-20 mx-20 h-40 my-5" style={{ color: 'white' }}> */}
            {/*    <div */}
            {/*        className="p-5 place-content-between bg-gradient-to-tl from-[#8080AE] to-[#C7C7E2] rounded-2xl" */}
            {/*        onClick={() => { */}
            {/*            // setCurrentJob(CalendarState.jobs[recent[0].id]); */}
            {/*            setModalOpen(true); */}
            {/*            setIsEdit(true); */}
            {/*        }} */}
            {/*    > */}
            {/*        <div className="ml-5"> */}
            {/*            <h1> */}
            {/*                <span className="text-3xl">title</span> */}
            {/*            </h1> */}
            {/*        </div> */}

            {/*        <div style={{ marginTop: '4%' }}> */}
            {/*            <img src={taskLine} alt="Horizontal divider" /> */}
            {/*        </div> */}

            {/*        <div className="ml-5 mt-2"> */}
            {/*            <h1 className="text-md align-middle"> */}
            {/*                <span className="material-icons-outlined text-xl">work</span> position */}
            {/*            </h1> */}
            {/*        </div> */}
            {/*        <div className="ml-5 mt-1"> */}
            {/*            <h1 className="text-md align-middle"> */}
            {/*                <span className="material-icons-outlined text-xl">schedule</span> date */}
            {/*            </h1> */}
            {/*        </div> */}
            {/*        <div className="ml-5 mt-1"> */}
            {/*            <h1 className="text-md align-middle"> */}
            {/*                <span className="material-icons-outlined text-xl">location_on</span>{' '} */}
            {/*                {'company'} */}
            {/*            </h1> */}
            {/*        </div> */}
            {/*    </div> */}
            {/*    <div */}
            {/*        className="p-5 place-content-between bg-gradient-to-tl from-[#8080AE] to-[#C7C7E2] rounded-2xl" */}
            {/*        onClick={() => { */}
            {/*            // setCurrentJob(CalendarState.jobs[recent[1].id]); */}
            {/*            setModalOpen(true); */}
            {/*            setIsEdit(true); */}
            {/*        }} */}
            {/*    > */}
            {/*        <div className="ml-5"> */}
            {/*            <h1> */}
            {/*                <span className="text-3xl">title</span> */}
            {/*            </h1> */}
            {/*        </div> */}

            {/*        <div style={{ marginTop: '4%' }}> */}
            {/*            <img src={taskLine} alt="Horizontal divider" /> */}
            {/*        </div> */}

            {/*        <div className="ml-5 mt-2"> */}
            {/*            <h1 className="text-md align-middle"> */}
            {/*                <span className="material-icons-outlined text-xl">work</span>{' '} */}
            {/*                position */}
            {/*            </h1> */}
            {/*        </div> */}
            {/*        <div className="ml-5 mt-1"> */}
            {/*            <h1 className="text-md align-middle"> */}
            {/*                <span className="material-icons-outlined text-xl">schedule</span>{' '} */}
            {/*                date */}
            {/*            </h1> */}
            {/*        </div> */}
            {/*        <div className="ml-5 mt-1"> */}
            {/*            <h1 className="text-md align-middle"> */}
            {/*                <span className="material-icons-outlined text-xl">location_on</span>{' '} */}
            {/*                company */}
            {/*            </h1> */}
            {/*        </div> */}
            {/*    </div> */}
            {/*    <div */}
            {/*        className="p-5 place-content-between bg-gradient-to-tl from-[#8080AE] to-[#C7C7E2] rounded-2xl" */}
            {/*        onClick={() => { */}
            {/*            // setCurrentJob(CalendarState.jobs[recent[2].id]); */}
            {/*            setModalOpen(true); */}
            {/*            setIsEdit(true); */}
            {/*        }} */}
            {/*    > */}
            {/*        <div className="ml-5"> */}
            {/*            <h1> */}
            {/*                <span className="text-3xl">title</span> */}
            {/*            </h1> */}
            {/*        </div> */}

            {/*        <div style={{ marginTop: '4%' }}> */}
            {/*            <img src={taskLine} alt="Horizontal divider" /> */}
            {/*        </div> */}

            {/*        <div className="ml-5 mt-2"> */}
            {/*            <h1 className="text-md align-middle"> */}
            {/*                <span className="material-icons-outlined text-xl">work</span>{' '} */}
            {/*                position */}
            {/*            </h1> */}
            {/*        </div> */}
            {/*        <div className="ml-5 mt-1"> */}
            {/*            <h1 className="text-md align-middle"> */}
            {/*                <span className="material-icons-outlined text-xl">schedule</span>{' '} */}
            {/*                date */}
            {/*            </h1> */}
            {/*        </div> */}
            {/*        <div className="ml-5 mt-1"> */}
            {/*            <h1 className="text-md align-middle"> */}
            {/*                <span className="material-icons-outlined text-xl">location_on</span>{' '} */}
            {/*                company */}
            {/*            </h1> */}
            {/*        </div> */}
            {/*    </div> */}
            {/* </div> */}
            {/* <br /> */}
            {/* <br /> */}

            <h2 className="ml-20 text-2xl">
                {dayjs(new Date(dayjs().year(), monthIndex)).format('MMMM YYYY')}
            </h2>
            <br />
            <div className="flex flex-1 mb-10">
                <button type="button" onClick={() => setMonthIndex(monthIndex - 1)}>
                    <span className="material-icons-outlined cursor-pointer text-6xl text-gray-600 mx-2">
                        chevron_left
                    </span>
                </button>
                <Month
                    month={currentMonth}
                    setOpen={setModalOpen}
                    setJob={setCurrentJob}
                    setIsEdit={setIsEdit}
                />
                <button type="button" onClick={() => setMonthIndex(monthIndex + 1)}>
                    <span className="material-icons-outlined cursor-pointer text-6xl text-gray-600 mx-2">
                        chevron_right
                    </span>
                </button>
            </div>
        </div>
    );
};

export default Calendar;
