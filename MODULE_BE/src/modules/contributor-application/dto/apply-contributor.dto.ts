import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ApplyContributorDto {
  @ApiProperty({
    description: 'Giới thiệu bản thân và kinh nghiệm chuyên môn (tối thiểu 20 ký tự)',
    example: 'Tôi là kỹ sư kiểm thử phần mềm với 4 năm kinh nghiệm về Playwright, Jest và CI/CD.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Bio giới thiệu cần tối thiểu 20 ký tự' })
  bio: string;

  @ApiPropertyOptional({
    description: 'Link portfolio, Github hoặc LinkedIn',
    example: 'https://github.com/khanhduy',
  })
  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @ApiProperty({
    description: 'Ý tưởng chuyên đề hoặc bài thực hành dự kiến đóng góp',
    example: 'Series thực hành viết automation test cho REST API với Supertest và Jest.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Ý tưởng chuyên đề cần tối thiểu 10 ký tự' })
  sampleTopic: string;
}
