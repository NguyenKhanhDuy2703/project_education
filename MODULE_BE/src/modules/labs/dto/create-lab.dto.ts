import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLabDto {
  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001', description: 'ID của Topic / Series cha' })
  @IsUUID()
  @IsNotEmpty()
  seriesId: string;

  @ApiProperty({ example: 'Test Case là gì? Viết test case đầu tiên', description: 'Tiêu đề bài thực hành / blog' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'test-case-la-gi', description: 'Slug URL (tự động tạo nếu bỏ trống)' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'js_worker', description: 'Loại môi trường: js_worker | sql_worker | markdown_only' })
  @IsString()
  @IsOptional()
  sandboxType?: string;

  @ApiPropertyOptional({ example: 'Hiểu cấu trúc và viết test case kiểm thử email' })
  @IsString()
  @IsOptional()
  objective?: string;

  @ApiProperty({ example: '# Hướng dẫn bài tập\n\nNội dung Markdown hướng dẫn...', description: 'Nội dung chi tiết định dạng Markdown' })
  @IsString()
  @IsNotEmpty()
  instructions: string;

  @ApiPropertyOptional({ example: 'function isValidEmail(email) {\n  // TODO\n}' })
  @IsString()
  @IsOptional()
  initialSnippet?: string;

  @ApiPropertyOptional({ example: "assert('Email hop le', isValidEmail('a@b.com') === true);" })
  @IsString()
  @IsOptional()
  testScript?: string;

  @ApiPropertyOptional({ example: 'return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);' })
  @IsString()
  @IsOptional()
  solution?: string;

  @ApiPropertyOptional({ example: 20, description: 'Thời gian ước tính (phút)' })
  @IsInt()
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: true, description: 'Cho phép học thử miễn phí' })
  @IsBoolean()
  @IsOptional()
  isFreePreview?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Chỉ dành cho tài khoản Pro' })
  @IsBoolean()
  @IsOptional()
  isProOnly?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Thứ tự trong Topic' })
  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional({ example: true, description: 'Trạng thái kích hoạt' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
