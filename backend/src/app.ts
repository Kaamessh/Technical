import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import eventsRoutes from './routes/events.routes';
import slotsRoutes from './routes/slots.routes';
import questionsRoutes from './routes/questions.routes';
import workflowRoutes from './routes/workflow.routes';
import aiOrRealRoutes from './routes/aiOrReal.routes';
import dataChallengeRoutes from './routes/dataChallenge.routes';
import decodeWordsRoutes from './routes/decodeWords.routes';
import gameplayRoutes from './routes/gameplay.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import pointsRoutes from './routes/points.routes';
import teamsAdminRoutes from './routes/teamsAdmin.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/workflow-challenges', workflowRoutes);
app.use('/api/ai-or-real', aiOrRealRoutes);
app.use('/api/data-challenge', dataChallengeRoutes);
app.use('/api/decode-words', decodeWordsRoutes);
app.use('/api/gameplay', gameplayRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/teams', teamsAdminRoutes);

// Centralized Error Handler
app.use(errorHandler);

export default app;
