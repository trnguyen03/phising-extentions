import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_MODEL = Object.freeze({
  intercept: -1.25,
  coefficients: {
    urlLength: 0.015,
    digitCount: 0.04,
    suspiciousKeyword: 1.2,
    hasAtSymbol: 1.4,
    hasHyphen: 0.8,
    subdomainCount: 0.5,
    usesHttps: -0.9
  }
});

let cachedModel = null;

async function loadModel() {
  if (cachedModel) {
    return cachedModel;
  }

  const configuredPath = process.env.MODEL_PATH;
  const defaultPath = path.resolve(__dirname, '../model/logistic_model.json');
  const modelPath = configuredPath ? path.resolve(configuredPath) : defaultPath;

  try {
    const raw = await fs.readFile(modelPath, 'utf-8');
    cachedModel = JSON.parse(raw);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      cachedModel = DEFAULT_MODEL;
    } else {
      throw error;
    }
  }

  return cachedModel;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

export async function scoreFeatures(features) {
  const model = await loadModel();
  const { intercept, coefficients } = model;
  let linear = intercept;
  for (const [key, value] of Object.entries(features)) {
    const weight = coefficients[key] ?? 0;
    linear += weight * value;
  }
  const score = sigmoid(linear);
  return Number(score.toFixed(4));
}
