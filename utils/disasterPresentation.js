const DISASTER_PRESENTATIONS = {
  flood: { label: 'Flood emergency', shortLabel: 'Flood', icon: 'waves', color: '#2563eb', backgroundColor: '#eff6ff' },
  heat: {
    label: 'Heat emergency',
    shortLabel: 'Heat',
    icon: 'weather-sunny-alert',
    color: '#c2410c',
    backgroundColor: '#fff7ed',
  },
  wildfire: {
    label: 'Wildfire emergency',
    shortLabel: 'Wildfire',
    icon: 'fire',
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
  },
  storm: {
    label: 'Storm emergency',
    shortLabel: 'Storm',
    icon: 'weather-lightning',
    color: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  general: {
    label: 'Emergency warning',
    shortLabel: 'General emergency',
    icon: 'alert-outline',
    color: '#9a3412',
    backgroundColor: '#fff7f6',
  },
};

export function getDisasterPresentation(disasterType) {
  return DISASTER_PRESENTATIONS[disasterType] || DISASTER_PRESENTATIONS.general;
}

export function getDisasterLabel(disasterType) {
  return getDisasterPresentation(disasterType).shortLabel;
}
