import React from 'react';

/**
 * Highlights entity mentions in the text with colors based on their labels.
 *
 * @param {{ text: string, entities: { text: string, label: string }[] }} props
 */
export default function HighlightedText({ text, entities }) {
  // Map each label to a bg/text color combo:
  const ENTITY_COLORS = {
    PERSON:  'bg-green-200 text-green-800',
    ORG:     'bg-blue-200  text-blue-800',
    GPE:     'bg-purple-200 text-purple-800',
    LOC:     'bg-yellow-200 text-yellow-800',
    TIME:    'bg-orange-200 text-orange-800',
    PRODUCT: 'bg-pink-200   text-pink-800',
    default: 'bg-gray-200   text-gray-800',
  };

  // Escape regex metacharacters in a string
  const escapeRegex = (str) =>
    str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

  // Sort entities by descending text length so longer ones match first
  const sorted = [...entities].sort(
    (a, b) => b.text.length - a.text.length
  );

  // Begin with the entire text as one chunk
  let chunks = [text];

  // For each entity, split existing chunks on its text and wrap matches
  sorted.forEach(({ text: entText, label }) => {
    const styleClass = ENTITY_COLORS[label] || ENTITY_COLORS.default;
    const pattern = new RegExp(`(${escapeRegex(entText)})`, 'gi');

    const newChunks = [];
    chunks.forEach((chunk) => {
      if (typeof chunk !== 'string') {
        // Already a highlighted React node
        newChunks.push(chunk);
      } else {
        // Split the string chunk by the entity, keeping the delimiter
        const parts = chunk.split(pattern);
        parts.forEach((part, idx) => {
          if (pattern.test(part)) {
            // This part matches the entity → highlight it
            newChunks.push(
              <span
                key={`${entText}-${idx}`}
                className={`${styleClass} px-1 rounded`}
              >
                {part}
              </span>
            );
          } else if (part) {
            // Plain text
            newChunks.push(part);
          }
        });
      }
    });
    chunks = newChunks;
  });

  return <span>{chunks}</span>;
}
