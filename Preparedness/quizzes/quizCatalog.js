import floodQuestions from './flood';
import heatQuestions from './heat';
import severeStormQuestions from './severeStorm';
import wildfireQuestions from './wildfire';

export const quizCatalog = [
  {
    id: 'flood',
    title: 'Flood safety',
    detail: 'Practice safer decisions before, during, and after flooding.',
    questions: floodQuestions,
  },
  {
    id: 'heat',
    title: 'Heat-wave safety',
    detail: 'Practice staying safe, hydrated, and prepared during extreme heat.',
    questions: heatQuestions,
  },
  {
    id: 'wildfire',
    title: 'Wildfire safety',
    detail: 'Test evacuation, smoke, and household preparation knowledge.',
    questions: wildfireQuestions,
  },
  {
    id: 'severe-storm',
    title: 'Severe storm safety',
    detail: 'Check what to do around high winds, debris, and power lines.',
    questions: severeStormQuestions,
  },
];

export function getQuizById(id) {
  return quizCatalog.find((quiz) => quiz.id === id) || quizCatalog[0];
}
