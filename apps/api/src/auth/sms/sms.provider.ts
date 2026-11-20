import { Logger } from '@nestjs/common';
import { Twilio } from 'twilio';
import { AppConfigService } from '../../config/app-config.module';

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

export interface SmsProvider {
  readonly name: string;
  sendOtp(phoneE164: string, code: string): Promise<void>;
}

/**
 * Development provider: prints the code to the API log so the flow can be
 * tested end-to-end without SMS credits.
 */
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = 'console';
  private readonly logger = new Logger('SMS');

  async sendOtp(phoneE164: string, code: string): Promise<void> {
    this.logger.log(`OTP for ${phoneE164}: ${code} (console provider — no SMS sent)`);
  }
}

/** Production provider: raw SMS through Twilio Messages. */
export class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio';
  private readonly logger = new Logger('SMS');
  private readonly client: Twilio;

  constructor(private readonly config: AppConfigService) {
    this.client = new Twilio(config.env.TWILIO_ACCOUNT_SID, config.env.TWILIO_AUTH_TOKEN);
  }

  async sendOtp(phoneE164: string, code: string): Promise<void> {
    const from = this.config.env.TWILIO_FROM_NUMBER;
    if (!from) {
      throw new Error('TWILIO_FROM_NUMBER is not configured');
    }

    try {
      await this.client.messages.create({
        to: phoneE164,
        from,
        body: `${this.config.env.SMS_SENDER_NAME}: your verification code is ${code}. It expires in 5 minutes.`,
      });
      this.logger.log(`OTP sent to ${phoneE164} via Twilio`);
    } catch (error) {
      this.logger.error(
        `Twilio delivery failed for ${phoneE164}`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }
}

export function createSmsProvider(config: AppConfigService): SmsProvider {
  return config.env.SMS_PROVIDER === 'twilio'
    ? new TwilioSmsProvider(config)
    : new ConsoleSmsProvider();
}
