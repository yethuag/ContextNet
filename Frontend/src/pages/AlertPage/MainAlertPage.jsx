import { useState, useEffect } from "react";
import LoadingScreen from "../../components/LoadingScreen";
import { format } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import DisplayCalender from "../../components/DisplayCalender";

const API_BASE = "http://localhost:8001";
const PAGE_SIZE = 7;

// Enhanced cache with sessionStorage persistence and in-memory fallback
const inMemoryCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for today's data
const CACHE_PREFIX = "alerts_page_";
const TODAY = format(new Date(), "yyyy-MM-dd");

// Check if sessionStorage is available
const isSessionStorageAvailable = (() => {
  try {
    const test = "__storage_test__";
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
})();

const getCachedData = (key) => {
  const fullKey = CACHE_PREFIX + key;

  try {
    // Try sessionStorage first
    if (isSessionStorageAvailable) {
      const cached = sessionStorage.getItem(fullKey);
      if (cached) {
        const parsedData = JSON.parse(cached);

        // Only check expiration for today's data
        const isTodayData = key.includes(`alerts_${TODAY}`);
        if (isTodayData && Date.now() - parsedData.timestamp > CACHE_DURATION) {
          sessionStorage.removeItem(fullKey);
          return null;
        }

        return parsedData.data;
      }
    }

    // Fallback to in-memory cache
    const cached = inMemoryCache.get(fullKey);
    if (!cached) return null;

    // Only check expiration for today's data
    const isTodayData = key.includes(`alerts_${TODAY}`);
    if (isTodayData && Date.now() - cached.timestamp > CACHE_DURATION) {
      inMemoryCache.delete(fullKey);
      return null;
    }

    return cached.data;
  } catch (error) {
    console.warn("Error reading from cache:", error);
    return null;
  }
};

const setCachedData = (key, data) => {
  const fullKey = CACHE_PREFIX + key;
  const cacheEntry = {
    data,
    timestamp: Date.now(),
  };

  try {
    // Try sessionStorage first
    if (isSessionStorageAvailable) {
      sessionStorage.setItem(fullKey, JSON.stringify(cacheEntry));
    }

    // Always set in-memory cache as backup
    inMemoryCache.set(fullKey, cacheEntry);
  } catch (error) {
    console.warn("Error writing to cache:", error);
    // Fallback to in-memory only
    inMemoryCache.set(fullKey, cacheEntry);
  }
};

const clearAllCache = () => {
  try {
    // Clear sessionStorage entries
    if (isSessionStorageAvailable) {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    }

    // Clear in-memory cache
    inMemoryCache.clear();
  } catch (error) {
    console.warn("Error clearing cache:", error);
  }
};

// Map each severity band to your chosen colors
const SEVERITY_STYLES = {
  low: "bg-green-900/20 text-green-400 border-green-700/50",
  medium: "bg-yellow-900/20 text-yellow-400 border-yellow-700/50",
  high: "bg-red-900/20   text-red-400   border-red-700/50",
  info: "bg-blue-900/20  text-blue-400  border-blue-700/50",
};

export default function MainAlertPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const dateParam = params.get("date");
  const pageParam = parseInt(params.get("page")) || 1;
  const initialDate = dateParam ? new Date(dateParam) : new Date();

  const [alerts, setAlerts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showCalendar, setShowCalendar] = useState(false);
  const [page, setPage] = useState(pageParam);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      const day = selectedDate.toISOString().slice(0, 10);
      const cacheKey = `alerts_${day}`;

      // Try to get data from cache first
      const cachedAlerts = getCachedData(cacheKey);
      if (cachedAlerts) {
        setAlerts(cachedAlerts);
        setIsFromCache(true);
        setIsLoading(false);
        return;
      }

      // If not in cache, fetch from API
      setIsLoading(true);
      setIsFromCache(false);

      try {
        const res = await fetch(`${API_BASE}/alerts?date=${day}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Cache the processed data
        setCachedData(cacheKey, data);
        setAlerts(data);
      } catch {
        setAlerts([]);
      }
      setIsLoading(false);
    };

    fetchAlerts();
  }, [selectedDate]);

  useEffect(() => {
    setPage(pageParam);
  }, [pageParam]);

  const handleDateChange = (d) => {
    setSelectedDate(d);
    setShowCalendar(false);
    setPage(1);
    navigate(`?date=${format(d, "yyyy-MM-dd")}&page=1`);
  };

  const totalPages = Math.ceil(alerts.length / PAGE_SIZE);
  const paged = alerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    navigate(`?date=${format(selectedDate, "yyyy-MM-dd")}&page=${newPage}`);
  };

  const openAlert = (new_id) => {
    navigate(
      `/app/alerts/${encodeURIComponent(new_id)}?date=${format(
        selectedDate,
        "yyyy-MM-dd"
      )}&page=${page}`
    );
  };

  if (isLoading) return <LoadingScreen />;

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
                  key={a.new_id}
                  onClick={() => openAlert(a.new_id)}
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
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
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
