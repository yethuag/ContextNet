import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

export const PieChartSection = () => {
  const pieData = [
    { name: 'Bullying', value: 25, color: '#F87171' },       
    { name: 'LGBTQ', value: 20, color: '#FBBF24' },          
    { name: 'Others', value: 20, color: '#FCD34D' },          
    { name: 'Violence', value: 35, color: '#60A5FA' }         
  ];

  return (
    <div className="bg-gray-800 p-6 md:row-1 rounded-xl border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-white text-xl font-bold">Pie Chart</h3>
          
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"

              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ percent }) => `${(percent * 100).toFixed(1)}%`}>
                
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 mt-4">
        {pieData.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-white text-sm">{item.name}</span>
            </div>
            <span className="text-gray-400 text-sm">{item.value} times</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChartSection;
