// src/pages/TrendPage/TrendPage.jsx
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, differenceInCalendarDays } from "date-fns";

const API = "http://localhost:8001";

export default function TrendPage() {
  // date-range state
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  // computed days span (inclusive)
  const spanDays = differenceInCalendarDays(endDate, startDate) + 1;

  // data for charts
  const [counts, setCounts] = useState([]);
  const [avgViolence, setAvgViolence] = useState([]);
  const [activities, setActivities] = useState([]);
  const [topEntities, setTopEntities] = useState([]);
  const [severity, setSeverity] = useState([]);

  // whenever spanDays changes, refetch time-series stats
  useEffect(() => {
    const d = spanDays;
    fetch(`${API}/stats/counts?days=${d}`)
      .then((r) => r.json())
      .then(setCounts)
      .catch(console.error);

    fetch(`${API}/stats/avg_violence?days=${d}`)
      .then((r) => r.json())
      .then(setAvgViolence)
      .catch(console.error);

    fetch(`${API}/stats/activities?days=${d}`)
      .then((r) => {
        console.log(r);
        return r.json();
      })
      .then((data) => {
        setActivities(data);
      })
      .catch(console.error);
  }, [spanDays]);

  // on mount only, fetch static charts
  useEffect(() => {
    fetch(API + "/stats/top_entities")
      .then((r) => r.json())
      .then((data) => {
        console.log("Top entities data:", data);
        setTopEntities(data);
      })
      .catch(console.error);

    fetch(API + "/stats/severity")
      .then((r) => r.json())
      .then(setSeverity)
      .catch(console.error);
  }, []);

  const sevColors = { low: "#34D399", medium: "#FBBF24", high: "#F87171" };

  return (
    <div className="p-6 space-y-8">
      {/* date range picker */}
      <div className="flex gap-4 items-center text-white">
        <label>
          From{" "}
          <input
            type="date"
            value={format(startDate, "yyyy-MM-dd")}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            className="rounded bg-gray-800 text-white p-1"
            max={format(endDate, "yyyy-MM-dd")}
          />
        </label>
        <label>
          To{" "}
          <input
            type="date"
            value={format(endDate, "yyyy-MM-dd")}
            onChange={(e) => setEndDate(new Date(e.target.value))}
            className="rounded bg-gray-800 text-white p-1"
            min={format(startDate, "yyyy-MM-dd")}
            max={format(new Date(), "yyyy-MM-dd")}
          />
        </label>
        <span className="text-gray-400">
          ({spanDays} day{spanDays > 1 ? "s" : ""})
        </span>
      </div>

      {/* 1. Alerts-per-day */}
      <section>
        <h2 className="text-xl font-semibold mb-2 text-white">
          Alerts Per Day
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={counts}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                const day = date.getDate();
                const month = date.toLocaleDateString("en-US", {
                  month: "long",
                });
                const year = date.getFullYear().toString().slice(-2);
                return `${day}-${month}-${year}`;
              }}
              stroke="#ccc"
              tick={{ fill: "#ccc", fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              label={{
                value: "Date",
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle", fill: "#ffffff" },
              }}
            />
            <YAxis
              allowDecimals={false}
              stroke="#ccc"
              tick={{ fill: "#ccc", fontSize: 12 }}
              label={{
                value: "Count",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#ffffff" },
              }}
            />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value);
                const day = date.getDate();
                const month = date.toLocaleDateString("en-US", {
                  month: "long",
                });
                const year = date.getFullYear().toString().slice(-2);
                return `${day}-${month}-${year}`;
              }}
              formatter={(value, name) => [value, "Count"]}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#ffffff",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#60A5FA"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* 2. Avg violence score */}
      <section>
        <h2 className="text-xl font-semibold mb-2 text-white">
          Avg. Violence Score
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={avgViolence}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                const day = date.getDate();
                const month = date.toLocaleDateString("en-US", {
                  month: "long",
                });
                const year = date.getFullYear().toString().slice(-2);
                return `${day}-${month}-${year}`;
              }}
              stroke="#ccc"
              tick={{ fill: "#ccc", fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
              label={{
                value: "Date",
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle", fill: "#ffffff" },
              }}
            />
            <YAxis
              domain={[0, 1]}
              stroke="#ccc"
              tick={{ fill: "#ccc", fontSize: 11 }}
              label={{
                value: "Score",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#ffffff" },
              }}
            />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value);
                const day = date.getDate();
                const month = date.toLocaleDateString("en-US", {
                  month: "long",
                });
                const year = date.getFullYear().toString().slice(-2);
                return `${day}-${month}-${year}`;
              }}
              formatter={(value, name) => [value.toFixed(2), "Avg Score"]}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#ffffff",
              }}
            />
            <Area
              type="monotone"
              dataKey="avg_score"
              stroke="#60A5FA"
              fillOpacity={0.3}
              fill="#60A5FA"
            />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* 3. Stacked area activities */}
      <section>
        <h2 className="text-xl font-semibold mb-2 text-white">
          Activities by Day
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={activities}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                const day = date.getDate();
                const month = date.toLocaleDateString("en-US", {
                  month: "long",
                });
                const year = date.getFullYear().toString().slice(-2);
                return `${day}-${month}-${year}`;
              }}
              stroke="#ccc"
              tick={{ fill: "#ccc", fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
              label={{
                value: "Date",
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle", fill: "#ffffff" },
              }}
            />
            <YAxis
              stroke="#ccc"
              tick={{ fill: "#ccc", fontSize: 11 }}
              label={{
                value: "Count",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#ffffff" },
              }}
            />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value);
                const day = date.getDate();
                const month = date.toLocaleDateString("en-US", {
                  month: "long",
                });
                const year = date.getFullYear().toString().slice(-2);
                return `${day}-${month}-${year}`;
              }}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#ffffff",
              }}
            />
            {activities[0] &&
              Object.keys(activities[0])
                .filter((k) => k !== "date")
                .map((act, i) => (
                  <Area
                    key={act}
                    stackId="1"
                    dataKey={act}
                    stroke={["#60A5FA", "#8B5CF6", "#10B981", "#F59E0B"][i % 4]}
                    fill={["#60A5FA", "#8B5CF6", "#10B981", "#F59E0B"][i % 4]}
                    fillOpacity={0.4}
                  />
                ))}
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* 4. Top entities bar */}
      <section>
        <h2 className="text-xl font-semibold mb-2 text-white">Top Entities</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={topEntities} layout="vertical">
            <XAxis type="number" stroke="#ccc" />
            <YAxis dataKey="entity" type="category" stroke="#ccc" width={120} />
            <Tooltip />
            <Bar dataKey="count" fill="#34D399" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* 5. Severity donut */}
      <section>
        <h2 className="text-xl font-semibold mb-2 text-white">
          Severity Distribution
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            {(() => {
              const filtered = severity.filter((s) =>
                ["low", "medium", "high"].includes(s.severity_band)
              );
              return (
                <Pie
                  data={filtered}
                  dataKey="count"
                  nameKey="severity_band"
                  innerRadius={40}
                  outerRadius={70}
                  label={({ percent, name }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {filtered.map((s, i) => (
                    <Cell
                      key={s.severity_band}
                      fill={sevColors[s.severity_band]}
                    />
                  ))}
                </Pie>
              );
            })()}
            <Legend
              verticalAlign="bottom"
              payload={["low", "medium", "high"].map((band) => ({
                value: band.charAt(0).toUpperCase() + band.slice(1),
                type: "square",
                id: band,
                color: sevColors[band],
              }))}
            />
          </PieChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
