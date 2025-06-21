import DisplayCalender from "../../components/DisplayCalender";
import TagsList from "../../components/TagsList";


const AlertPage = () => {
  return (
    <>
        <div className="flex justify-center items-center">
            <div className="flex-2">
            <DisplayCalender />
            </div>
            <div className="flex-2">
            <h1 className='text-2xl font-bold text-white'>Alert Page</h1>
            </div>
        </div>
        {/* main for alert */}
        <div className="w-full max-w-xl mx-auto mt-6 rounded-xl shadow-lg p-6">
            <TagsList/>
        </div>
    </>
  );
};

export default AlertPage;
