export const MetricCards = () => {
  const metrics = [
    {
      title: 'Bullying',
      value: '40',
      color: 'text-blue-400'
    },
    {
      title: 'Violence', 
      value: '24',
      color: 'text-purple-400'
    },
    {
      title: 'LGBTQ+',
      value: '19', 
      color: 'text-blue-300'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
      {metrics.map((metric, index) => (
        <div 
          key={metric.title}
          className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105">
            
          <h3 className="text-white text-4xl font-medium mb-2">{metric.title}</h3>
          <p className={`text-4xl font-bold ${metric.color}`}>{metric.value}</p>
        </div>
      ))}
    </div>
  );
};

export default MetricCards