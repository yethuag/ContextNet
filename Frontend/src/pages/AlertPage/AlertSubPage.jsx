import React from 'react';

const AlertSubPage = ({ selectedTag = { tag: "Bullying" }, onBack }) => {
  const feedsData = [
    {
      id: 1,
      text: "I've been dreading going to Lincoln High School every morning. There's this group of students — mostly led by Jake and a girl named Tiffany — who won't stop picking on me. It started with stupid comments in the hallway, but now they've started spreading rumors online and making fun of my clothes on Snapchat."
    },
    {
      id: 2,
      text: "I honestly don't know how much more of this I can take. Every single day at Jefferson Middle School, I'm either being tripped, shoved into lockers, or called names like 'fat freak' or 'big girl' by a group of eighth graders — mostly Jason, Marcus, and Emily."
    },
    {
      id: 3,
      text: "I thought joining the Discord server for our school gaming club would be fun, but it turned into a nightmare. At first, it was harmless teasing, but soon people started targeting me whenever I said anything. Liam, Roxy, and Zane made a whole private channel just to mock everything I posted. They edited my profile pic into memes and called me 'Cringe Queen' and 'Discord Dumpster' in front of everyone. Last night, Zane posted screenshots from my old Instagram account and tagged them with #TryHardTrash. I begged them to stop, but they just laughed and said, 'It's just jokes — grow a spine.'"
    }
  ];

  const entitiesData = [
    { name: "Lincoln High School", type: "ORG" },
    { name: "morning", type: "TIME" },
    { name: "Snapchat", type: "PRODUCT" },
    { name: "Jake", type: "PERSON" },
    { name: "Tiffany", type: "PERSON" },
    { name: "Jefferson Middle School", type: "ORG" },
    { name: "Jason", type: "PERSON" },
    { name: "Marcus", type: "PERSON" },
    { name: "Emily", type: "PERSON" },
    { name: "Discord", type: "PRODUCT" },
    { name: "school", type: "LOC" },
    { name: "Liam", type: "PERSON" },
    { name: "Roxy", type: "PERSON" },
    { name: "Zane", type: "PERSON" },
    { name: "Last night", type: "TIME" },
    { name: "Instagram", type: "PRODUCT" }
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case "ORG": return "text-red-400";
      case "TIME": return "text-orange-400";
      case "PRODUCT": return "text-purple-400";
      case "PERSON": return "text-green-400";
      case "LOC": return "text-yellow-400";
      default: return "text-blue-400";
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Alert tag */}
        <div className="mb-6">
          <div className="bg-gray-800 p-4 rounded border border-gray-700 flex items-center justify-between">
            <span className="text-white text-lg">{selectedTag.tag}</span>
            <button className="text-gray-400 hover:text-white text-xl">×</button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-medium text-white mb-4">Feeds</h2>
            <div className="space-y-4">
              {feedsData.map((feed) => (
                <div key={feed.id} className="bg-gray-800 p-6 rounded border border-gray-700">
                  <p className="text-gray-300 leading-relaxed">{feed.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-medium text-white mb-4">Entities</h2>
            <div className="bg-gray-800 p-6 rounded border border-gray-700">
              <div className="space-y-3">
                {entitiesData.map((entity, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className={`${getTypeColor(entity.type)} text-sm`}>
                      {entity.name}
                    </span>
                    <span className={`${getTypeColor(entity.type)} text-xs font-medium`}>
                      {entity.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertSubPage;