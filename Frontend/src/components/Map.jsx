import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Your country data for popup and colors
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
            data: null, // Will load data later from your custom.geo.json
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
                ["has", ["get", "ISO_A3"], ["literal", colorMap]],
                ["get", ["get", "ISO_A3"], ["literal", colorMap]],
                "#64748b", // fallback color for countries not in colorMap
              ],
              "fill-opacity": 0.8,
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
              "fill-opacity": 0.2,
            },
            filter: ["==", "ISO_A3", ""], // initially no hover
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

      // Load your realistic countries GeoJSON file
      fetch("../public/data/custom.geo.json")
        .then((response) => response.json())
        .then((geojson) => {
          if (map.current.getSource("world-countries")) {
            map.current.getSource("world-countries").setData(geojson);
          }
        })
        .catch((err) => console.error("Failed to load GeoJSON:", err));

      // Mouse hover behavior
      map.current.on("mouseenter", "countries-fill", (e) => {
        map.current.getCanvas().style.cursor = "pointer";
        const feature = e.features[0];

        // Adjust this if your geojson uses a different property name
        const countryCode = feature.properties.iso_a3_eh;

        const country = countryData[countryCode];

        if (country) {
          map.current.setFilter("countries-hover", [
            "==",
            "ISO_A3",
            countryCode,
          ]);

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
      });

      // Mouse leave behavior
      map.current.on("mouseleave", "countries-fill", () => {
        map.current.getCanvas().style.cursor = "";
        map.current.setFilter("countries-hover", ["==", "ISO_A3", ""]);
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
        }
        .country-popup .maplibregl-popup-tip {
          border-top-color: #667eea;
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

      <h1 className="text-4xl font-bold text-center mb-6 text-white">
        🗺️ Interactive World Map
      </h1>

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
