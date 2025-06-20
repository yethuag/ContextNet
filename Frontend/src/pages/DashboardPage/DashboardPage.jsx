import Calendar from "../../components/Calender";
import { useState } from "react";
import { format } from "date-fns";
import DisplayCalender from "../../components/DisplayCalender";
import MetricCards from "../../components/DashboardData/MetricCards";

const DashboardPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const handleShowCalendar = (date) => {
    setSelectedDate(date);
    setShowCalendar(!showCalendar);
  };
  return (
    <>
      <div className="flex justify-center items-center">
            <h1 className="text-4xl font-bold text-purple-400">Dashboard</h1>
      </div>
      <DisplayCalender />
      <MetricCards />
    </>
  );
};

export default DashboardPage;
