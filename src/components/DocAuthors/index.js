import React from 'react';

export default function DocAuthors({authors, date}) {
  if (!authors?.length) return null;
  const label = authors.length === 1 ? authors[0] : authors.join(', ');
  return (
    <p className="doc-authors">
      <em>Written by {label}</em>
      {date && <> · <em>{date}</em></>}
    </p>
  );
}
