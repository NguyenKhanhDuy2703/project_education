import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({ example: 'Password@123', description: 'Password (min 8 chars)', minLength: 8 })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ example: '0912345678', description: 'Vietnamese 10-digit phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^(?:\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/, {
    message: 'Invalid phone number format. Must be a 10-digit Vietnamese number (starting with 03, 05, 07, 08, 09)',
  })
  phone: string;
}

export class LoginDto {
  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Email or phone' })
  @IsString()
  @IsOptional()
  identifier?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Email or phone' })
  @IsString()
  @IsOptional()
  phoneOrEmail?: string;

  @ApiProperty({ example: 'Password@123', description: 'Password', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'Refresh token (optional if provided via cookie)' })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!', description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password (min 8 characters)', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
