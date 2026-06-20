import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Username or email address',
    example: 'john',
  })
  username!: string;

  @ApiProperty({ example: 'strong-password', format: 'password' })
  password!: string;
}
