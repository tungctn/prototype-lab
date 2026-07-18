import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceResponseDto } from '../../workspace/dto/workspace-response.dto';

export class AuthUserResponseDto {
  @ApiProperty({
    description: 'Stable private beta user ID.',
    example: 'private-beta-founder',
  })
  id!: string;

  @ApiProperty({
    description: 'Signed-in private beta user email.',
    example: 'founder@archetype.dev',
  })
  email!: string;

  @ApiProperty({
    description: 'Display name for the signed-in user.',
    example: 'Founder',
  })
  displayName!: string;
}

export class AuthMembershipResponseDto {
  @ApiProperty({
    description: 'Stable membership ID for the demo workspace.',
    example: 'private-beta-membership',
  })
  id!: string;

  @ApiProperty({
    description: 'Workspace role for the signed-in user.',
    example: 'owner',
  })
  role!: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;

  @ApiProperty({ type: WorkspaceResponseDto })
  workspace!: WorkspaceResponseDto;

  @ApiProperty({ type: AuthMembershipResponseDto })
  membership!: AuthMembershipResponseDto;
}
