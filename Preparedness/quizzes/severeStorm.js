const severeStormQuestions = [
  {
    id: 'storm-1',
    question: 'A severe wind or tornado warning arrives while you are at home. Where should you shelter?',
    answers: [
      {
        id: 'a',
        text: 'In a small interior room, away from windows, on a low level safe from flooding',
      },
      {
        id: 'b',
        text: 'In a room with large windows so you can watch the weather',
      },
      {
        id: 'c',
        text: 'On the top floor because it is furthest from falling trees',
      },
      {
        id: 'd',
        text: 'In the glass porch so you can leave quickly if needed',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Put solid walls between you and flying debris, keep away from windows, and protect your head. Choose a low level that is not at risk of flooding; do not shelter in a cellar that could flood.',
  },
  {
    id: 'storm-2',
    question: 'Strong winds are due later today. What should you do with the garden chairs and plant pots?',
    answers: [
      {
        id: 'a',
        text: 'Bring them inside or secure them while it is still safe outside',
      },
      {
        id: 'b',
        text: 'Group them together and leave them unsecured',
      },
      {
        id: 'c',
        text: 'Put them against a window so the house blocks the wind',
      },
      {
        id: 'd',
        text: 'Wait until they start moving before bringing them in',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Even familiar garden items can be thrown around by strong winds. Secure them ahead of the storm; do not go outside to retrieve them once conditions are dangerous.',
  },
  {
    id: 'storm-3',
    question: 'A storm has brought a power line down across the pavement. It is not sparking. Is it safe to step over?',
    answers: [
      {
        id: 'a',
        text: 'No. Keep away and report it to emergency services or the electricity provider',
      },
      {
        id: 'b',
        text: 'Yes, if you avoid touching the cable itself',
      },
      {
        id: 'c',
        text: 'Yes, if the streetlights are also out',
      },
      {
        id: 'd',
        text: 'Only after pushing it aside with something wooden',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'A cable can be live without sparking. Keep yourself, other people, and pets well away, and report it from a safe place.',
  },
  {
    id: 'storm-4',
    question: 'Thunder and hail start while you are in a park next to a public building. Where should you go?',
    answers: [
      {
        id: 'a',
        text: 'Inside the building, away from its windows',
      },
      {
        id: 'b',
        text: 'Under the tallest tree for cover from the hail',
      },
      {
        id: 'c',
        text: 'Into an open-sided picnic shelter',
      },
      {
        id: 'd',
        text: 'Under a large umbrella in the open',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'A substantial building offers better protection than trees or open shelters. Once inside, stay away from windows that hail or debris could break.',
  },
  {
    id: 'storm-5',
    question: 'The storm has passed and you need to drive somewhere. What should you check before leaving?',
    answers: [
      {
        id: 'a',
        text: 'Official travel advice, closures, and current road conditions',
      },
      {
        id: 'b',
        text: 'Whether the rain has stopped outside your house',
      },
      {
        id: 'c',
        text: 'Whether cars are already passing your window',
      },
      {
        id: 'd',
        text: 'Whether your usual journey time looks normal',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Calm weather does not mean the roads are clear. Fallen trees, damaged power lines, and debris may remain, so check current updates before travelling.',
  },
  {
    id: 'storm-6',
    question: 'There is still time to prepare safely before strong winds arrive. Which of these needs securing?',
    answers: [
      {
        id: 'a',
        text: 'The loose balcony chairs and an unsecured plant pot on the railing',
      },
      {
        id: 'b',
        text: 'The closed fridge standing inside the kitchen',
      },
      {
        id: 'c',
        text: 'The books already stored in an indoor cupboard',
      },
      {
        id: 'd',
        text: 'The emergency bag beside your bed',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Look for outdoor objects that could blow away or fall onto someone. Bring them inside or secure them before the wind picks up.',
  },
  {
    id: 'storm-7',
    question: 'Your usual walking route is taped off after a storm, but the path looks clear. What should you do?',
    answers: [
      {
        id: 'a',
        text: 'Stay outside the closed area and find a safe alternative',
      },
      {
        id: 'b',
        text: 'Duck under the tape if you cannot see any damage',
      },
      {
        id: 'c',
        text: 'Follow someone else who has already crossed the barrier',
      },
      {
        id: 'd',
        text: 'Step inside briefly to check why the path is closed',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'You may not be able to see unstable trees, damaged cables, or other hazards. Respect closures and leave emergency crews room to work.',
  },
  {
    id: 'storm-8',
    question: 'After a storm, which situation needs a call to 112?',
    answers: [
      {
        id: 'a',
        text: 'Someone is seriously injured or in immediate danger',
      },
      {
        id: 'b',
        text: 'You want to know when a closed road will reopen',
      },
      {
        id: 'c',
        text: 'You need an estimate for repairing a damaged garden fence',
      },
      {
        id: 'd',
        text: 'You want to find out when the next storm is due',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Use 112 for an emergency involving immediate danger or serious injury. Use official updates or the relevant non-emergency service for routine information and repairs.',
  },
];

export default severeStormQuestions;
