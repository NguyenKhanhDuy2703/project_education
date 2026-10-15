import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReviewContributorAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewContributorDto {
  @ApiProperty({
    enum: ReviewContributorAction,
    description: 'Hành động duyệt: APPROVE hoặc REJECT',
    example: ReviewContributorAction.APPROVE,
  })
  @IsEnum(ReviewContributorAction, { message: 'Action phải là APPROVE hoặc REJECT' })
  @IsNotEmpty()
  action: ReviewContributorAction;

  @ApiPropertyOptional({
    description: 'Ghi chú phản hồi hoặc lý do từ chối của Admin',
    example: 'Hồ sơ đạt tiêu chuẩn chuyên môn tốt, chào mừng bạn tham gia đội ngũ đóng góp!',
  })
  @IsOptional()
  @IsString()
  adminNote?: string;
}
