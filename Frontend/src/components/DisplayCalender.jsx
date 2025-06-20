import { format } from 'date-fns';
import { useState } from "react";
import Calendar from "./Calender";

const DisplayCalender = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const handleShowCalendar = (date) => {
    setSelectedDate(date);
    setShowCalendar(!showCalendar);
  };
  return (
    <div>
        <button
      className="border border-white px-4 py-2 rounded-lg text-white bg-transparent"
      onClick={() => setShowCalendar(e => !e)}
      >
      {format(selectedDate, 'do MMMM - yyyy')}
      </button>
      {showCalendar && (
        <Calendar onDateSelect={handleShowCalendar} selectedDate={selectedDate} />
      )}
      </div>
  )
}

export default DisplayCalender