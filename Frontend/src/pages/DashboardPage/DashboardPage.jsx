import { useState, useEffect, useRef } from "react";
import LoadingScreen from "../../components/LoadingScreen";
import DisplayCalender from "../../components/DisplayCalender";
import MetricCards from "../../components/MetricCards";
import TagsList from "../../components/DashBoard/DashBoardTagsList";
import PieChartSection from "../../components/DashBoard/PieChartSection";
import LeafletMap from "../../components/Map";
import { format } from "date-fns";

const API_BASE = "http://localhost:8001";

// Enhanced cache with sessionStorage persistence and in-memory fallback
const inMemoryCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000;
const CACHE_PREFIX = "dashboard_alerts_";

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
        const isExpired = Date.now() - parsedData.timestamp > CACHE_DURATION;

        if (isExpired) {
          sessionStorage.removeItem(fullKey);
          return null;
        }

        return parsedData.data;
      }
    }

    // Fallback to in-memory cache
    const cached = inMemoryCache.get(fullKey);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
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

const DashboardPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);

  // Keep track of active requests to prevent duplicate calls
  const activeRequests = useRef(new Set());

  useEffect(() => {
    const fetchAlerts = async () => {
      const day = format(selectedDate, "yyyy-MM-dd");
      const cacheKey = `alerts_${day}`;

      // Check if we already have this request in progress
      if (activeRequests.current.has(cacheKey)) {
        return;
      }

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
      activeRequests.current.add(cacheKey);

      try {
        const res = await fetch(`${API_BASE}/alerts?date=${day}`);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();

        const alertsWithCorrectId = data.map((alert) => ({
          ...alert,
          id: alert.new_id || alert.id,
        }));

        // Cache the processed data
        setCachedData(cacheKey, alertsWithCorrectId);
        setAlerts(alertsWithCorrectId);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
        setAlerts([]);
      } finally {
        activeRequests.current.delete(cacheKey);
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, [selectedDate]);

  // Clear cache when component unmounts or when needed
  useEffect(() => {
    return () => {
      // Clean up active requests on unmount
      activeRequests.current.clear();
    };
  }, []);

  if (isLoading) return <LoadingScreen />;

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  // Add a function to manually clear cache
  const clearCache = () => {
    clearAllCache();
    // Trigger re-fetch by updating selectedDate
    setIsLoading(true);
    setIsFromCache(false);
    setSelectedDate(new Date(selectedDate.getTime()));
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header + Date Picker - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-400">
            Dashboard
          </h1>
          {isFromCache && (
            <span className="text-xs bg-green-900/20 text-green-400 px-2 py-1 rounded border border-green-700/50 whitespace-nowrap">
              {isSessionStorageAvailable
                ? "Cached (Session)"
                : "Cached (Memory)"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={clearCache}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-500 transition-colors whitespace-nowrap"
            title="Clear cache and refresh data"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCalendar(true)}
            className="bg-gray-700 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base flex-1 sm:flex-none text-center"
          >
            <span className="hidden sm:inline">
              {format(selectedDate, "MMMM dd, yyyy")}
            </span>
            <span className="sm:hidden">
              {format(selectedDate, "MMM dd, yyyy")}
            </span>
          </button>
        </div>
      </div>

      {showCalendar && (
        <DisplayCalender
          date={selectedDate}
          onDateChange={handleDateChange}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* Metrics Full-Width */}
      <div className="mb-6 sm:mb-8">
        <MetricCards alerts={alerts} />
      </div>

      {/* Responsive layout: Mobile (1 col), Tablet (2 col), Desktop (3 col) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-6 sm:mb-8">
        {/* Tags list */}
        <div className="min-h-[20rem] sm:min-h-[24rem]">
          <TagsList alerts={alerts} />
        </div>

        {/* Pie chart */}
        <div className="min-h-[20rem] sm:min-h-[24rem]">
          <PieChartSection alerts={alerts} />
        </div>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="bg-gray-800 rounded-xl p-4">
          <div
            className="relative h-[400px] sm:h-[500px] rounded-lg overflow-hidden"
            style={{ minHeight: "400px" }}
          >
            <LeafletMap
              date={selectedDate}
              key={selectedDate.toISOString()} // Force remount on date change
            />
          </div>
        </div>
      </div>

      {/* Alternative stacked layout for very small screens */}
      <style jsx>{`
        @media (max-width: 640px) {
          .dashboard-mobile-stack > * {
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
