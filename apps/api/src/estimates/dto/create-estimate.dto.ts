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
  @IsString() @MaxLength(200) @Matches(/\S/) name!: string;
  @IsString() @MaxLength(5000) @Matches(/\S/) description!: string;
  @IsString() @MaxLength(200) @Matches(/\S/) category!: string;
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']) complexity!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(1000000) estimatedHours!: number;
  @IsNumber() @Min(0) @Max(1) confidence!: number;
}

export class CreateEstimateDto {
  @IsString() @MaxLength(10000) @Matches(/\S/) summary!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(1000000) hourlyRate!: number;
  @IsOptional() @Matches(/^[A-Z]{3}$/) currency?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => EstimateItemDto)
  features!: EstimateItemDto[];
}

export class EditHoursDto {
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(1000000) estimatedHours!: number;
}

export class GenerateEstimateDto {
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(1000000) hourlyRate!: number;
  @IsOptional() @Matches(/^[A-Z]{3}$/) currency?: string;
}
