import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { day: 'Sun', targets: 60 },
  { day: 'Mon', targets: 35 },
  { day: 'Tue', targets: 20 },
  { day: 'Wed', targets: 75 },
  { day: 'Thu', targets: 40 },
  { day: 'Fri', targets: 30 },
  { day: 'Sat', targets: 70 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black bg-opacity-60 text-white text-sm px-2 py-1 rounded">
        <p>{`${payload[0].value} targets`}</p>
      </div>
    );
  }

  return null;
};

export default function DailyTargetsChart() {
  return (
    <div className="bg-black bg-opacity-20 backdrop-blur-xl text-white p-4 rounded-2xl shadow-lg w-full max-w-md">
      <h2 className="text-lg font-semibold mb-4">Daily Targets</h2>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTargets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="targets"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorTargets)"
            dot={{ stroke: '#fff', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
