import React from 'react'
import DisplayCalender from "../../components/DisplayCalender";
const AlertPage = () => {
  return (

    <div>
      {/* alert calender nav */}
      <div className='flex justify-between items-center p-4'>
        <div className='flex-2'>
          <DisplayCalender />
        </div>
        <div className='flex-2'>
          <h1 className='text-2xl font-bold text-white'>Alert Page</h1>
        </div>
      </div>

    </div>
  )
}

export default AlertPage