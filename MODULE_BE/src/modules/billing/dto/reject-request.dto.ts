import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectUpgradeRequestDto {
  @ApiProperty({ example: 'Chưa nhận được giao dịch chuyển khoản từ ngân hàng', description: 'Reason for rejection visible to learner' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
