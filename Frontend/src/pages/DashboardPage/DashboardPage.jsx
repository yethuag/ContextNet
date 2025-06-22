import Calendar from "../../components/Calender";
import { useState } from "react";
import { format } from "date-fns";
import DisplayCalender from "../../components/DisplayCalender";
import MetricCards from "../../components/MetricCards"
import TagsList from "../../components/DashBoard/DashBoardTagsList";
import PieChartSection from "../../components/DashBoard/PieChart";
import { Tag } from "lucide-react";

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
        <div className="flex-2">
            <DisplayCalender />
        </div>
        <div className="flex-2">
            <h1 className="text-4xl font-bold text-purple-400">Dashboard</h1>
        </div>
      </div>
      <MetricCards />
      <div className="grid grid-cols-3 gap-5 mt-5">
          <h1 className="col-span-2 row-span-2 text-4xl font-semibold text-white-500 flex">Map</h1>
        <TagsList clssName="col-span-1"/> 
        <div className="col-span-1">
          <PieChartSection /> 
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
