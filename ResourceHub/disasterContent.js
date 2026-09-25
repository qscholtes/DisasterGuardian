export const DISASTER_CONTENT = [
  {
    id: 'floods',
    title: 'Floods',
    detail: 'Know where to go, what to move, and what not to drive through when water rises.',
    icon: 'waves',
    sections: [
      {
        title: 'Prepare before flooding',
        items: [
          'Follow local flood warnings and identify safe routes to higher ground.',
          'Keep important documents, medication, drinking water, a torch, and a radio ready.',
          'Move valuable items and hazardous substances away from areas that may flood.',
        ],
      },
      {
        title: 'During a flood',
        items: [
          'Follow instructions from local authorities and stay away from closed or dangerous areas.',
          'Do not walk or drive through flood water. It may be deeper or faster than it looks.',
          'Move to higher ground and take your phone, emergency kit, and medication if it is safe.',
        ],
      },
      {
        title: 'After flooding',
        items: [
          'Return only when authorities say it is safe.',
          'Avoid damaged buildings, contaminated water, and fallen power lines.',
          'Report hazards and help others only when it is safe to do so.',
        ],
      },
    ],
    sourceUrl:
      'https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Mit-Naturgefahren-umgehen/Hochwasser/hochwasser_node.html',
    sourceLabel: 'BBK: Flood preparedness and response',
  },
  {
    id: 'storms',
    title: 'Storms, lightning and hail',
    detail: 'Secure your surroundings before the weather changes, then shelter away from windows and damaged areas.',
    icon: 'weather-lightning',
    sections: [
      {
        title: 'Prepare before a storm',
        items: [
          'Check official weather warnings and secure loose items outside.',
          'Close windows and doors. Keep a torch, phone, and emergency supplies ready.',
          'Plan where you can shelter away from windows, trees, and structures that may fall.',
        ],
      },
      {
        title: 'During a storm',
        items: [
          'Stay indoors and keep away from windows.',
          'Avoid forests, isolated trees, open ground, and damaged areas.',
          'Do not touch fallen cables or enter areas blocked by emergency services.',
        ],
      },
      {
        title: 'After a storm',
        items: [
          'Watch for broken glass, unstable trees, loose roof tiles, and damaged power lines.',
          'Follow official updates before travelling or clearing damage.',
          'Call 112 for immediate danger or serious injury.',
        ],
      },
    ],
    sourceUrl:
      'https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Mit-Naturgefahren-umgehen/Unwetter/unwetter_node.html',
    sourceLabel: 'BBK: Storm, thunderstorm and hail preparedness',
  },
  {
    id: 'heat-drought',
    title: 'Heat and drought',
    detail: 'Plan for hot days, protect people at risk, and reduce fire danger when conditions are dry.',
    icon: 'weather-sunny-alert',
    sections: [
      {
        title: 'Prepare before extreme heat',
        items: [
          'Keep enough drinking water at home and check on people who may be vulnerable.',
          'Create shade by closing blinds and keeping rooms cool.',
          'Ask a doctor or pharmacist how heat may affect medication.',
        ],
      },
      {
        title: 'During extreme heat',
        items: [
          'Drink regularly, wear light clothing, and avoid the hottest part of the day.',
          'Rest in shade or a cool place. Schedule exercise and errands for cooler hours.',
          'Never leave children, vulnerable people, or animals alone in a parked car.',
        ],
      },
      {
        title: 'Reduce wildfire risk',
        items: [
          'Check local wildfire warnings during hot, dry weather.',
          'Follow local rules about fires, barbecues, and smoking outdoors.',
          'Report smoke or fire immediately and move away from danger.',
        ],
      },
    ],
    sourceUrl:
      'https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Mit-Naturgefahren-umgehen/Hitze-Duerre/hitze-duerre_node.html',
    sourceLabel: 'BBK: Heat and drought preparedness',
  },
  {
    id: 'cold-snow',
    title: 'Cold and snowfall',
    detail: 'Prepare for icy roads, heavy snow, and power interruptions before they affect your plans.',
    icon: 'snowflake-alert',
    sections: [
      {
        title: 'Prepare before snow and ice',
        items: [
          'Check warnings and stay home when travel is unsafe.',
          'Keep food, drinks, medication, a torch, and warm clothing available.',
          'Plan for possible travel delays and power interruptions.',
        ],
      },
      {
        title: 'During snow and ice',
        items: [
          'Move carefully to avoid falls and use safe, cleared routes.',
          'Keep away from roof edges, falling icicles, and areas with heavy snow loads.',
          'Only walk on frozen water when it has been officially approved as safe.',
        ],
      },
      {
        title: 'If someone is injured',
        items: [
          'Give first aid if it is safe and call 112 for serious injuries.',
          'Do not attempt to clear a dangerous roof yourself; get professional help.',
          'Follow official warnings before travelling again.',
        ],
      },
    ],
    sourceUrl:
      'https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Mit-Naturgefahren-umgehen/Kaelte-und-Schneefall/kaelte-und-schneefall_node.html',
    sourceLabel: 'BBK: Cold and snowfall preparedness',
  },
];

export function getDisasterContent(id) {
  return DISASTER_CONTENT.find((topic) => topic.id === id) || DISASTER_CONTENT[0];
}

export function getResourceLinkForDisaster(disasterType) {
  const links = {
    flood: { topicId: 'floods', sectionIndex: 1, label: 'Open flood guidance' },
    heat: { topicId: 'heat-drought', sectionIndex: 1, label: 'Open heat guidance' },
    wildfire: { topicId: 'heat-drought', sectionIndex: 2, label: 'Open wildfire guidance' },
    storm: { topicId: 'storms', sectionIndex: 1, label: 'Open storm guidance' },
  };

  return links[disasterType] || null;
}
