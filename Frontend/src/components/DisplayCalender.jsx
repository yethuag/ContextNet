import { format } from "date-fns";
import { useState } from "react";
import Calendar from "./Calender";

const DisplayCalender = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const handleShowCalendar = (date) => {
    setSelectedDate(date);
  };

  const onClose = () => {
    setShowCalendar(!showCalendar);
  };

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowCalendar(false);
    }
  };

  return (
    <div>
      <button
        className="border border-white px-4 py-2 rounded-lg text-white bg-transparent cursor-pointer"
        onClick={() => setShowCalendar((e) => !e)}
      >
        {format(selectedDate, "do MMMM - yyyy")}
      </button>
      {showCalendar && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={handleBackgroundClick}
        >
          <div>
            <Calendar
              onDateSelect={handleShowCalendar}
              selectedDate={selectedDate}
              onClose={onClose}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DisplayCalender;
