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
  CartesianGrid,
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

  function similarity(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.8;
    }

    const nationalitySuffixes = ["ian", "an", "ish", "ese", "i"];

    for (const suffix of nationalitySuffixes) {
      if (s1.endsWith(suffix) && s2 === s1.slice(0, -suffix.length)) {
        return 0.9;
      }
      if (s2.endsWith(suffix) && s1 === s2.slice(0, -suffix.length)) {
        return 0.9;
      }
    }
    for (const suffix of nationalitySuffixes) {
      if (s1.endsWith(suffix)) {
        const root1 = s1.slice(0, -suffix.length);
        if (s2.startsWith(root1) && s2.length - root1.length <= 2) {
          return 0.85;
        }
      }
      if (s2.endsWith(suffix)) {
        const root2 = s2.slice(0, -suffix.length);
        if (s1.startsWith(root2) && s1.length - root2.length <= 2) {
          return 0.85;
        }
      }
    }

    // Simple Levenshtein-like similarity for close matches
    if (Math.abs(s1.length - s2.length) <= 2) {
      let matches = 0;
      const minLength = Math.min(s1.length, s2.length);
      for (let i = 0; i < minLength; i++) {
        if (s1[i] === s2[i]) matches++;
      }
      const similarity = matches / Math.max(s1.length, s2.length);
      if (similarity > 0.7) return similarity;
    }

    return 0;
  }

  function smartEntityDedup(entities, threshold = 0.7) {
    const groups = [];

    entities.forEach(({ entity, count }) => {
      let bestMatch = null;
      let bestSimilarity = 0;

      for (const group of groups) {
        const sim = similarity(entity, group.canonical);
        if (sim >= threshold && sim > bestSimilarity) {
          bestMatch = group;
          bestSimilarity = sim;
        }
      }

      if (bestMatch) {
        // Add to existing group
        bestMatch.count += count;
        bestMatch.variants.push({ entity, count });

        // Update canonical to the one with highest count
        if (count > bestMatch.canonicalCount) {
          bestMatch.canonical = entity;
          bestMatch.canonicalCount = count;
        }
      } else {
        // Create new group
        groups.push({
          canonical: entity,
          canonicalCount: count,
          count: count,
          variants: [{ entity, count }],
        });
      }
    });

    return groups
      .map((group) => ({
        entity: group.canonical,
        count: group.count,
        mergedFrom: group.variants.length > 1 ? group.variants : undefined,
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Process your data
  const result = smartEntityDedup(topEntities);
  console.log("Processed top entities:", result);
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
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={result} layout="vertical">
            <XAxis
              type="number"
              stroke="#ccc"
              fontSize={12}
              axisLine={true}
              tickLine={true}
            />
            <YAxis
              dataKey="entity"
              type="category"
              stroke="#ccc"
              width={90}
              fontSize={11}
              axisLine={true}
              tickLine={true}
              interval={0}
            />
            {/* Fixed CartesianGrid - only vertical lines to avoid crossings */}
            <CartesianGrid
              strokeDasharray="10 10"
              stroke="#fff"
              strokeOpacity={1}
              horizontal={false}
              vertical={true}
            />
            <Tooltip
              formatter={(value, name) => [value, name, ""]}
              labelFormatter={(label) => label}
              cursor={{
                fill: "#1e293b", // dark background
                opacity: 0.3,
              }}
              contentStyle={{
                backgroundColor: "#1f2937", // darker background (tailwind gray-800)
                border: "1px solid #4b5563",
                border: "none",
                borderRadius: "4px",
                fontSize: "11px",
                padding: "2px 6px",
                minHeight: "auto",
                lineHeight: "1.2",
              }}
              itemStyle={{ color: "#fff", padding: "0" }}
              labelStyle={{ color: "#fff", margin: "0", padding: "0" }}
            />
            <Bar
              dataKey="count"
              fill="rgba(96, 165, 250,0.7)"
              radius={[0, 3, 3, 0]}
            />
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
