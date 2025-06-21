const TagsList = () => {
  const tableData = [
    {
      id: 1,
      tag: 'Bullying',
      status: 'Active',
      percentage: '34%',
      quantity: '68',
      ent_tags: ['Noun']
    },
    {
      id: 2,
      tag: 'Discrimination',
      status: 'Inactive',
      percentage: '22%',
      quantity: '44',
      ent_tags: ['Noun']
    },
    {
      id: 3,
      tag: 'LGBTQ+',
      status: 'Active',
      percentage: '18%',
      quantity: '36',
      ent_tags: ['Noun']
    },
    {
      id: 4,
      tag: 'Violence',
      status: 'Active',
      percentage: '26%',
      quantity: '52',
      ent_tags: ['Noun']
    },
    {
      id: 5,
      tag: 'Harassment',
      status: 'Active',
      percentage: '45%',
      quantity: '89',
      ent_tags: ['Noun']
    },
    {
      id: 6,
      tag: 'Racism',
      status: 'Inactive',
      percentage: '31%',
      quantity: '67',
      ent_tags: ['Noun']
    },
    {
      id: 7,
      tag: 'Cyberbullying',
      status: 'Active',
      percentage: '29%',
      quantity: '154',
      ent_tags: ['Noun']
    },
    {
      id: 8,
      tag: 'Hate Speech',
      status: 'Active',
      percentage: '38%',
      quantity: '92',
      ent_tags: ['Noun']
    },
    {
      id: 9,
      tag: 'Body Shaming',
      status: 'Inactive',
      percentage: '16%',
      quantity: '43',
      ent_tags: ['Noun']
    }
  ];

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/30 w-full max-w-full overflow-hidden shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-lg font-medium">List of Tags</h3>
        {/* <span className="text-gray-400 text-sm">{new Date().toLocaleDateString()}</span> */}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600/40">
              <th className="text-left text-gray-400 text-sm font-medium py-4 w-16">ID</th>
              <th className="text-left text-gray-400 text-sm font-medium py-4 w-40">Violence Tag</th>
              <th className="text-left text-gray-400 text-sm font-medium py-4 w-28">Status</th>
              <th className="text-left text-gray-400 text-sm font-medium py-4 w-20">%</th>
              <th className="text-left text-gray-400 text-sm font-medium py-4 w-28 flex items-center gap-1">
                Quantity
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </th>
              <th className="text-left text-gray-400 text-sm font-medium py-4">Tags</th>
            </tr>
          </thead>
        </table>
        
        <div className="max-h-64 overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#4b5563 #1f2937'}}>
          <table className="w-full">
            <tbody>
              {tableData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-700/20 transition-colors border-b border-gray-700/30 last:border-b-0">
                  <td className="text-gray-300 text-sm font-medium py-5 w-16">{item.id}</td>
                  <td className="text-white text-sm font-medium py-5 w-40">
                    {item.tag}
                    </td>
                  <td className="py-5 w-28">
                    <span className={`px-4 py-2 rounded-lg text-xs font-medium border ${
                      item.status === 'Active' 
                        ? 'bg-red-900/20 text-red-400 border-red-700/50' 
                        : 'bg-teal-900/20 text-teal-400 border-teal-700/50'
                    }`}>
                      {item.status === 'Active' ? 'High' : 'Medium'}
                    </span>
                  </td>
                  <td className="text-white text-sm font-medium py-5 w-20">{item.percentage}</td>
                  <td className="text-white text-sm font-medium py-5 w-28">{item.quantity}</td>
                  <td className="py-5">
                    <span className="bg-gray-700/50 text-gray-300 px-4 py-2 rounded-lg text-xs font-medium border border-gray-600/50">
                      {item.ent_tags}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TagsList;