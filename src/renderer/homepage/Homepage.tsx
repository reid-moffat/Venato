import React from 'react';
import ReusableHeader from 'renderer/reusable/ReusableHeader';
import { useNavigate } from 'react-router-dom';

export default function Homepage() {
    const nav = useNavigate();
    return (
        <React.Fragment>
            <ReusableHeader />
            <h1 className="text-center text-3xl mt-20">Welcome Back _________</h1>

            <div className="mt-20 grid grid-rows-3 gap-y-8 text-3xl">
                <div className="grid place-content-center">
                    <button
                        className="px-80 h-32 bg-gray-200"
                        onClick={() => {
                            nav('/kanban');
                        }}
                    >
                        View Board 1
                    </button>
                </div>
                <div className="grid place-content-center">
                    <button
                        className="px-80 h-32 bg-gray-200"
                        onClick={() => {
                            nav('/kanban');
                        }}
                    >
                        {' '}
                        View Board 2{' '}
                    </button>
                </div>
                <div className="grid place-content-center">
                    <button
                        className="px-80 h-32 bg-gray-200"
                        onClick={() => {
                            nav('/kanban');
                        }}
                    >
                        <span className="material-icons-outlined">add_circle</span> Create Board
                    </button>
                </div>
            </div>
        </React.Fragment>
    );
}
