import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const countryData = {
    USA: { name: "United States", word: "Freedom", color: "#ff6b6b" },
    CAN: { name: "Canada", word: "Maple", color: "#4ecdc4" },
    BRA: { name: "Brazil", word: "Carnival", color: "#96ceb4" },
    RUS: { name: "Russia", word: "Vodka", color: "#ee5a24" },
    CHN: { name: "China", word: "Dragon", color: "#0abde3" },
    AUS: { name: "Australia", word: "Mate", color: "#1dd1a1" },
    IND: { name: "India", word: "Spice", color: "#feca57" },
    FRA: { name: "France", word: "Croissant", color: "#54a0ff" },
    DEU: { name: "Germany", word: "Efficiency", color: "#5f27cd" },
    GBR: { name: "United Kingdom", word: "Tea", color: "#ff9ff3" },
  };

  // Prepare color map for fill colors in the map style
  const colorMap = {};
  Object.entries(countryData).forEach(([code, data]) => {
    colorMap[code] = data.color;
  });

  useEffect(() => {
    if (map.current) return; // prevent re-initializing

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "world-countries": {
            type: "geojson",
            data: null,
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#0f172a" },
          },
          {
            id: "countries-fill",
            type: "fill",
            source: "world-countries",
            paint: {
              "fill-color": [
                "case",
                ["has", ["get", "iso_a3_eh"], ["literal", colorMap]],
                ["get", ["get", "iso_a3_eh"], ["literal", colorMap]],
                "#64748b",
              ],
              "fill-opacity": 0.8,
              "fill-opacity-transition": {
                duration: 200,
                delay: 0,
              },
            },
          },
          {
            id: "countries-border",
            type: "line",
            source: "world-countries",
            paint: {
              "line-color": "rgba(255, 255, 255, 0.3)",
              "line-width": 0.5,
            },
          },
          {
            id: "countries-hover",
            type: "fill",
            source: "world-countries",
            paint: {
              "fill-color": "#ffffff",
              "fill-opacity": 0,
              "fill-opacity-transition": {
                duration: 200,
                delay: 0,
              },
            },
            filter: ["==", "iso_a3_eh", ""], // initially no hover
          },
        ],
      },
      center: [0, 20],
      zoom: 1.5,
      maxZoom: 8,
      minZoom: 1,
    });

    popup.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "country-popup",
    });

    map.current.on("load", () => {
      setMapLoaded(true);
      map.current.addControl(new maplibregl.NavigationControl(), "top-right");

      fetch("../public/data/custom.geo.json")
        .then((response) => response.json())
        .then((geojson) => {
          if (map.current.getSource("world-countries")) {
            map.current.getSource("world-countries").setData(geojson);
          }
        })
        .catch((err) => console.error("Failed to load GeoJSON:", err));

      let currentHoveredCountry = null;

      // Mouse hover behavior
      const handleCountryHover = (e) => {
        const feature = e.features[0];
        const countryCode = feature.properties.iso_a3_eh;

        // Only update if we're hovering over a different country
        if (currentHoveredCountry !== countryCode) {
          // Clear previous hover state
          if (currentHoveredCountry) {
            map.current.setPaintProperty("countries-hover", "fill-opacity", 0);
          }

          currentHoveredCountry = countryCode;
          const country = countryData[countryCode];

          if (country) {
            map.current.setFilter("countries-hover", [
              "==",
              "iso_a3_eh",
              countryCode,
            ]);

            map.current.setPaintProperty(
              "countries-hover",
              "fill-opacity",
              0.2
            );

            const popupContent = `
              <div class="popup-content">
                <h3 class="popup-title">${country.name}</h3>
                <p class="popup-word">"${country.word}"</p>
              </div>
            `;
            popup.current
              .setLngLat(e.lngLat)
              .setHTML(popupContent)
              .addTo(map.current);
          }
        }
      };

      map.current.on("mouseenter", "countries-fill", (e) => {
        map.current.getCanvas().style.cursor = "pointer";
        handleCountryHover(e);
      });

      map.current.on("mousemove", "countries-fill", handleCountryHover);

      // Mouse leave behavior
      map.current.on("mouseleave", "countries-fill", () => {
        map.current.getCanvas().style.cursor = "";
        currentHoveredCountry = null;
        map.current.setPaintProperty("countries-hover", "fill-opacity", 0);
        setTimeout(() => {
          map.current.setFilter("countries-hover", ["==", "iso_a3_eh", ""]);
        }, 200);
        popup.current.remove();
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-900 p-4">
      <style>{`
        .country-popup .maplibregl-popup-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          transition: all 0.2s ease-in-out;
          transform: scale(0.95);
          opacity: 0;
          animation: popupFadeIn 0.2s ease-out forwards;
        }
        
        @keyframes popupFadeIn {
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .country-popup .maplibregl-popup-tip {
          border-top-color: #667eea;
          transition: all 0.2s ease-in-out;
        }
        .popup-content {
          padding: 12px 16px;
          color: white;
          text-align: center;
        }
        .popup-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
        }
        .popup-word {
          margin: 0;
          font-size: 14px;
          font-style: italic;
          opacity: 0.9;
        }
      `}</style>

      <div
        ref={mapContainer}
        className="rounded-2xl border border-slate-700 shadow-lg"
        style={{ height: "600px" }}
      />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-xl">Loading Map...</div>
        </div>
      )}

      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={() => map.current?.flyTo({ center: [0, 20], zoom: 1.5 })}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          🌍 Reset View
        </button>
        <button
          onClick={() => map.current?.flyTo({ center: [105, 35], zoom: 3 })}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          📍 Focus on China
        </button>
      </div>
    </div>
  );
};

export default Map;
