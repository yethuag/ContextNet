import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import DisplayCalender from "../../components/DisplayCalender";

const API_BASE = "http://localhost:8001";
const PAGE_SIZE = 7;

// Map each severity band to your chosen colors
const SEVERITY_STYLES = {
  low:    "bg-green-900/20 text-green-400 border-green-700/50",
  medium: "bg-yellow-900/20 text-yellow-400 border-yellow-700/50",
  high:   "bg-red-900/20   text-red-400   border-red-700/50",
};

export default function MainAlertPage() {
  const [alerts, setAlerts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlerts = async () => {
      const day = format(selectedDate, "yyyy-MM-dd");
      try {
        const res = await fetch(`${API_BASE}/alerts?date=${day}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAlerts(data);
        setPage(1);
      } catch {
        setAlerts([]);
      }
    };
    fetchAlerts();
  }, [selectedDate]);

  const handleDateChange = (d) => {
    setSelectedDate(d);
    setShowCalendar(false);
  };

  const totalPages = Math.ceil(alerts.length / PAGE_SIZE);
  const paged = alerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAlert = (new_id) => {
    // Navigate to the alert details page using the new_id
    navigate(`/app/alerts/${encodeURIComponent(new_id)}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">
          Alerts on {format(selectedDate, "MMMM dd, yyyy")}
        </h1>
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

      {alerts.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          No alerts for this day.
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {paged.map((a) => {
              const sev = a.severity_band?.toLowerCase() || "low";
              const sevStyle = SEVERITY_STYLES[sev] || SEVERITY_STYLES.low;
              return (
                <li
                  key={a.new_id} // Use new_id for the key
                  onClick={() => openAlert(a.new_id)} // Pass new_id to navigate
                  className="bg-gray-800 rounded-lg p-4 shadow border border-gray-700 cursor-pointer hover:bg-gray-700 transition"
                >
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-white break-words">
                        {a.title}
                      </h2>
                      <p className="text-gray-300 mt-1 break-words line-clamp-2">
                        {a.summary}
                      </p>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                        <span>Source: {a.source}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold border ${sevStyle}`}
                        >
                          {a.severity_band?.toUpperCase() || "LOW"}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-right flex-shrink-0 min-w-fit">
                      {a.published_at &&
                        format(new Date(a.published_at), "PPpp")}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
