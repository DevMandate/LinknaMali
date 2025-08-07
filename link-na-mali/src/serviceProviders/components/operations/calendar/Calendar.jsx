import React from 'react';

const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const Calendar = () => (
  <div className="p-6 bg-gray-100 min-h-screen">
    <h1 className="text-2xl font-bold mb-6">Calendar</h1>
    <div className="bg-white p-4 rounded shadow">
      <div className="grid grid-cols-7 gap-px bg-gray-300">
        {weekdays.map(day => (
          <div key={day} className="bg-gray-200 p-2 text-center font-medium">
            {day}
          </div>
        ))}
      </div>
      {/* Placeholder for dynamic month grid */}
      <div className="grid grid-cols-7 gap-px mt-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="h-20 bg-white p-1 hover:bg-gray-50"
          >
            <span className="text-sm">{i+1}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Calendar;
