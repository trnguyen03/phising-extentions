import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function resolveDataPath() {
  const overridePath = process.env.REPORTS_PATH;
  if (overridePath) {
    return path.resolve(overridePath);
  }
  return path.resolve(__dirname, '../data/reported-urls.json');
}

function getDataPath() {
  return resolveDataPath();
}

async function ensureDataFile() {
  try {
    await fs.access(getDataPath());
  } catch (error) {
    const dataPath = getDataPath();
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify([]), 'utf-8');
  }
}

export async function persistReport({ url, notes, verdict, score }) {
  await ensureDataFile();
  const dataPath = getDataPath();
  const content = await fs.readFile(dataPath, 'utf-8');
  const data = JSON.parse(content);
  const record = {
    url,
    notes,
    verdict,
    score,
    reportedAt: new Date().toISOString()
  };
  data.push(record);
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
  return record;
}

export async function listReports() {
  await ensureDataFile();
  const dataPath = getDataPath();
  const content = await fs.readFile(dataPath, 'utf-8');
  return JSON.parse(content);
}
