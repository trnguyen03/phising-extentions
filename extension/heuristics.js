const suspiciousKeywords = [
  'login',
  'verify',
  'update',
  'password',
  'secure',
  'account',
  'banking'
];

const knownShorteners = [
  'bit.ly',
  'goo.gl',
  't.co',
  'tinyurl.com',
  'ow.ly'
];

const tldWhitelist = new Set([
  'com',
  'org',
  'net',
  'edu',
  'gov',
  'vn'
]);

export function evaluateUrl(urlString) {
  try {
    const url = new URL(urlString);
    const features = {
      hasIPAddress: /^(\d+\.){3}\d+$/.test(url.hostname),
      hasHyphen: url.hostname.includes('-'),
      longUrl: urlString.length > 75,
      suspiciousKeyword: suspiciousKeywords.some((kw) => urlString.toLowerCase().includes(kw)),
      usesHttp: url.protocol === 'http:',
      uncommonTld: !tldWhitelist.has(url.hostname.split('.').pop()?.toLowerCase() ?? ''),
      shortener: knownShorteners.some((domain) => url.hostname.endsWith(domain))
    };

    const score = Object.values(features).reduce((acc, flag) => acc + (flag ? 1 : 0), 0);

    let verdict = 'safe';
    if (score >= 4) {
      verdict = 'danger';
    } else if (score >= 2) {
      verdict = 'warning';
    }

    return { score, verdict, features };
  } catch (error) {
    return {
      score: 0,
      verdict: 'unknown',
      features: {},
      error: error.message
    };
  }
}

export function shouldBypassBackend(verdict) {
  return verdict === 'danger';
}
