const suspiciousKeywords = [
  'login',
  'verify',
  'update',
  'password',
  'secure',
  'account',
  'bank',
  'invoice',
  'reset'
];

export function extractFeatures(rawUrl) {
  const url = new URL(rawUrl);
  const hostnameParts = url.hostname.split('.');
  const domainParts = hostnameParts.filter(Boolean);
  const subdomainCount = Math.max(domainParts.length - 2, 0);

  const urlWithoutScheme = rawUrl.replace(/^https?:\/\//i, '');
  const digitCount = (urlWithoutScheme.match(/\d/g) || []).length;
  const suspiciousKeyword = suspiciousKeywords.some((kw) => urlWithoutScheme.toLowerCase().includes(kw));
  const hasAtSymbol = rawUrl.includes('@');
  const hasHyphen = url.hostname.includes('-');
  const usesHttps = url.protocol === 'https:';
  const urlLength = urlWithoutScheme.length;

  return {
    urlLength,
    digitCount,
    suspiciousKeyword: suspiciousKeyword ? 1 : 0,
    hasAtSymbol: hasAtSymbol ? 1 : 0,
    hasHyphen: hasHyphen ? 1 : 0,
    subdomainCount,
    usesHttps: usesHttps ? 1 : 0
  };
}

export function featureVectorToReasons(features) {
  const reasons = [];
  if (!features.usesHttps) {
    reasons.push('Trang web không dùng HTTPS.');
  }
  if (features.suspiciousKeyword) {
    reasons.push('URL chứa từ khóa nhạy cảm.');
  }
  if (features.hasAtSymbol) {
    reasons.push('URL chứa ký tự @ bất thường.');
  }
  if (features.hasHyphen) {
    reasons.push('Tên miền chứa dấu gạch ngang.');
  }
  if (features.subdomainCount > 1) {
    reasons.push('URL có quá nhiều tầng subdomain.');
  }
  if (features.urlLength > 80) {
    reasons.push('URL quá dài.');
  }
  return reasons;
}
