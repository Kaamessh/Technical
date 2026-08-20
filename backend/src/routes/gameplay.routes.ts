import { Router } from 'express';
import {
  getRound1Current,
  submitRound1Answer,
  getRound2Challenge,
  submitRound2Workflow,
  getRound3Challenge,
  submitRound3AiOrReal,
  getRound4Question,
  submitRound4Answer,
  getRound5Clue,
  verifyRound5Password,
  getRound6Cards,
  claimRound6Card,
} from '../controllers/gameplay.controller';
import { authTeamMiddleware } from '../middlewares/authTeam.middleware';

const router = Router();

// Protect all gameplay routes with team middleware
router.use(authTeamMiddleware);

router.get('/round1/current', getRound1Current);
router.post('/round1/answer', submitRound1Answer);

router.get('/round2/challenge', getRound2Challenge);
router.post('/round2/submit', submitRound2Workflow);

router.get('/round3/challenge', getRound3Challenge);
router.post('/round3/submit', submitRound3AiOrReal);

router.get('/round4/question', getRound4Question);
router.post('/round4/answer', submitRound4Answer);

router.get('/round5/clue', getRound5Clue);
router.post('/round5/verify-password', verifyRound5Password);

router.get('/round6/cards', getRound6Cards);
router.post('/round6/claim', claimRound6Card);

export default router;
