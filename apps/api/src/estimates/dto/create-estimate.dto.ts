import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class EstimateItemDto {
  @ApiProperty({ example: 'Authentication', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @Matches(/\S/)
  name!: string;
  @ApiProperty({ example: 'Secure login and recovery', maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  @Matches(/\S/)
  description!: string;
  @ApiProperty({ example: 'Identity' })
  @IsString()
  @MaxLength(200)
  @Matches(/\S/)
  category!: string;
  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] })
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'])
  complexity!: string;
  @ApiProperty({ example: 24, minimum: 0.01, maximum: 1000000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1000000)
  estimatedHours!: number;
  @ApiProperty({ minimum: 0, maximum: 1, example: 0.85 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;
}

export class CreateEstimateDto {
  @ApiProperty({ example: 'An authenticated customer portal' })
  @IsString()
  @MaxLength(10000)
  @Matches(/\S/)
  summary!: string;
  @ApiProperty({ minimum: 0, maximum: 1000000, example: 50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  hourlyRate!: number;
  @ApiPropertyOptional({ example: 'USD', pattern: '^[A-Z]{3}$', default: 'USD' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;
  @ApiProperty({ type: [EstimateItemDto], minItems: 1, maxItems: 200 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => EstimateItemDto)
  features!: EstimateItemDto[];
}

export class EditHoursDto {
  @ApiProperty({ example: 24, minimum: 0.01, maximum: 1000000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1000000)
  estimatedHours!: number;
}

export class GenerateEstimateDto {
  @ApiProperty({ minimum: 0, maximum: 1000000, example: 50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  hourlyRate!: number;
  @ApiPropertyOptional({ example: 'USD', pattern: '^[A-Z]{3}$', default: 'USD' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;
}
