import { z } from 'zod';
import { SkillAssessment } from '../models/SkillAssessment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const assessmentSchema = z.object({
  careerGoal: z.string().min(2),
  answers: z.array(z.object({
    question: z.string(),
    selectedOption: z.string(),
  })),
});

const questionBank: Record<string, { question: string; options: string[]; answer: string }[]> = {
  'Frontend Developer': [
    { question: 'Which HTML attribute is used to provide alternative text for an image?', options: ['alt', 'src', 'title', 'class'], answer: 'alt' },
    { question: 'Which CSS property controls spacing between elements?', options: ['padding', 'font-size', 'display', 'position'], answer: 'padding' },
    { question: 'What does React use to manage component state?', options: ['useState', 'useMemo', 'fetch', 'axios'], answer: 'useState' },
    { question: 'Which tool is commonly used to bundle frontend assets?', options: ['Vite', 'MongoDB', 'Express', 'Docker'], answer: 'Vite' },
    { question: 'What does a semantic HTML element improve?', options: ['Accessibility and structure', 'Database performance', 'AI inference', 'Encryption'], answer: 'Accessibility and structure' },
  ],
  'Backend Developer': [
    { question: 'Which HTTP method is typically used to create a new resource?', options: ['POST', 'GET', 'DELETE', 'PATCH'], answer: 'POST' },
    { question: 'What is a common use of a REST API?', options: ['Expose backend data for clients', 'Compile CSS', 'Render charts', 'Manage browser cookies'], answer: 'Expose backend data for clients' },
    { question: 'Which database system is used in this project?', options: ['MongoDB', 'Redis', 'SQLite', 'PostgreSQL'], answer: 'MongoDB' },
    { question: 'What is middleware in Express?', options: ['A function that intercepts requests', 'A UI library', 'A deployment tool', 'A CSS loader'], answer: 'A function that intercepts requests' },
    { question: 'Which data structure is often used for JSON responses?', options: ['Object', 'ArrayBuffer', 'Uint8Array', 'WeakMap'], answer: 'Object' },
  ],
  'Full-Stack Developer': [
    { question: 'Which HTTP status code indicates successful resource creation?', options: ['201', '204', '301', '404'], answer: '201' },
    { question: 'Where should a browser application store a private API secret?', options: ['On the server', 'In a public JavaScript bundle', 'In a URL query', 'In local storage'], answer: 'On the server' },
    { question: 'What does a database index primarily improve?', options: ['Query lookup speed', 'Password strength', 'HTML semantics', 'Image resolution'], answer: 'Query lookup speed' },
    { question: 'Which HTTP method is commonly used to partially update a resource?', options: ['PATCH', 'TRACE', 'CONNECT', 'OPTIONS'], answer: 'PATCH' },
    { question: 'What is the purpose of input validation on an API?', options: ['Reject invalid or unsafe data', 'Make requests anonymous', 'Replace database indexes', 'Compress images'], answer: 'Reject invalid or unsafe data' },
  ],
  'Data Analyst': [
    { question: 'Which SQL clause filters rows before aggregation?', options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'], answer: 'WHERE' },
    { question: 'Which measure is least affected by extreme outliers?', options: ['Median', 'Mean', 'Range', 'Sum'], answer: 'Median' },
    { question: 'What does a left join return?', options: ['All left-table rows and matching right-table rows', 'Only rows present in both tables', 'Only unmatched right-table rows', 'Every possible row combination'], answer: 'All left-table rows and matching right-table rows' },
    { question: 'Which chart is usually best for showing a trend over time?', options: ['Line chart', 'Pie chart', 'Treemap', 'Network graph'], answer: 'Line chart' },
    { question: 'What is the main purpose of data normalization?', options: ['Put values on a comparable scale', 'Remove all missing values', 'Guarantee causation', 'Increase sample size'], answer: 'Put values on a comparable scale' },
  ],
  'Data Scientist': [
    { question: 'What does overfitting mean?', options: ['A model fits training data too closely and generalizes poorly', 'A model has no parameters', 'A dataset has no labels', 'A model always predicts the mean'], answer: 'A model fits training data too closely and generalizes poorly' },
    { question: 'Why is a test set held out?', options: ['To estimate performance on unseen data', 'To tune every training step', 'To replace feature engineering', 'To increase training examples'], answer: 'To estimate performance on unseen data' },
    { question: 'Which metric is the harmonic mean of precision and recall?', options: ['F1 score', 'R-squared', 'MAE', 'Specificity'], answer: 'F1 score' },
    { question: 'What does regularization help control?', options: ['Model complexity', 'Dataset ownership', 'Feature names', 'Sampling frequency'], answer: 'Model complexity' },
    { question: 'When should a time-series dataset be split for evaluation?', options: ['Chronologically', 'Randomly across all timestamps', 'By sorting target values', 'Only by feature columns'], answer: 'Chronologically' },
  ],
  'Machine Learning Engineer': [
    { question: 'What is data drift?', options: ['A change in production input data distributions', 'A compiler optimization', 'A database backup', 'A model serialization format'], answer: 'A change in production input data distributions' },
    { question: 'Why version a trained model artifact?', options: ['To reproduce and roll back deployments', 'To make inference deterministic on any hardware', 'To avoid evaluating the model', 'To remove monitoring'], answer: 'To reproduce and roll back deployments' },
    { question: 'What is a feature store used for?', options: ['Consistent feature management for training and serving', 'Storing user passwords', 'Rendering dashboards', 'Replacing model evaluation'], answer: 'Consistent feature management for training and serving' },
    { question: 'What does a canary deployment do?', options: ['Gradually exposes a release to a small share of traffic', 'Deletes the previous model immediately', 'Trains on production requests without controls', 'Disables health checks'], answer: 'Gradually exposes a release to a small share of traffic' },
    { question: 'Which metric is important to monitor for an online inference service?', options: ['Latency', 'Notebook cell count', 'Source file length', 'Training dataset filename'], answer: 'Latency' },
  ],
  'DevOps Engineer': [
    { question: 'What is the purpose of a CI pipeline?', options: ['Automatically build and test code changes', 'Store production passwords in source', 'Replace monitoring', 'Manually provision each developer laptop'], answer: 'Automatically build and test code changes' },
    { question: 'What does a container image contain?', options: ['Application and its runtime dependencies', 'A running process only', 'A cloud account password', 'A network firewall rule only'], answer: 'Application and its runtime dependencies' },
    { question: 'Why use health checks in an orchestrator?', options: ['Detect and replace unhealthy instances', 'Encrypt source code', 'Increase database schema size', 'Skip deployment validation'], answer: 'Detect and replace unhealthy instances' },
    { question: 'What is infrastructure as code?', options: ['Declarative, versioned management of infrastructure', 'A manual checklist with no configuration', 'A monitoring dashboard', 'A compiled application binary'], answer: 'Declarative, versioned management of infrastructure' },
    { question: 'What is a least-privilege IAM policy?', options: ['Grants only permissions required for a task', 'Grants administrator access to every service', 'Removes authentication', 'Shares one credential across all users'], answer: 'Grants only permissions required for a task' },
  ],
  'Cybersecurity Analyst': [
    { question: 'What is the principle of least privilege?', options: ['Grant only the access needed to perform a task', 'Share one admin account with everyone', 'Disable audit logging', 'Allow access by default'], answer: 'Grant only the access needed to perform a task' },
    { question: 'What does multi-factor authentication require?', options: ['At least two different authentication factors', 'Two passwords of the same type', 'A username without a password', 'A public IP address'], answer: 'At least two different authentication factors' },
    { question: 'What should an analyst do first after confirming an active incident?', options: ['Follow the incident response and containment procedure', 'Delete all system logs', 'Publish unverified details', 'Disable every backup'], answer: 'Follow the incident response and containment procedure' },
    { question: 'What is phishing?', options: ['A deceptive attempt to obtain sensitive information', 'A method for encrypting backups', 'A network routing protocol', 'A vulnerability patch'], answer: 'A deceptive attempt to obtain sensitive information' },
    { question: 'Why preserve chain of custody for digital evidence?', options: ['To document handling and support evidence integrity', 'To speed up a software build', 'To remove the need for access controls', 'To anonymize network traffic'], answer: 'To document handling and support evidence integrity' },
  ],
};

export const getAssessmentQuestions = asyncHandler(async (req, res) => {
  const careerGoal = String(req.query.careerGoal ?? 'Frontend Developer');
  const questions = questionBank[careerGoal];
  if (!questions) {
    return res.status(400).json({ message: 'No assessment is available for that career goal.' });
  }

  return res.json({
    careerGoal,
    questions: questions.map(({ question, options }) => ({ question, options })),
  });
});

export const createAssessment = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = assessmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Assessment data is invalid.' });
  }

  const { careerGoal, answers } = parsed.data;
  const questions = questionBank[careerGoal];
  if (!questions) {
    return res.status(400).json({ message: 'No assessment is available for that career goal.' });
  }
  if (
    answers.length !== questions.length
    || new Set(answers.map((entry) => entry.question)).size !== questions.length
    || answers.some((entry) => {
      const question = questions.find((item) => item.question === entry.question);
      return !question || !question.options.includes(entry.selectedOption);
    })
  ) {
    return res.status(400).json({ message: 'Submit one valid answer for every assessment question.' });
  }

  const answerRecords = questions.map((question) => {
    const submitted = answers.find((entry) => entry.question === question.question)!;
    const isCorrect = submitted.selectedOption === question.answer;
    return {
      question: question.question,
      selectedOption: submitted.selectedOption,
      correctOption: question.answer,
      isCorrect,
    };
  });
  const correctCount = answerRecords.filter((answer) => answer.isCorrect).length;
  const score = Math.round((correctCount / questions.length) * 100);

  const weakAreas = questions
    .filter((question) => !answerRecords.find((entry) => entry.question === question.question)?.isCorrect)
    .map((question) => question.question);

  const assessment = await SkillAssessment.create({
    user: req.user?.id,
    careerGoal,
    questions,
    answers: answerRecords,
    score,
    resultSummary: `You answered ${correctCount} of ${questions.length} questions correctly (${score}%). Review the weaker areas below.`,
    weakAreas,
  });

  return res.status(201).json({ assessment });
});

export const listAssessments = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const assessments = await SkillAssessment.find({ user: req.user?.id }).sort({ createdAt: -1 });
  return res.json({ assessments });
});
