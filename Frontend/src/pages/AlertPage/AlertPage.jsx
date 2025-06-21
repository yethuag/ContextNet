import React from "react";
import DisplayCalender from "../../components/DisplayCalender";
const AlertPage = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="flex-2">
      <DisplayCalender />
      </div>
      <div className="flex-2">
      <h1 className='text-2xl font-bold text-white'>Alert Page</h1>
      </div>
           {/* main for alert */}
    </div>
  );
};

export default AlertPage;
