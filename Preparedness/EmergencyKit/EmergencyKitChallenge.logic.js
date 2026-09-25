export const CHALLENGE_SECONDS = 120;
export const BACKPACK_CAPACITY = 12;
export const TASK_ID = 'emergency-kit';

const ESSENTIAL_ITEMS = [
  ['water', 'Water Bottle', 'water', 'Access to clean drinking water may be limited during emergencies.'],
  [
    'firstAid',
    'First Aid Kit',
    'medical-bag',
    'Required for treating cuts, burns, sprains, and minor injuries before help arrives.',
  ],
  ['flashlight', 'Flashlight', 'flashlight', 'Essential when power is out or visibility is poor.'],
  [
    'radio',
    'Portable Radio',
    'radio',
    'Mobile networks may be down during emergencies, so radio communication is vital to receive emergency broadcasts.',
  ],
  ['batteries', 'Batteries', 'battery', 'Backup power for flashlights and radios.'],
  [
    'cannedFood',
    'Canned Food',
    'food-outline',
    'Shelf-stable food supports you when shops and kitchens are unavailable.',
  ],
  [
    'multiTool',
    'Multi-tool',
    'tools',
    'Useful for small repairs, opening cans, and handling practical emergency tasks.',
  ],
  [
    'emergencyBlanket',
    'Emergency Blanket',
    'shield-outline',
    'Essential for retaining body heat and reducing exposure.',
  ],
  [
    'warmBlanket',
    'Warm Blanket',
    'bed-outline',
    'Important for warmth during evacuation, sheltering, or cold weather.',
  ],
  [
    'gloves',
    'Protective Gloves',
    'boxing-glove',
    'Protect hands from debris, broken glass, contaminated surfaces, and cleanup hazards.',
  ],
  [
    'hygiene',
    'Hygiene Products',
    'hand-wash',
    'Important for sanitation, comfort, and preventing illness during prolonged disruption.',
  ],
  [
    'medication',
    'Personal Medication',
    'pill',
    'Pharmacies and healthcare services may become inaccessible during disasters.',
  ],
  ['mask', 'Protective Mask', 'face-mask', 'Helps reduce exposure to smoke, dust, ash, and airborne contaminants.'],
  [
    'cutlery',
    'Cutlery Set',
    'silverware-fork-knife',
    'Useful for eating safely when away from home or sheltering without kitchen access.',
  ],
  [
    'tableware',
    'Tableware',
    'bowl-mix-outline',
    'Useful for preparing and eating food hygienically during disruptions.',
  ],
  ['map', 'Physical Map', 'map-outline', 'Important because GPS and mobile data may fail during emergencies.'],
];

const INCORRECT_ITEMS = [
  [
    'teddyBear',
    'Teddy Bear',
    'teddy-bear',
    'Comforting, but not essential for survival and takes up limited backpack space.',
  ],
  [
    'heels',
    'High Heels',
    'shoe-heel',
    'Not practical for evacuation, walking long distances, or moving through debris.',
  ],
  ['perfume', 'Perfume', 'bottle-tonic-outline', 'Not essential for survival and takes up valuable backpack space.'],
  ['hairDryer', 'Hair Dryer', 'hair-dryer', 'Requires electricity and provides little emergency value.'],
  [
    'camera',
    'Camera',
    'camera',
    'Useful in daily life, but less important than water, medicine, light, or communication.',
  ],
  ['sunglasses', 'Sunglasses', 'sunglasses', 'Helpful in sunlight, but not a high-priority emergency kit item.'],
  [
    'controller',
    'Game Controller',
    'gamepad-variant-outline',
    'Entertainment is not a priority when backpack space is limited.',
  ],
  ['jewellery', 'Jewellery', 'diamond-stone', 'Valuable, but not useful for immediate safety, health, or survival.'],
  [
    'candles',
    'Decorative Candles',
    'candle',
    'Open flames can be risky after disasters, especially near gas leaks or debris.',
  ],
  ['speaker', 'Bluetooth Speaker', 'speaker', 'Needs battery power and does not support core emergency needs.'],
  ['makeup', 'Makeup Kit', 'lipstick', 'Not essential for survival and should not replace emergency supplies.'],
  [
    'headset',
    'Gaming Headset',
    'headphones',
    'Not useful for evacuation, sheltering, first aid, or emergency communication.',
  ],
];

const ROOM_POSITIONS = [
  [5, 15],
  [22, 8],
  [40, 14],
  [68, 10],
  [82, 18],
  [12, 36],
  [28, 31],
  [48, 38],
  [73, 33],
  [6, 63],
  [24, 58],
  [43, 66],
  [63, 58],
  [82, 65],
  [16, 78],
  [36, 82],
  [57, 77],
  [74, 82],
  [10, 5],
  [53, 7],
  [87, 42],
  [2, 48],
  [33, 47],
  [58, 28],
  [78, 49],
  [45, 87],
  [20, 20],
  [67, 73],
];

export const ITEMS = [...ESSENTIAL_ITEMS, ...INCORRECT_ITEMS].map(([id, name, iconName, explanation], index) => ({
  id,
  name,
  iconName,
  explanation,
  essential: index < ESSENTIAL_ITEMS.length,
}));

export const initialState = {
  phase: 'intro',
  availableItems: [],
  packedItems: [],
  selectedItems: [],
  secondsLeft: CHALLENGE_SECONDS,
  submitted: false,
  showFeedback: false,
};

export function shuffle(items) {
  return [...items]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }, index) => ({ ...item, position: ROOM_POSITIONS[index % ROOM_POSITIONS.length] }));
}

export function challengeReducer(state, action) {
  switch (action.type) {
    case 'START':
      return { ...initialState, phase: 'game', availableItems: shuffle(ITEMS) };
    case 'TICK':
      return { ...state, secondsLeft: Math.max(0, state.secondsLeft - 1) };
    case 'PACK_ITEM': {
      if (state.packedItems.length >= BACKPACK_CAPACITY || state.submitted) return state;
      const item = state.availableItems.find((entry) => entry.id === action.id);
      if (!item) return state;
      return {
        ...state,
        availableItems: state.availableItems.filter((entry) => entry.id !== action.id),
        packedItems: [...state.packedItems, item],
      };
    }
    case 'REMOVE_ITEM': {
      if (state.submitted) return state;
      const item = state.packedItems.find((entry) => entry.id === action.id);
      if (!item) return state;
      return {
        ...state,
        packedItems: state.packedItems.filter((entry) => entry.id !== action.id),
        availableItems: [...state.availableItems, item],
      };
    }
    case 'SUBMIT':
      return { ...state, phase: 'results', submitted: true, selectedItems: state.packedItems, showFeedback: false };
    case 'FEEDBACK':
      return { ...state, showFeedback: true };
    case 'CLOSE_FEEDBACK':
      return { ...state, showFeedback: false };
    case 'INTRO':
      return initialState;
    default:
      return state;
  }
}

// Reward essential items, penalise unnecessary items, and add the remaining
// time as a bonus. Scores are never allowed to fall below zero.
export function getScore(items, secondsLeft) {
  const itemScore = items.reduce((total, item) => total + (item.essential ? 50 : -25), 0);
  return Math.max(0, itemScore + secondsLeft);
}

export function getBadge(score) {
  if (score >= 400) return ['Kit Expert', 'Excellent item selection and prioritisation.'];
  if (score >= 250) return ['Kit Builder', 'You selected a useful core emergency kit.'];
  return ['Keep Practising', 'Review the feedback and try again.'];
}

export function formatTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainingSeconds = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}
