export const TagsList = () => {
  const tableData = [
    { id: 1, tag: 'Bullying', quantity: '40', percentage: '40%' },
    { id: 2, tag: 'Discrimination', quantity: '24', percentage: '15%' },
    { id: 3, tag: 'LGBTQ+', quantity: '19', percentage: '5%' }
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 ">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-lg font-medium">List of Tags</h3>
        <span className="text-gray-400 text-sm">May to June 2021</span>
      </div>
      
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-4 text-gray-400 text-sm pb-2 border-b border-gray-700">
          <span></span>
          <span>Violence Tag</span>
          <span>Quantity</span>
          <span>Percentage</span>
        </div>
        
        {tableData.map((item) => (
          <div key={item.id} className="grid grid-cols-4 gap-4 items-center py-2 hover:bg-gray-700 rounded transition-colors">
            <span className="text-gray-400">{item.id}</span>
            <span className="text-white">{item.tag}</span>
            <span className="bg-gray-700 px-2 py-1 rounded text-center text-sm">
              {item.quantity}
            </span>
            <span className="text-white">{item.percentage}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagsList