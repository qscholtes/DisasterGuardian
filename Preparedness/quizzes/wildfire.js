const wildfireQuestions = [
  {
    id: 'wildfire-1',
    question: 'An evacuation order covers your street, but you cannot see any flames. What should you do?',
    answers: [
      {
        id: 'a',
        text: 'Leave promptly by the route the authorities recommend',
      },
      {
        id: 'b',
        text: 'Wait until you can see the fire before deciding',
      },
      {
        id: 'c',
        text: 'Finish packing extra belongings before setting off',
      },
      {
        id: 'd',
        text: 'Stay unless a firefighter comes to your door',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'You may not be able to see the danger from home. Follow the evacuation order promptly, because smoke, fire, and road conditions can change quickly.',
  },
  {
    id: 'wildfire-2',
    question:
      'Wildfire smoke is outside, and officials say it is safe to remain at home. How can you reduce smoke getting indoors?',
    answers: [
      {
        id: 'a',
        text: 'Close doors and windows, and use a suitable air cleaner if available',
      },
      {
        id: 'b',
        text: 'Open windows on opposite sides to create a draught',
      },
      {
        id: 'c',
        text: 'Leave one window open so you can keep checking the smoke',
      },
      {
        id: 'd',
        text: 'Run a fan beside an open window to bring in cooler air',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Keep smoky outside air out and follow local air-quality advice. A suitable air cleaner can help indoors, but it is not a reason to ignore an evacuation order.',
  },
  {
    id: 'wildfire-3',
    question: 'Your household lives near woodland. What is worth sorting out before wildfire season?',
    answers: [
      {
        id: 'a',
        text: 'How you would leave, what essentials to take, and how to contact each other',
      },
      {
        id: 'b',
        text: 'Which belongings to move first once flames are visible',
      },
      {
        id: 'c',
        text: 'Who will stay behind to protect the house if everyone else leaves',
      },
      {
        id: 'd',
        text: 'Which single road to rely on without checking for alternatives',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Agree on an evacuation and contact plan, and keep a go-bag ready. Planning ahead saves time when you need to leave and helps everyone know what to do.',
  },
  {
    id: 'wildfire-4',
    question: 'You spot a small fire beside a woodland path. What comes first?',
    answers: [
      {
        id: 'a',
        text: 'Get clear of the danger and call 112 with the location',
      },
      {
        id: 'b',
        text: 'Get closer to decide whether it is large enough to report',
      },
      {
        id: 'c',
        text: 'Wait for someone who knows the area to deal with it',
      },
      {
        id: 'd',
        text: 'Try to put it out before deciding whether to call',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'A small fire can spread quickly in dry vegetation. Put your safety first and report it promptly; do not delay the call to investigate or attempt a risky rescue.',
  },
  {
    id: 'wildfire-5',
    question:
      'A local notice bans outdoor fires because the woodland is very dry. What does that mean for your picnic?',
    answers: [
      {
        id: 'a',
        text: 'Follow the restriction and choose food that does not need a fire',
      },
      {
        id: 'b',
        text: 'Use a small barbecue because it is not an open campfire',
      },
      {
        id: 'c',
        text: 'Light a fire only if you have a bucket of water nearby',
      },
      {
        id: 'd',
        text: 'Use the usual fire pit because it was allowed last summer',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Restrictions apply to the current conditions, even at familiar picnic spots. Follow the local rules on fires, barbecues, and smoking to avoid starting a wildfire.',
  },
  {
    id: 'wildfire-6',
    question:
      'Smoke from a nearby wildfire is getting into the house. Someone suggests opening the windows to clear it. How should you respond?',
    answers: [
      {
        id: 'a',
        text: 'Keep them closed while the outside air is smoky and follow local advice',
      },
      {
        id: 'b',
        text: 'Open them all until the smell disappears',
      },
      {
        id: 'c',
        text: 'Open only the upstairs windows because smoke stays near the ground',
      },
      {
        id: 'd',
        text: 'Ignore air-quality warnings if you cannot see smoke in the room',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Opening windows can bring in more smoke when the air outside is polluted. If the house becomes too hot or smoky to stay in safely, seek a safer place and follow official instructions.',
  },
  {
    id: 'wildfire-7',
    question:
      'Your family may be in different places when an evacuation begins. Why agree on a contact plan beforehand?',
    answers: [
      {
        id: 'a',
        text: 'So everyone knows how to check in and where to reunite safely',
      },
      {
        id: 'b',
        text: 'So everyone can return home first, whatever the evacuation advice says',
      },
      {
        id: 'c',
        text: 'So one person can make all decisions without checking official updates',
      },
      {
        id: 'd',
        text: 'So nobody needs a backup if their phone loses signal',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Agree on ways to contact each other and a safe meeting place. Include a backup for phone problems, and do not return to an evacuation area just to meet up.',
  },
  {
    id: 'wildfire-8',
    question: 'During an evacuation, the road you planned to use is closed. What now?',
    answers: [
      {
        id: 'a',
        text: 'Follow official directions to an alternative route',
      },
      {
        id: 'b',
        text: 'Follow your satnav through the closure if it still shows the road as open',
      },
      {
        id: 'c',
        text: 'Take an unfamiliar woodland track to get around the traffic',
      },
      {
        id: 'd',
        text: 'Wait beside the barrier until the road reopens',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Your usual route or satnav may not reflect the latest fire conditions. Follow official diversions and do not enter closed roads.',
  },
];

export default wildfireQuestions;
