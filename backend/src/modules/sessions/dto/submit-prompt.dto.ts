import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitPromptDto {
  @ApiProperty({
    description: 'Prompt user gửi để tạo hoặc cải thiện prototype.',
    example: 'Tôi cần cải thiện UI phần meeting',
    maxLength: 4000,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;

  @ApiPropertyOptional({
    description:
      'Multipart image files. Field này chỉ để whitelist form-data; file thật được xử lý qua UploadedFiles.',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  images?: unknown;
}
