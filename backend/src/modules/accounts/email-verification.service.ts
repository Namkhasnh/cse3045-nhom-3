import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';

export function canonicalEmail(input: unknown): string {
  if (typeof input !== 'string' || input.length > 254) throw new Error('Invalid email address.');
  const parts = input.split('@');
  if (parts.length !== 2 || parts[0].length < 1 || parts[0].length > 64 ||
      !/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(parts[0]) ||
      parts[0].startsWith('.') || parts[0].endsWith('.') || parts[0].includes('..')) {
    throw new Error('Invalid email address.');
  }
  const labels = parts[1].split('.');
  if (parts[1].length > 253 || labels.length < 2 ||
      labels.some((label) => !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label)) ||
      !/^[A-Za-z]{2,63}$/.test(labels.at(-1)!)) throw new Error('Invalid email address.');
  return input.toLowerCase();
}

@Injectable()
export class EmailVerificationService {
  private key() {
    const key = Buffer.from(process.env.CSRF_HMAC_KEY ?? '', 'hex');
    if (key.length !== 32) throw new Error('CSRF_HMAC_KEY must be a 32-byte hex key.');
    return key;
  }

  code() { return randomInt(0, 1_000_000).toString().padStart(6, '0'); }

  hash(accountId: bigint, code: string) {
    return createHmac('sha256', this.key()).update(`email:${accountId}:${code}`).digest('hex');
  }

  matches(accountId: bigint, code: string, hash: string) {
    if (!/^\d{6}$/.test(code) || !/^[0-9a-f]{64}$/.test(hash)) return false;
    return timingSafeEqual(Buffer.from(this.hash(accountId, code), 'hex'), Buffer.from(hash, 'hex'));
  }

  assertConfigured() {
    const host = process.env.SMTP_HOST;
    const from = process.env.SMTP_FROM;
    const port = Number(process.env.SMTP_PORT);
    if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535 ||
        !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new ServiceUnavailableException({ code: 'EMAIL_NOT_CONFIGURED', message: 'Email delivery is not configured.' });
    }
    return { host, port, from };
  }

  async send(to: string, code: string) {
    const { host, port, from } = this.assertConfigured();
    try {
      const transport = nodemailer.createTransport({ host, port, secure: port === 465,
        requireTLS: port !== 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 10000 });
      await transport.sendMail({ from, to, subject: 'Mã xác minh Hòa Lạc Food',
        text: `Mã xác minh tài khoản của bạn: ${code}\nMã có hiệu lực trong 10 phút. Nếu bạn không đăng ký, hãy bỏ qua email này.` });
    } catch {
      throw new ServiceUnavailableException({ code: 'EMAIL_UNAVAILABLE', message: 'Email delivery failed.' });
    }
  }
}
