import React from 'react';

const MetricCards = ({ alerts }) => {
  // Total alerts
  const total = alerts.length;

  // Count by severity
  const severityCounts = alerts.reduce(
    (acc, { severity_band }) => {
      acc[severity_band] = (acc[severity_band] || 0) + 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0 }
  );

  // Count unique activities
  const activitySet = new Set();
  alerts.forEach((a) => (a.activities || []).forEach((act) => activitySet.add(act)));
  const uniqueActivities = activitySet.size;

  const cards = [
    {
      title: 'Total Alerts',
      value: total,
      color: 'text-indigo-400',
    },
    {
      title: 'High Severity',
      value: severityCounts.high,
      color: 'text-red-400',
    },
    {
      title: 'Unique Activities',
      value: uniqueActivities,
      color: 'text-green-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105"
        >
          <h3 className="text-white text-xl font-medium mb-2">{card.title}</h3>
          <p className={`text-4xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default MetricCards;
