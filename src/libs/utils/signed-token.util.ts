import { createHmac } from 'crypto';

// Minimal base64url helpers to avoid extra dependencies
const base64UrlEncode = (input: Buffer | string) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const base64UrlDecode = (input: string) =>
  Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

export interface SignedTokenPayload {
  email: string;
  type: 'verification' | 'password_reset';
  exp: number; // Unix seconds
  [key: string]: unknown;
}

export const signPayload = (payload: SignedTokenPayload, secret: string) => {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedPayload}.${signature}`;
};

export const verifyPayload = <T extends SignedTokenPayload>(
  token: string,
  secret: string,
): T => {
  const [encodedPayload, providedSignature] = token.split('.');

  if (!encodedPayload || !providedSignature) {
    throw new Error('Malformed token');
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (expectedSignature !== providedSignature) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString()) as T;

  if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
    throw new Error('Token expired');
  }

  return payload;
};

