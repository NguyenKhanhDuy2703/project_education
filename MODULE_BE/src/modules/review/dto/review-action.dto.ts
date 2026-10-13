import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestChangesDto {
  @ApiProperty({ example: 'Cần bổ sung thêm ví dụ test case biên cho hàm isValidEmail', description: 'Nội dung phản hồi chi tiết yêu cầu sửa' })
  @IsString()
  @IsNotEmpty()
  feedback: string;
}

export class RejectContentDto {
  @ApiProperty({ example: 'Nội dung trùng lặp hoặc vi phạm quy chuẩn nền tảng', description: 'Lý do từ chối bài viết' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class TransferOwnershipDto {
  @ApiProperty({ example: 'user-uuid-alex', description: 'User ID của tác giả mới' })
  @IsString()
  @IsNotEmpty()
  newAuthorId: string;

  @ApiPropertyOptional({ example: 'Bàn giao quản lý chuyên đề kiểm thử', description: 'Lý do chuyển giao quyền sở hữu' })
  @IsString()
  @IsOptional()
  reason?: string;
}
