import express from 'express';
import { persistReport, listReports } from '../services/reportService.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { url, notes, verdict, score } = req.body ?? {};
    if (!url) {
      return res.status(400).json({ message: 'Thiếu URL cần báo cáo.' });
    }
    const record = await persistReport({ url, notes: notes ?? '', verdict: verdict ?? 'user-report', score: score ?? null });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const records = await listReports();
    res.json(records);
  } catch (error) {
    next(error);
  }
});

export default router;
