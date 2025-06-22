import { format } from "date-fns";
import Calendar from "./Calender";

/**
 * DisplayCalender wraps the Calendar popup and handles selecting and closing.
 */
const DisplayCalender = ({ date, onDateChange, onClose }) => {
  /**
   * Called when a date is selected in Calendar.
   * Updates parent and closes the popup.
   */
  const handleDateSelect = (newDate) => {
    onDateChange(newDate);
    onClose();
  };

  /**
   * Close when clicking outside the calendar
   */
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
      onClick={handleBackgroundClick}
    >
      <Calendar
        selectedDate={date}
        onDateSelect={handleDateSelect}
        onClose={onClose}
      />
    </div>
  );
};

export default DisplayCalender;