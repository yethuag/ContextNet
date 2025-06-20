import Calendar from "../../components/Calender";
import { useState } from "react";
import { format } from "date-fns";
import DisplayCalender from "../../components/DisplayCalender";

const DashboardPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const handleShowCalendar = (date) => {
    setSelectedDate(date);
    setShowCalendar(!showCalendar);
  };
  return (
    <>
      <h1>DashboardPage</h1>
      <DisplayCalender />
    </>
  );
};

export default DashboardPage;
