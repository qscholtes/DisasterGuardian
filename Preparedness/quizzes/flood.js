const floodQuestions = [
  {
    id: 'flood-1',
    question: 'Water is starting to come into your home. What should take priority?',
    answers: [
      {
        id: 'a',
        text: 'Get to a safe higher level and follow local emergency instructions',
      },
      {
        id: 'b',
        text: 'Move furniture out of the lowest rooms before leaving',
      },
      {
        id: 'c',
        text: 'Go down to the cellar to find where the water is coming in',
      },
      {
        id: 'd',
        text: 'Wait by the front door to see whether the water rises further',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Put your safety before your belongings. Move away from rising water, stay out of flooded cellars, and follow evacuation instructions. If you are trapped or in immediate danger, call 112.',
  },
  {
    id: 'flood-2',
    question: 'A flooded road looks shallow enough to cross. Why should you turn back?',
    answers: [
      {
        id: 'a',
        text: 'You cannot judge the current, depth, or condition of the road by looking',
      },
      {
        id: 'b',
        text: 'The main risk is getting the car interior or your clothes wet',
      },
      {
        id: 'c',
        text: 'Crossing is safe if another person or car has just made it through',
      },
      {
        id: 'd',
        text: 'Clear-looking water is safe as long as you move slowly',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Water can hide a damaged road, debris, and strong currents. Do not walk or drive through it, even if someone else has crossed.',
  },
  {
    id: 'flood-3',
    question: 'The power is out and your phone has no signal. What could still give you local emergency updates?',
    answers: [
      {
        id: 'a',
        text: 'A battery-powered or hand-crank radio',
      },
      {
        id: 'b',
        text: 'A news app that needs an internet connection',
      },
      {
        id: 'c',
        text: 'A television plugged into the wall',
      },
      {
        id: 'd',
        text: 'A smart speaker connected to your home Wi-Fi',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'A radio with its own power source can receive broadcasts without your home electricity or mobile network. Keep batteries available if it needs them.',
  },
  {
    id: 'flood-4',
    question:
      'A flood warning has been issued, but your home is still dry. Where should your medication and important documents go?',
    answers: [
      {
        id: 'a',
        text: 'Somewhere protected from water and ready to take if you leave',
      },
      {
        id: 'b',
        text: 'In their usual places so everyone knows where to find them',
      },
      {
        id: 'c',
        text: 'In a sealed box on the cellar floor',
      },
      {
        id: 'd',
        text: 'Together in a drawer to collect after the water arrives',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Pack these essentials while it is still safe, keep them away from areas that may flood, and have them ready to take. Do not enter floodwater to retrieve them.',
  },
  {
    id: 'flood-5',
    question: 'You evacuated yesterday and the water is going down. When should you go back home?',
    answers: [
      {
        id: 'a',
        text: 'When the authorities say it is safe to return',
      },
      {
        id: 'b',
        text: 'As soon as you can see the pavement again',
      },
      {
        id: 'c',
        text: 'Once a neighbour has gone back to their house',
      },
      {
        id: 'd',
        text: 'When the outside of your building looks undamaged',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Receding water does not mean a building is safe. Damage, electricity, and contaminated water can still pose a risk, so wait for official clearance.',
  },
  {
    id: 'flood-6',
    question: 'When planning how to leave during a flood, which route should you look for?',
    answers: [
      {
        id: 'a',
        text: 'A route to higher ground that avoids low spots and flood-prone roads',
      },
      {
        id: 'b',
        text: 'The shortest route, even if it goes through an underpass',
      },
      {
        id: 'c',
        text: 'Your usual route along the river because you know it well',
      },
      {
        id: 'd',
        text: 'A route chosen only by the shortest journey time on your phone',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Plan a way to higher ground before flooding starts. Check current warnings when you need to leave, because your planned route may no longer be safe.',
  },
  {
    id: 'flood-7',
    question: 'Why move fuel and household chemicals out of flood-prone storage before a flood?',
    answers: [
      {
        id: 'a',
        text: 'Leaking containers can contaminate the water and create more hazards',
      },
      {
        id: 'b',
        text: 'Closed containers will stay safe wherever they are stored',
      },
      {
        id: 'c',
        text: 'Floodwater will dilute any spills enough to make them harmless',
      },
      {
        id: 'd',
        text: 'The main concern is keeping the labels dry for later use',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'Floodwater can carry spilled fuel and chemicals into other areas. Move them while it is safe, before water reaches the storage area.',
  },
  {
    id: 'flood-8',
    question: 'After a flood, you notice a fallen cable beside standing water. What should you do?',
    answers: [
      {
        id: 'a',
        text: 'Keep away, warn others, and report it from a safe place',
      },
      {
        id: 'b',
        text: 'Go closer to check whether it is a power or phone cable',
      },
      {
        id: 'c',
        text: 'Move it aside with a dry branch before anyone trips over it',
      },
      {
        id: 'd',
        text: 'Assume it is safe if the nearby houses have no electricity',
      },
    ],
    correctAnswerId: 'a',
    explanation:
      'A fallen power line may still be live even during a power cut. Keep clear of the cable and nearby water, and report the danger.',
  },
];

export default floodQuestions;
