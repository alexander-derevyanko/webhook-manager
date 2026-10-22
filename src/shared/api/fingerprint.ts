const FINGERPRINT_STORAGE_KEY = 'webhook-manager:fingerprint';

export function getFingerprint(): string {
  const existingFingerprint = localStorage.getItem(FINGERPRINT_STORAGE_KEY);

  if (existingFingerprint && /^[0-9a-f]{32}$/.test(existingFingerprint)) {
    return existingFingerprint;
  }

  const fingerprint = crypto.randomUUID().replaceAll('-', '');

  localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprint);

  return fingerprint;
}
