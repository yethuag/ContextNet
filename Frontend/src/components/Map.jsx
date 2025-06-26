import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = "http://localhost:8001";

const LeafletMap = ({ date }) => {
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    const day = date.toISOString().slice(0, 10);
    fetch(`${API_BASE}/map/geojson?date=${day}`)
      .then((r) => r.json())
      .then((geojson) => {
        setFeatures(geojson.features || []);
      })
      .catch(console.error);
  }, [date]);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={3}
      minZoom={3}
      maxZoom={6}
      scrollWheelZoom={true}
      style={{ height: "min(600px, 60vh)", borderRadius: "1rem" }}
      worldCopyJump={false}
      maxBoundsViscosity={1.0}
      maxBounds={[
        [-90, -180],
        [90, 180],
      ]}
      bounds={[
        [-60, -170],
        [80, 170],
      ]}
    >
      {/* Dark Matter basemap */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &mdash; &copy; OpenStreetMap contributors'
        // noWrap={true}
      />

      {features.map((feat) => {
        const [lon, lat] = feat.geometry.coordinates;
        return (
          <CircleMarker
            key={feat.properties.id}
            center={[lat, lon]}
            radius={6}
            pathOptions={{
              color: "#F87171",
              fillColor: "#F87171",
              fillOpacity: 0.8,
            }}
          >
            <Popup>
              <strong>{feat.properties.title}</strong>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default LeafletMap;
