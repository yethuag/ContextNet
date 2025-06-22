import React, { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";

const API_BASE = "http://localhost:8001";

const severityRank = { low: 1, medium: 2, high: 3 };
const severityBadge = {
  low: {
    label: "LOW",
    className: "bg-green-900/20 text-green-400 border-green-700/50",
  },
  medium: {
    label: "MEDIUM",
    className: "bg-yellow-900/20 text-yellow-400 border-yellow-700/50",
  },
  high: {
    label: "HIGH",
    className: "bg-red-900/20 text-red-400 border-red-700/50",
  },
};

function safeFormat(date, fmt) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  return format(d, fmt);
}

const AlertTagsList = ({ date, onTagClick }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Always call hooks first!
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Validate date before formatting
    if (!date || isNaN(new Date(date))) {
      setError("Invalid or missing date.");
      setLoading(false);
      return;
    }

    let day = format(new Date(date), "yyyy-MM-dd");
    fetch(`${API_BASE}/alerts?date=${day}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setAlerts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load alerts:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [date]);

  const rows = useMemo(() => {
    if (!alerts.length) return [];
    const map = {};
    alerts.forEach((a) => {
      const sev = a.severity_band || "low";
      const ents = a.entities || [];
      const acts = a.activities || ["other"];
      acts.forEach((act) => {
        if (!map[act]) {
          map[act] = { count: 0, maxSeverity: sev, entities: new Set() };
        }
        map[act].count += 1;
        if (severityRank[sev] > severityRank[map[act].maxSeverity]) {
          map[act].maxSeverity = sev;
        }
        ents.forEach((e) => {
          if (e && e.text) map[act].entities.add(e.text);
        });
      });
    });
    const total = alerts.length;
    return Object.entries(map)
      .map(([activity, { count, maxSeverity, entities }], idx) => ({
        id: idx + 1,
        activity,
        count,
        percentage: `${Math.round((count / total) * 100)}%`,
        maxSeverity,
        badge: severityBadge[maxSeverity],
        entities: Array.from(entities).slice(0, 5),
      }))
      .filter((r) => r.maxSeverity !== "low")
      .sort((a, b) => {
        const diff = severityRank[b.maxSeverity] - severityRank[a.maxSeverity];
        return diff || b.count - a.count;
      });
  }, [alerts]);

  // Now render based on state
  if (error) {
    return (
      <div className="p-6 bg-red-900/80 rounded-xl text-center text-white">
        Error: {error}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="p-6 bg-gray-800 rounded-xl text-center text-gray-400">
        Loading tags…
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="p-6 bg-gray-800 rounded-xl text-center text-gray-400">
        No activity tags for {safeFormat(date, "do MMM yyyy")}
      </div>
    );
  }

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/30 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-lg font-medium">Activity Tags</h3>
        <span className="text-gray-400 text-sm">
          {safeFormat(date, "do MMM yyyy")}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-600/40">
              <th className="py-2 px-3 text-gray-400">#</th>
              <th className="py-2 px-3 text-gray-400">Activity</th>
              <th className="py-2 px-3 text-gray-400">Severity</th>
              <th className="py-2 px-3 text-gray-400">% of Alerts</th>
              <th className="py-2 px-3 text-gray-400">Count</th>
              <th className="py-2 px-3 text-gray-400">Entities</th>
            </tr>
          </thead>
          <tbody className="max-h-64 overflow-auto">
            {rows.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-gray-700/20 transition-colors border-b last:border-b-0"
              >
                <td className="py-3 px-3 text-gray-300">{r.id}</td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => onTagClick(r.activity)}
                    className="text-white font-medium hover:underline"
                  >
                    {r.activity}
                  </button>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${r.badge.className}`}
                  >
                    {r.badge.label}
                  </span>
                </td>
                <td className="py-3 px-3 text-white">{r.percentage}</td>
                <td className="py-3 px-3 text-white">{r.count}</td>
                <td className="py-3 px-3 text-white space-x-1">
                  {r.entities.map((ent, i) => (
                    <span
                      key={i}
                      className="inline-block bg-blue-700/20 text-blue-300 px-2 py-1 rounded-full text-xs"
                    >
                      {ent}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertTagsList;