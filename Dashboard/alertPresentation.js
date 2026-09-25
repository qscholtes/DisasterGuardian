export function formatActionDate(dateValue) {
  if (!dateValue) return 'Recently';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function getWarningTimestampLabel(disaster, error) {
  if (error) return `Cached data · ${error}`;
  if (disaster.updated) return `Issued ${formatActionDate(disaster.updated)}`;
  return 'Current warning';
}
