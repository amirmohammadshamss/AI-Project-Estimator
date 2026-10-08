import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Food Delivery Platform' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    example:
      'A mobile and web platform where customers can order food from restaurants, track delivery status, and pay online.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description!: string;
}
