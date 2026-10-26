import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendAnnouncementDto {
  @ApiProperty({ example: 'Bảo trì hệ thống ngày 28/10', description: 'Announcement title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Hệ thống sẽ bảo trì từ 2h đến 4h sáng.', description: 'Announcement body text' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ example: '/dashboard', description: 'Internal action path link' })
  @IsString()
  @IsOptional()
  actionPath?: string;

  @ApiPropertyOptional({ example: 'ALL', description: 'Audience: ALL or comma-separated roles like "user,userPro"' })
  @IsString()
  @IsOptional()
  targetAudience?: string;

  @ApiPropertyOptional({ example: 'ALL', description: 'Alias for targetAudience' })
  @IsString()
  @IsOptional()
  audience?: string;
}

