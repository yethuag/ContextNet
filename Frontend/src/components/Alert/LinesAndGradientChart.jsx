import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const data = [
  { time: '8:00am', firstTime: 30, returning: 20 },
  { time: '12:00pm', firstTime: 50, returning: 70 },
  { time: '4:00pm', firstTime: 40, returning: 45 },
  { time: '8:00pm', firstTime: 25, returning: 60 },
  { time: '12:00am', firstTime: 50, returning: 35 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black bg-opacity-60 text-white text-sm px-2 py-1 rounded">
        {payload.map((entry, index) => (
          <p key={index}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function LinesAndGradientChart() {
  return (
    <div className="bg-black bg-opacity-20 backdrop-blur-xl text-white p-4 rounded-2xl shadow-lg w-full max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Lines and gradient</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorFirst" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorReturning" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis dataKey="time" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="firstTime"
            stroke="#f87171"
            fill="url(#colorFirst)"
            name="First Time"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="returning"
            stroke="#34d399"
            fill="url(#colorReturning)"
            name="Returning"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex justify-start mt-4 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400" /> First
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400" /> Return
        </div>
      </div>
    </div>
  );
}
