import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { FeedbackCategory } from '@prisma/client';

export class CreateFeedbackDto {
  @ApiProperty({ enum: FeedbackCategory, default: FeedbackCategory.other })
  @IsEnum(FeedbackCategory)
  category: FeedbackCategory;

  @ApiProperty({ example: 'Em thấy bài lab SQL bị lỗi cú pháp...', description: 'Feedback content' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Nội dung phản hồi cần tối thiểu 5 ký tự' })
  @MaxLength(2000, { message: 'Nội dung phản hồi không quá 2000 ký tự' })
  message: string;

  @ApiPropertyOptional({ example: 'student@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '/labs/sql-join-basics' })
  @IsString()
  @IsOptional()
  pageUrl?: string;
}
