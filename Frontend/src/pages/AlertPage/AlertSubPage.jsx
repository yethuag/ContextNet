const AlertSubPage = ({selectedTag,onBack}) => {
  return (
    <>
    <div className="bg-gray-900 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2"
          >
            ← Back to Alert Page
          </button>
        </div>
        
        <div className="bg-gray-800/95 backdrop-blur-sm p-8 rounded-2xl border border-gray-600/30">
          <h1 className="text-3xl font-bold text-white mb-6">
            Alert Sub Page - {selectedTag?.tag}
          </h1>
        </div>
      </div>
    </div>
    </>
  )
}

export default AlertSubPage