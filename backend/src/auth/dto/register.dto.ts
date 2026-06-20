import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', format: 'email' })
  email!: string;

  @ApiProperty({ example: 'john' })
  username!: string;

  @ApiProperty({ example: 'strong-password', format: 'password' })
  password!: string;
}
