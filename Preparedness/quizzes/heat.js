const heatQuestions = [
  {
    id: 'heat-1',
    question: 'Several very hot days are forecast. Which change would help you cope?',
    answers: [
      {
        id: 'a',
        text: 'Drink regularly and move demanding outdoor jobs to cooler hours',
      },
      {
        id: 'b',
        text: 'Keep your usual routine and drink only when you feel thirsty',
      },
      {
        id: 'c',
        text: 'Do outdoor jobs at midday so you can rest in the evening',
      },
      {
        id: 'd',
        text: 'Have a large drink in the morning instead of taking water with you',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      "Keep water within reach and take regular breaks somewhere cool. Plan demanding activities for cooler hours; if you have a prescribed fluid limit, follow your clinician's advice.",
  },
  {
    id: 'heat-2',
    question: 'It is hotter outside than inside, and the sun is on your windows. How can you keep the room cooler?',
    answers: [
      {
        id: 'a',
        text: 'Close the blinds and keep the hotter outside air out',
      },
      {
        id: 'b',
        text: 'Open every window to let in air, even though it is hotter',
      },
      {
        id: 'c',
        text: 'Leave the blinds open and rely on a fan to block the heat',
      },
      {
        id: 'd',
        text: 'Open the sunny windows first to let the heat escape',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Shade the windows during the day. Open them for ventilation when the air outside is cooler, often at night or early in the morning.',
  },
  {
    id: 'heat-3',
    question: 'Your older neighbour lives alone and has not asked for help during a heatwave. What would be useful?',
    answers: [
      {
        id: 'a',
        text: 'Check in and ask whether they have drinks and a cool place to rest',
      },
      {
        id: 'b',
        text: 'Wait for them to call, since they know when they need help',
      },
      {
        id: 'c',
        text: 'Assume they are fine because they are staying indoors',
      },
      {
        id: 'd',
        text: 'Check on them only if there is also a power cut',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'People at greater risk from heat may need help before they ask for it. A quick check-in can reveal whether someone needs water, a cooler place, or further assistance.',
  },
  {
    id: 'heat-4',
    question: 'You take regular medication and are worried about the heat. Who should you ask?',
    answers: [
      {
        id: 'a',
        text: 'Your doctor or pharmacist, before changing how you take or store it',
      },
      {
        id: 'b',
        text: 'A friend who takes something similar and has been through a heatwave',
      },
      {
        id: 'c',
        text: 'An online discussion group, then adjust the dose yourself',
      },
      {
        id: 'd',
        text: 'Nobody unless the tablets look or smell different',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Heat can affect medicines and how your body responds to them. Ask your doctor or pharmacist for advice about your own medication, and do not change the dose on your own.',
  },
  {
    id: 'heat-5',
    question: 'You planned a run, but there is an extreme heat warning. What is the safest adjustment?',
    answers: [
      {
        id: 'a',
        text: 'Postpone it or choose a cooler time, take it easier, and bring water',
      },
      {
        id: 'b',
        text: 'Keep the usual time and pace, but wear a hat',
      },
      {
        id: 'c',
        text: 'Run faster so you spend less time in the heat',
      },
      {
        id: 'd',
        text: 'Keep the midday run and drink extra water afterwards',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'On very hot days, strenuous exercise may need to wait. If conditions allow activity at a cooler time, reduce the effort, drink regularly, and take breaks somewhere cool.',
  },
  {
    id: 'heat-6',
    question: 'Which plan should you rule out on a hot day?',
    answers: [
      {
        id: 'a',
        text: 'Leaving a child or pet in a parked car while you make a quick stop',
      },
      {
        id: 'b',
        text: 'Taking the child or pet with you when you leave the car',
      },
      {
        id: 'c',
        text: 'Arranging for another adult to look after them somewhere cool',
      },
      {
        id: 'd',
        text: 'Postponing the errand until you can leave them safely at home',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'A parked car can heat up quickly, even with a window partly open. Never leave a child, someone who cannot get out independently, or a pet unattended inside.',
  },
  {
    id: 'heat-7',
    question:
      'It has been hot and dry all week, and you are planning a barbecue near woodland. What should you check first?',
    answers: [
      {
        id: 'a',
        text: 'Current local fire warnings and restrictions for that location',
      },
      {
        id: 'b',
        text: 'Whether other people have already started barbecues there',
      },
      {
        id: 'c',
        text: 'Whether barbecues were allowed on your last visit',
      },
      {
        id: 'd',
        text: 'Whether the grass looks green enough around the cooking area',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      "Rules can change as fire risk rises. Check the current local restrictions, and do not treat an old sign or someone else's barbecue as permission.",
  },
  {
    id: 'heat-8',
    question: 'On a walk during a dry spell, you spot smoke rising from the woods. What should you do?',
    answers: [
      {
        id: 'a',
        text: 'Move away from danger and report it promptly to 112',
      },
      {
        id: 'b',
        text: 'Walk towards it so you can confirm there are flames before calling',
      },
      {
        id: 'c',
        text: 'Wait to see whether someone else reports it',
      },
      {
        id: 'd',
        text: 'Post a photo in a local group and wait for a reply',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Do not approach to investigate. Report suspected wildfire from a safe place and give the location as clearly as you can; a nearby landmark or marked rescue point can help.',
  },
];

export default heatQuestions;
