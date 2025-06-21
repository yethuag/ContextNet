const AlertSubPage = ({selectedTag}) => {
  return (
    <>
    <div>
    <h1 className="text-3xl font-bold text-white mb-6">
     Alert Sub Page - {selectedTag?.tag}
    </h1>
    </div>
    </>
  )
}

export default AlertSubPage