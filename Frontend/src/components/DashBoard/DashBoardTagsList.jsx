import React, { useState, useEffect } from "react";

const entityLabelStyles = {
  PERSON: "bg-green-200 text-green-800",
  ORG: "bg-blue-200 text-blue-800",
  GPE: "bg-purple-200 text-purple-800",
  LOC: "bg-yellow-200 text-yellow-800",
  TIME: "bg-orange-200 text-orange-800",
  PRODUCT: "bg-pink-200 text-pink-800",
  NORP: "bg-indigo-200 text-indigo-800",
  CARDINAL: "bg-gray-200 text-gray-800",
  VIOLENT_ACT: "bg-red-200 text-red-800",
  default: "bg-gray-200 text-gray-800",
};

const TagsList = ({ alerts }) => {
  const [screenSize, setScreenSize] = useState("lg");

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize("sm");
      else if (width < 768) setScreenSize("md");
      else if (width < 1024) setScreenSize("lg");
      else setScreenSize("xl");
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const map = {};

  alerts.forEach((alert) => {
    const ents = alert.entities || [];
    (alert.activities || []).forEach((act) => {
      if (!map[act]) {
        map[act] = { count: 0, entities: [] };
      }
      map[act].count += 1;

      ents.forEach((e) => {
        if (
          !map[act].entities.some(
            (x) => x.text === e.text && x.label === e.label
          )
        ) {
          map[act].entities.push(e);
        }
      });
    });
  });

  const rows = Object.entries(map)
    .map(([activity, { count, entities }], i) => ({
      id: i + 1,
      activity,
      count,
      entities: entities.slice(0, 5),
    }))
    .sort((a, b) => b.count - a.count);

  const TableView = () => (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-gray-600/40">
              <th className="py-2 px-1 sm:px-2 md:px-3 text-gray-400 text-xs sm:text-sm w-8 sm:w-12">
                #
              </th>
              <th className="py-2 px-1 sm:px-2 md:px-3 text-gray-400 text-xs sm:text-sm min-w-[100px] sm:min-w-[140px]">
                Activity
              </th>
              <th className="py-2 px-1 sm:px-2 md:px-3 text-gray-400 text-xs sm:text-sm w-12 sm:w-16 text-center">
                Count
              </th>
              <th className="py-2 px-1 sm:px-2 md:px-3 text-gray-400 text-xs sm:text-sm min-w-[120px] sm:min-w-[180px]">
                Entities
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-gray-500 text-sm"
                >
                  No activity tags
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-gray-700/20 transition-colors border-b border-gray-700/30"
              >
                <td className="py-2 px-2 text-center text-gray-300 text-xs">
                  {r.id}
                </td>
                <td className="py-2 px-2 text-white text-xs break-words">
                  {r.activity}
                </td>
                <td className="py-2 px-2 text-center text-white text-xs">
                  {r.count}
                </td>
                <td className="py-2 px-2">
                  <div className="flex flex-wrap gap-1">
                    {r.entities
                      .slice(0, screenSize === "lg" ? 2 : 3)
                      .map((ent, idx) => {
                        const style =
                          entityLabelStyles[ent.label] ||
                          entityLabelStyles.default;
                        return (
                          <span
                            key={idx}
                            className={`${style} inline-block px-1.5 py-0.5 rounded-full text-xs`}
                            title={ent.text}
                          >
                            <span className="truncate inline-block max-w-[100px]">
                              {ent.text}
                            </span>
                          </span>
                        );
                      })}
                    {r.entities.length > (screenSize === "lg" ? 2 : 3) && (
                      <span className="text-gray-400 text-xs self-center">
                        +{r.entities.length - (screenSize === "lg" ? 2 : 3)}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border border-gray-600/30 w-full overflow-hidden shadow-xl sm:shadow-2xl">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-white text-base sm:text-lg md:text-xl font-medium">
          Activity Tags
        </h3>
      </div>

      <div className="mb-2 sm:mb-3">
        <span className="text-gray-400 text-xs">
          Screen: {screenSize} | {rows.length} activities
        </span>
      </div>

      <TableView />
    </div>
  );
};

export default TagsList;
