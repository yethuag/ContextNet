import DisplayCalender from "../../components/DisplayCalender";
import TagsList from "../../components/TagsList";
import { useState } from "react";
import AlertSubPage from "./AlertSubPage";

const AlertPage = () => {
  const [tag,setTag] = useState(null);
  const [selectedTag,setSelecetedTag] = useState('alert_main')
  const handleTag = (tag) => {
    setTag(tag)
    setSelecetedTag('alert_tag')
  }
  if(selectedTag === 'alert_tag'){
    return (
        <AlertSubPage selectedTag={tag}/>
    )
  }
  
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
            <TagsList onTagClick={handleTag}/>
        </div>
    </>
  );
};

export default AlertPage;
