import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import HighlightedText from '../../components/HighlightedText';

const API_BASE = 'http://localhost:8001';

// Extend your style map to include WORK_OF_ART
const ENTITY_STYLES = {
  PERSON:      'bg-green-200 text-green-800',
  ORG:         'bg-blue-200  text-blue-800',
  GPE:         'bg-purple-200 text-purple-800',
  LOC:         'bg-yellow-200 text-yellow-800',
  TIME:        'bg-orange-200 text-orange-800',
  PRODUCT:     'bg-pink-200   text-pink-800',
  NORP:        'bg-indigo-200 text-indigo-800',
  CARDINAL:    'bg-gray-200   text-gray-800',
  VIOLENT_ACT: 'bg-red-200    text-red-800',
  FAC:         'bg-teal-200   text-teal-800',
  DATE:        'bg-green-100  text-green-900',
  ORDINAL:     'bg-yellow-100 text-yellow-900',
  WORK_OF_ART: 'bg-red-100    text-red-900',
  default:     'bg-gray-200   text-gray-800',
};

const ENTITY_DESCRIPTIONS = {
  PERSON:      'People, names of individuals',
  ORG:         'Organizations, companies, agencies',
  GPE:         'Countries, cities, states',
  LOC:         'Non‐GPE locations (mountains, rivers, etc.)',
  TIME:        'Time expressions (dates, times)',
  PRODUCT:     'Objects, vehicles, foods, etc.',
  NORP:        'Nationalities or religious/political groups',
  CARDINAL:    'Numerical values',
  VIOLENT_ACT: 'Describes violent acts',
  FAC:         'Buildings, airports, highways, etc.',
  DATE:        'Dates or calendar references',
  ORDINAL:     '“First”, “2nd”, etc.',
  WORK_OF_ART:'Titles of works (books, songs, programs, etc.)',
};

export default function AlertSubPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/alerts`)
      .then(res => res.json())
      .then(data => {
        const found = data.find(a => a.id === id);
        if (!found) return navigate('/app/alerts');
        setAlert(found);
      })
      .catch(() => navigate('/app/alerts'));
  }, [id, navigate]);

  if (!alert) {
    return <div className="flex items-center justify-center h-64">Loading…</div>;
  }

  // only one legend entry per label
  const uniqueLabels = Array.from(new Set(alert.entities.map(e => e.label)));

  return (
    <div className="bg-gray-900 min-h-screen p-6 text-gray-200">
      <button onClick={() => navigate(-1)} className="text-white mb-4 underline">
        ← Back to Alerts
      </button>

      <h1 className="text-2xl font-bold mb-2">{alert.title}</h1>
      <div className="text-sm text-gray-400 mb-4">
        {alert.source} •{' '}
        {alert.published_at
          ? format(new Date(alert.published_at), 'PPpp')
          : '—'}
      </div>

      {/* SUMMARY WITH HIGHLIGHTS */}
      <div className="prose prose-invert mb-6">
        <HighlightedText text={alert.summary} entities={alert.entities} />
      </div>

      {/* DETECTED ENTITIES */}
      <h2 className="text-xl font-semibold mb-2">Detected Entities</h2>
      <ul className="grid grid-cols-2 gap-2 mb-8">
        {alert.entities.map((e, i) => {
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

      {/* LEGEND */}
      <h2 className="text-xl font-semibold mb-2">Legend</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {uniqueLabels.map(label => {
          const style = ENTITY_STYLES[label] || ENTITY_STYLES.default;
          const desc = ENTITY_DESCRIPTIONS[label] || '—';
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
    </div>
  );
}
