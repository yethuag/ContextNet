import React from "react";

const severityRank = { low: 1, medium: 2, high: 3 };
const severityColor = {
  low:    "bg-green-900/20 text-green-400 border-green-700/50",
  medium: "bg-yellow-900/20 text-yellow-400 border-yellow-700/50",
  high:   "bg-red-900/20 text-red-400 border-red-700/50",
};

// Map NER labels to Tailwind bg/text color combos
const entityLabelStyles = {
  PERSON:   "bg-green-200 text-green-800",
  ORG:      "bg-blue-200 text-blue-800",
  GPE:      "bg-purple-200 text-purple-800",
  LOC:      "bg-yellow-200 text-yellow-800",
  TIME:     "bg-orange-200 text-orange-800",
  PRODUCT:  "bg-pink-200 text-pink-800",
  NORP:     "bg-indigo-200 text-indigo-800",
  CARDINAL: "bg-gray-200 text-gray-800",
  VIOLENT_ACT: "bg-red-200 text-red-800",
  default:  "bg-gray-200 text-gray-800",
};

const TagsList = ({ alerts }) => {
  // Aggregate by activity and collect entities
  const map = {};

  alerts.forEach((alert) => {
    const sev = alert.severity_band || "low";
    const ents = alert.entities || [];
    (alert.activities || []).forEach((act) => {
      if (!map[act]) {
        map[act] = { count: 0, maxSeverity: sev, entities: [] };
      }
      map[act].count += 1;
      if (severityRank[sev] > severityRank[map[act].maxSeverity]) {
        map[act].maxSeverity = sev;
      }
      // Add each entity object (avoid duplicates)
      ents.forEach((e) => {
        if (!map[act].entities.some(x => x.text === e.text && x.label === e.label)) {
          map[act].entities.push(e);
        }
      });
    });
  });

  // Prepare rows sorted by severity
  const rows = Object.entries(map)
    .map(([activity, { count, maxSeverity, entities }], i) => ({
      id: i + 1,
      activity,
      count,
      maxSeverity,
      percentage: `${Math.round((count / alerts.length) * 100)}%`,
      entities: entities.slice(0, 5), // show up to 5
    }))
    .sort((a, b) => severityRank[b.maxSeverity] - severityRank[a.maxSeverity]);

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/30 w-full overflow-hidden shadow-2xl">
      <h3 className="text-white text-lg font-medium mb-4">Activity Tags</h3>
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  No activity tags
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-gray-700/20 transition-colors border-b border-gray-700/30"
              >
                <td className="py-3 px-3 text-gray-300">{r.id}</td>
                <td className="py-3 px-3 text-white">{r.activity}</td>
                <td className="py-3 px-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${severityColor[r.maxSeverity]}`}
                  >
                    {r.maxSeverity.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-3 text-white">{r.percentage}</td>
                <td className="py-3 px-3 text-white">{r.count}</td>
                <td className="py-3 px-3">
                  {r.entities.map((ent, idx) => {
                    const style = entityLabelStyles[ent.label] || entityLabelStyles.default;
                    return (
                      <span
                        key={idx}
                        className={`${style} inline-block px-2 py-1 rounded-full text-xs mr-1 mb-1`}
                      >
                        {ent.text}
                      </span>
                    );
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TagsList;
