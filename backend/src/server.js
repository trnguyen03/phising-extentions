import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import checkRoute from './routes/checkRoute.js';
import reportRoute from './routes/reportRoute.js';

dotenv.config();

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'PhishGuard backend đang chạy.' });
});

app.use('/api/check-url', checkRoute);
app.use('/api/report-url', reportRoute);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Đã xảy ra lỗi không mong muốn.', details: err.message });
});

app.listen(port, () => {
  console.log(`PhishGuard backend listening on port ${port}`);
});
