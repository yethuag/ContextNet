import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import HighlightedText from "../../components/HighlightedText";
import LoadingScreen from "../../components/LoadingScreen";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const API_BASE = "http://localhost:8001";

const ENTITY_STYLES = {
  PERSON: "bg-green-200 text-green-800",
  NORP: "bg-indigo-200 text-indigo-800",
  FAC: "bg-teal-200 text-teal-800",
  ORG: "bg-blue-200 text-blue-800",
  GPE: "bg-purple-200 text-purple-800",
  LOC: "bg-yellow-200 text-yellow-800",
  PRODUCT: "bg-pink-200 text-pink-800",
  EVENT: "bg-orange-200 text-orange-800",
  WORK_OF_ART: "bg-red-100 text-red-900",
  LAW: "bg-yellow-200 text-yellow-800",
  LANGUAGE: "bg-blue-100 text-blue-900",
  DATE: "bg-green-100 text-green-900",
  TIME: "bg-orange-100 text-orange-900",
  PERCENT: "bg-pink-100 text-pink-900",
  MONEY: "bg-green-200 text-green-900",
  QUANTITY: "bg-purple-100 text-purple-900",
  ORDINAL: "bg-yellow-100 text-yellow-900",
  CARDINAL: "bg-gray-200 text-gray-800",
  VIOLENT_ACT: "bg-red-200 text-red-800",
  WEAPON: "bg-rose-200 text-rose-800",
  INJURY: "bg-red-100 text-red-800",
  default: "bg-gray-200 text-gray-800",
};

const ENTITY_DESCRIPTIONS = {
  PERSON: "People, including fictional.",
  NORP: "Nationalities or religious or political groups.",
  FAC: "Buildings, airports, highways, bridges, etc.",
  ORG: "Companies, agencies, institutions, etc.",
  GPE: "Countries, cities, states.",
  LOC: "Non-GPE locations, mountain ranges, bodies of water.",
  PRODUCT: "Objects, vehicles, foods, etc.",
  EVENT: "Named hurricanes, battles, wars, sports events, etc.",
  WORK_OF_ART: "Titles of books, songs, programs, etc.",
  LAW: "Named documents made into laws.",
  LANGUAGE: "Any named language.",
  DATE: "Absolute or relative dates or periods.",
  TIME: "Times smaller than a day.",
  PERCENT: "Percentage, including “%”.",
  MONEY: "Monetary values, including units.",
  QUANTITY: "Measurements, such as weight or distance.",
  ORDINAL: "“First”, “Second”, etc.",
  CARDINAL: "Numerals that do not fall under another type.",
  VIOLENT_ACT: "Describes violent acts.",
  WEAPON: "Weapons, firearms, explosives.",
  INJURY: "References to injuries, casualties, fatalities.",
};

const TONE_COLORS = {
  Positive: "text-green-400",
  Negative: "text-red-400",
  Neutral: "text-gray-400",
  Critical: "text-yellow-400",
  Sarcastic: "text-pink-400",
  "Passive-Aggressive": "text-orange-400",
  Offensive: "text-red-500",
};

export default function AlertSubPage() {
  const { new_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [alert, setAlert] = useState(null);

  const params = new URLSearchParams(location.search);
  const dateParam = params.get("date");
  const pageParam = params.get("page");

  useEffect(() => {
    fetch(`${API_BASE}/alerts/${new_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data) return navigate("/app/alerts");
        setAlert(data);
      })
      .catch(() => navigate("/app/alerts"));
  }, [new_id, navigate]);

  if (!alert) {
    return <LoadingScreen />;
  }

  const { title, source, summary, published_at, entities, activities, tone } =
    alert;
  const formattedDate = published_at
    ? format(new Date(published_at), "PPpp")
    : "—";
  const uniqueLabels = Array.from(new Set(entities.map((e) => e.label)));

  // Determine dominant tone
  let dominantTone = null;
  if (tone?.labels && tone?.scores) {
    const maxIdx = tone.scores.indexOf(Math.max(...tone.scores));
    dominantTone = tone.labels[maxIdx];
  }

  const toneColor = TONE_COLORS[dominantTone] || "text-white";

  return (
    <div className="bg-gray-900 min-h-screen p-6 text-gray-200">
      <button
        onClick={() => {
          const urlParams = new URLSearchParams();
          if (dateParam) urlParams.set("date", dateParam);
          if (pageParam) urlParams.set("page", pageParam);
          navigate(`/app/alerts?${urlParams.toString()}`);
        }}
        className="text-white mb-4 underline"
      >
        ← Back to Alerts
      </button>

      <h1 className="text-2xl font-bold mb-2">
        <HighlightedText text={title} entities={entities} />
      </h1>

      <div className="text-sm text-gray-400 mb-4">
        {source} • {formattedDate}
      </div>

      <div className="prose prose-invert mb-6">
        <HighlightedText text={summary} entities={entities} />
      </div>

      {/* Tone Analysis */}
      {tone?.labels && tone?.scores && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Tone Inference</h2>
          <ul>
            {tone.labels.map((label, i) => (
              <li
                key={i}
                className="flex justify-between border-b border-gray-700 py-1"
              >
                <span>{label}</span>
                <span className="text-gray-400">
                  {(tone.scores[i] * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
          {dominantTone && (
            <div className={`mt-4 font-semibold ${toneColor}`}>
              This article's dominant tone is: {dominantTone}
            </div>
          )}
        </div>
      )}

      {/* Entities */}
      <h2 className="text-xl font-semibold mb-2">Detected Entities</h2>
      <ul className="grid grid-cols-2 gap-2 mb-8">
        {entities.map((e, i) => {
          const style = ENTITY_STYLES[e.label] || ENTITY_STYLES.default;
          return (
            <li
              key={i}
              className={`${style} flex justify-between items-center px-3 py-1 rounded`}
            >
              <span>{e.text}</span>
              <span className="text-xs font-medium">{e.label}</span>
            </li>
          );
        })}
      </ul>

      {/* Legend */}
      <h2 className="text-xl font-semibold mb-2">Legend</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {uniqueLabels.map((label) => {
          const style = ENTITY_STYLES[label] || ENTITY_STYLES.default;
          const desc = ENTITY_DESCRIPTIONS[label] || "—";
          return (
            <div key={label} className="flex items-start gap-3">
              <span className={`inline-block w-4 h-4 rounded ${style}`} />
              <div>
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activities */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Activities</h2>
        <ul>
          {activities.map((activity, i) => (
            <li key={i}>{activity}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
