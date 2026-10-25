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

  @ApiPropertyOptional({ example: 'theory', description: 'Loại bài học: theory | sql_practice | quiz_checkpoint | automation_lab' })
  @IsString()
  @IsOptional()
  unitType?: string;

  @ApiPropertyOptional({ description: 'ID của Section / Module cha trong Series' })
  @IsUUID()
  @IsOptional()
  sectionId?: string;

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

  @ApiPropertyOptional({ description: 'Schema DDL cho bài thực hành SQL' })
  @IsString()
  @IsOptional()
  sqlSchema?: string;

  @ApiPropertyOptional({ description: 'Mock sample rows hoặc seed cho bài thực hành SQL' })
  @IsOptional()
  sampleData?: any[];

  @ApiPropertyOptional({ description: 'Kết quả kỳ vọng cho bài thực hành SQL' })
  @IsOptional()
  expectedQueryResult?: any[];

  @ApiPropertyOptional({ description: 'Danh sách câu hỏi trắc nghiệm Quiz' })
  @IsOptional()
  quizQuestions?: any[];

  @ApiPropertyOptional({ description: 'Cấu hình linh hoạt dạng JSON/Envelope' })
  @IsOptional()
  config?: Record<string, any>;
}
