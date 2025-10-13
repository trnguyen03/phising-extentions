import express from 'express';
import { extractFeatures, featureVectorToReasons } from '../utils/urlFeatures.js';
import { scoreFeatures } from '../services/scoringService.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { url, heuristicVerdict, heuristicScore, heuristicFeatures } = req.body ?? {};
    if (!url) {
      return res.status(400).json({ message: 'Thiếu URL cần kiểm tra.' });
    }

    let features;
    try {
      features = extractFeatures(url);
    } catch (error) {
      return res.status(400).json({ message: 'URL không hợp lệ.', details: error.message });
    }

    const score = await scoreFeatures(features);
    const warningThreshold = Number(process.env.WARNING_THRESHOLD ?? 0.35);
    const dangerThreshold = Number(process.env.DANGER_THRESHOLD ?? 0.6);

    const reasons = featureVectorToReasons(features);
    let verdict = 'safe';
    if (score >= dangerThreshold) {
      verdict = 'danger';
    } else if (score >= warningThreshold) {
      verdict = 'warning';
    }

    if (heuristicVerdict && heuristicVerdict !== 'safe') {
      reasons.push(`Heuristic extension: ${heuristicVerdict} (score ${heuristicScore ?? 'N/A'})`);
    }
    if (heuristicFeatures) {
      Object.entries(heuristicFeatures).forEach(([key, value]) => {
        if (value) {
          reasons.push(`Heuristic kích hoạt: ${key}`);
        }
      });
    }

    res.json({
      url,
      verdict,
      score,
      reasons,
      warningThreshold,
      dangerThreshold,
      evaluatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
