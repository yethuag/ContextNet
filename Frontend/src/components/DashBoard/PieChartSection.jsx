import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

// Colors for severity bands
const COLORS = {
  low: "#34D399", // green
  medium: "#FBBF24", // yellow
  high: "#F87171", // red
};

/**
 * PieChartSection renders a pie chart of alerts grouped by severity_band.
 * Accepts `alerts` array prop from the dashboard.
 */
const PieChartSection = ({ alerts }) => {
  // Aggregate alerts by severity
  const severityMap = alerts.reduce((acc, alert) => {
    const band = alert.severity_band || "low";
    acc[band] = (acc[band] || 0) + 1;
    return acc;
  }, {});

  // Only include high, medium, low
  const allowedBands = ["high", "medium", "low"];
  const data = Object.entries(severityMap)
    .filter(([band]) => allowedBands.includes(band))
    .map(([band, value]) => ({
      name: band.charAt(0).toUpperCase() + band.slice(1), // capitalize
      value,
      color: COLORS[band] || COLORS.low,
    }));

  // Render
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white text-xl font-bold">Severity Distribution</h3>
      </div>

      <div className="h-[min(300px,40vh)]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={({ width }) => Math.min(width * 0.25, 80)}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) =>
                window.innerWidth > 640
                  ? `${name}: ${(percent * 100).toFixed(0)}%`
                  : `${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [value, "Count"]}
              itemStyle={{ color: "#fff" }}
              contentStyle={{ backgroundColor: "#1F2937", borderRadius: 4 }}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{ color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PieChartSection;
