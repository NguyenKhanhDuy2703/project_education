import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSeriesDto {
  @ApiProperty({ example: 'Testing Cơ Bản cho Người Mới', description: 'Tên topic / series' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'testing-co-ban', description: 'Slug URL (tự động tạo nếu bỏ trống)' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'testing', description: 'Danh mục: testing | backend | devops | database' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Khóa học hướng dẫn viết Test Case và kiểm thử phần mềm thực tế', description: 'Mô tả tổng quan' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'beginner', description: 'Cấp độ: beginner | intermediate | advanced' })
  @IsString()
  @IsOptional()
  level?: string;

  @ApiPropertyOptional({ example: '🧪', description: 'Emoji đại diện cho topic' })
  @IsString()
  @IsOptional()
  coverEmoji?: string;

  @ApiPropertyOptional({ example: 'https://github.com/example/sample-repo' })
  @IsString()
  @IsOptional()
  repoUrl?: string;

  @ApiPropertyOptional({ example: 'https://api.example.com/docs' })
  @IsString()
  @IsOptional()
  swaggerUrl?: string;

  @ApiPropertyOptional({ example: 0, description: 'Thứ tự ưu tiên hiển thị' })
  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional({ example: false, description: 'Chỉ dành cho tài khoản Pro' })
  @IsBoolean()
  @IsOptional()
  isProOnly?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Trạng thái hoạt động' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
