import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginPrivateBetaDto } from '../dto/login-private-beta.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current private beta actor',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({
    description: 'No valid private beta session cookie was sent.',
  })
  getCurrentActor(@Req() request: Request): Promise<AuthResponseDto> {
    return this.authService.getCurrentActor(
      this.getCookieValue(request, this.authService.cookieName),
    );
  }

  @Post('login')
  @ApiOperation({
    summary: 'Sign in with private beta credentials',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({
    description: 'The private beta email or passcode was invalid.',
  })
  async login(
    @Body() dto: LoginPrivateBetaDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const payload = await this.authService.login(dto);

    response.cookie(
      this.authService.cookieName,
      this.authService.createCookieValue(payload.user.email),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 14,
      },
    );

    return payload;
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Sign out of the private beta session',
  })
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(this.authService.cookieName, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
  }

  private getCookieValue(
    request: Request,
    cookieName: string,
  ): string | undefined {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return undefined;
    }

    return cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
  }
}
