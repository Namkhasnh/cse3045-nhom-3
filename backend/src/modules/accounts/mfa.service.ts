import { Injectable, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import type { Account } from '../../generated/prisma/client.js';
import { MfaRepository } from './mfa.repository.js';
@Injectable()
export class MfaService {
  constructor(private readonly repository: MfaRepository) {}
  async challenge(account: Account, ip: string) {
    const challenge = await this.repository.challenge(account, ip);
    if (!challenge) throw new ServiceUnavailableException();
    return challenge;
  }
  async verify(raw: string, proof: { code?: string; recovery_code?: string }, ip: string) {
    const result = await this.repository.verify(raw, proof, ip);
    if (!result) throw new UnauthorizedException({ code: 'MFA_INVALID', message: 'MFA proof invalid, expired or exhausted.' });
    return result;
  }
}
