import React from "react";
import DisplayCalender from "../../components/DisplayCalender";
import Map from "../../components/Map";
const TrendPage = () => {
  return (
    <>
      <div className="flex justify-center items-center">
        <div className="flex-2">
          <DisplayCalender />
        </div>
        <div className="flex-2">
          <h1 className="text-4xl font-bold text-purple-400">Trending</h1>
        </div>
      </div>
      <Map />
    </>
  );
};

export default TrendPage;
