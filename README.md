# DisasterGuardian

DisasterGuardian is a React Native and Expo mobile application that helps users in Germany prepare for and respond to local hazards.

## Main features

- Local hazard warnings for general emergencies, flooding, and heat.
- Nearby emergency facility search for hospitals, police stations, fire stations, and mapped/potential shelters.
- Water-level and current weather information used by risk summaries.
- Emergency-kit challenge, household-tailored preparedness checklist with custom items, and safety quizzes.
- Profile progression with AP, levels, badges, daily streaks, and activity history.
- Emergency contacts, local warning notifications, and preparedness reminders.
- Larger-text, and high-contrast accessibility settings.

## Project structure

```text
.
├── index.js                  # Expo application registration
├── App.js                    # Application setup and navigation
├── Authentication/           # Welcome screen and initial permission setup
├── Dashboard/                # Home dashboard, alerts, emergency response, and preparation
├── docs/                     # Behavioral contract for refactoring
├── hooks/                    # Accessibility settings and request lifecycle hooks
├── Preparedness/             # Checklists, quizzes, and emergency-kit challenge
├── Profile/                  # User profile, contacts, settings, and progression
├── ResourceHub/              # Safety guidance and emergency service resources
├── storage/                  # AsyncStorage state, persistence, and data normalisation
├── styles/                   # Shared visual constants and styles
├── tests/                    # Jest tests and shared test setup
└── utils/                    # Warning, geography, weather, facility, and notification logic
```

Development progressed through several stages including initial UI prototyping, preparedness-task implementation, progression and badge systems, integration of location-based external data, and final usability/interface refinement. The repository was consolidated and uploaded to GitHub near the end of development, so the Git commit history does not represent the full chronological development process.

## External data sources

The app uses the following public data sources and guidance:

- [NINA / MoWaS](https://warnung.bund.de/) - official German civil-protection warnings, including general, flood, and heat warning feeds.
- [Open-Meteo](https://open-meteo.com/) - current temperature and apparent-temperature data.
- [PegelOnline](https://www.pegelonline.wsv.de/) - nearby water-level station measurements from the German Federal Waterways and Shipping Administration.
- [Overpass API](https://overpass-api.de/) - OpenStreetMap facility data queried for nearby hospitals, police stations, fire stations, and mapped/potential shelters.
- [OpenStreetMap](https://www.openstreetmap.org/) - map and facility data used through Overpass.
- [Federal Office of Civil Protection and Disaster Assistance (BBK)](https://www.bbk.bund.de/) — preparedness guidance linked from the Resource Hub.

The application does not require API keys for these public requests.

## Running the project

Install dependencies from the lockfile and start the Expo development server:

```bash
npm install
npm start
```

Allow location access for local warnings and nearby facility search, and notification permission for local alerts and reminders.

Run the Jest tests, lint checks, and formatting checks:

```bash
npm test
npm run lint
npm run format:check
```


