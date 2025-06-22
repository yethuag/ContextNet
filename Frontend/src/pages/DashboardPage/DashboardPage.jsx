import { useState, useEffect } from "react";
import DisplayCalender from "../../components/DisplayCalender";
import MetricCards from "../../components/MetricCards";
import TagsList from "../../components/DashBoard/DashBoardTagsList";
import PieChartSection from "../../components/DashBoard/PieChartSection";
import LeafletMap from "../../components/Map"; 
import { format } from "date-fns";

const API_BASE = "http://localhost:8001"; // alerts_service runs on 8001

const DashboardPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch alerts when selectedDate changes
  useEffect(() => {
    const fetchAlerts = async () => {
      const day = format(selectedDate, "yyyy-MM-dd");
      try {
        const res = await fetch(`${API_BASE}/alerts?date=${day}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAlerts(data);
      } catch (err) {
        console.error("Error fetching alerts:", err);
        setAlerts([]);
      }
    };
    fetchAlerts();
  }, [selectedDate]);

  // When a date is picked in the calendar
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-purple-400">Dashboard</h1>
        <button
          onClick={() => setShowCalendar(true)}
          className="bg-gray-700 text-white px-4 py-2 rounded"
        >
          {format(selectedDate, "MMMM dd, yyyy")}
        </button>
      </div>

      {showCalendar && (
        <DisplayCalender
          date={selectedDate}
          onDateChange={handleDateChange}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* Metrics */}
      <MetricCards alerts={alerts} />

      <div className="grid grid-cols-3 gap-5 mt-8">
        {/* Map area */}
        <div className="col-span-2 row-span-2 z-0">
          <LeafletMap date={selectedDate} />
        </div>

        {/* Activities tags */}
        <div className="col-span-1">
          <TagsList alerts={alerts} />
        </div>

        {/* Severity pie chart */}
        <div className="col-span-1">
          <PieChartSection alerts={alerts} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;