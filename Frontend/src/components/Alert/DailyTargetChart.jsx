import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

// A reusable tooltip component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black bg-opacity-60 text-white text-sm px-2 py-1 rounded">
        <p>{`${payload[0].value} alerts`}</p>
      </div>
    );
  }
  return null;
};

/**
 * DailyAlertsChart
 *
 * Props:
 *   alerts: Array of alert objects, each with a `published_at` (ISO string)
 *
 * Aggregates count per weekday (Sun–Sat) and draws an area chart.
 */
export default function DailyAlertsChart({ alerts }) {
  // 1. Aggregate counts by weekday
  const data = useMemo(() => {
    // initialize counts for each day
    const counts = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };

    alerts.forEach((a) => {
      // parse published_at, fallback if missing
      const date = a.published_at
        ? parseISO(a.published_at)
        : new Date(a.fetched_at);
      const day = format(date, "EEE"); // e.g. "Mon"
      if (counts[day] !== undefined) {
        counts[day] += 1;
      }
    });

    // convert to array in Sun→Sat order
    const order = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return order.map((d) => ({ day: d, alerts: counts[d] }));
  }, [alerts]);

  return (
    <div className="bg-black bg-opacity-20 backdrop-blur-xl text-white p-4 rounded-2xl shadow-lg w-full max-w-md">
      <h2 className="text-lg font-semibold mb-4">Alerts by Weekday</h2>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="alerts"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorAlerts)"
            dot={{ stroke: "#fff", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
