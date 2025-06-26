import { useState, useEffect } from "react";
import LoadingScreen from "../../components/LoadingScreen";
import DisplayCalender from "../../components/DisplayCalender";
import MetricCards from "../../components/MetricCards";
import TagsList from "../../components/DashBoard/DashBoardTagsList";
import PieChartSection from "../../components/DashBoard/PieChartSection";
import LeafletMap from "../../components/Map";
import { format } from "date-fns";

const API_BASE = "http://localhost:8001";

const DashboardPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const day = format(selectedDate, "yyyy-MM-dd");
      try {
        const res = await fetch(`${API_BASE}/alerts?date=${day}`);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const alertsWithCorrectId = data.map((alert) => ({
          ...alert,
          id: alert.new_id || alert.id,
        }));
        setAlerts(alertsWithCorrectId);
      } catch {
        setAlerts([]);
      }
      setIsLoading(false);
    })();
  }, [selectedDate]);

  if (isLoading) return <LoadingScreen />;
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  return (
    <div className="p-6">
      {/* Header + Date Picker */}
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

      {/* Metrics Full-Width */}
      <MetricCards alerts={alerts} />

      {/* Three-column layout: 40% tag list, 50% map, 10% pie chart */}
      <div
        className="grid gap-5 mt-8"
        style={{ gridTemplateColumns: "35% 45% 20%" }}
      >
        {/* 1. Tags list */}
        <div className="min-h-[24rem]">
          <TagsList alerts={alerts} />
        </div>

        {/* 2. Map */}
        <div className="min-h-[24rem] z-0">
          <LeafletMap date={selectedDate} />
        </div>

        {/* 3. Pie chart */}
        <div className="min-h-[24rem]">
          <PieChartSection alerts={alerts} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
