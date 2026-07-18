import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppConfig } from '../../../config/app.config';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginPrivateBetaDto } from '../dto/login-private-beta.dto';

const AUTH_COOKIE_NAME = 'archetype_private_beta';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService<AppConfig>,
    private readonly workspaceService: WorkspaceService,
  ) {}

  get cookieName() {
    return AUTH_COOKIE_NAME;
  }

  async login(dto: LoginPrivateBetaDto): Promise<AuthResponseDto> {
    const betaConfig = this.configService.getOrThrow('PRIVATE_BETA', {
      infer: true,
    });

    if (
      dto.email.toLowerCase() !== betaConfig.USER_EMAIL.toLowerCase() ||
      !this.constantTimeEquals(dto.passcode, betaConfig.PASSCODE)
    ) {
      throw new UnauthorizedException('Invalid private beta credentials.');
    }

    return this.buildAuthPayload();
  }

  async getCurrentActor(
    cookieValue: string | undefined,
  ): Promise<AuthResponseDto> {
    const betaConfig = this.configService.getOrThrow('PRIVATE_BETA', {
      infer: true,
    });

    if (
      !cookieValue ||
      !this.verifyCookieValue(cookieValue, betaConfig.USER_EMAIL)
    ) {
      throw new UnauthorizedException('Private beta session required.');
    }

    return this.buildAuthPayload();
  }

  createCookieValue(email: string): string {
    const payload = Buffer.from(email, 'utf8').toString('base64url');

    return `${payload}.${this.sign(payload)}`;
  }

  private verifyCookieValue(
    cookieValue: string,
    expectedEmail: string,
  ): boolean {
    const [payload, signature] = cookieValue.split('.');

    if (!payload || !signature) {
      return false;
    }

    const email = Buffer.from(payload, 'base64url').toString('utf8');

    return (
      email.toLowerCase() === expectedEmail.toLowerCase() &&
      this.constantTimeEquals(signature, this.sign(payload))
    );
  }

  private async buildAuthPayload(): Promise<AuthResponseDto> {
    const betaConfig = this.configService.getOrThrow('PRIVATE_BETA', {
      infer: true,
    });
    const workspace = await this.workspaceService.getOrCreateDemoWorkspace();

    return {
      user: {
        id: 'private-beta-founder',
        email: betaConfig.USER_EMAIL,
        displayName: betaConfig.USER_NAME,
      },
      workspace,
      membership: {
        id: 'private-beta-membership',
        role: betaConfig.USER_ROLE,
      },
    };
  }

  private sign(value: string): string {
    const betaConfig = this.configService.getOrThrow('PRIVATE_BETA', {
      infer: true,
    });

    return createHmac('sha256', betaConfig.COOKIE_SECRET)
      .update(value)
      .digest('base64url');
  }

  private constantTimeEquals(actual: string, expected: string): boolean {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);

    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }
}
