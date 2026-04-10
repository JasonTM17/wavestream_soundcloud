import { TrackPrivacy, TrackStatus } from '@wavestream/shared';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) =>
  value === true || value === 'true' || value === '1';

const toTags = ({ value }: { value: unknown }): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export class CreateTrackDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  genre?: string;

  @IsOptional()
  @Transform(toTags)
  tags?: string[];

  @IsOptional()
  @IsEnum(TrackPrivacy)
  privacy?: TrackPrivacy;

  @IsOptional()
  @IsEnum(TrackStatus)
  status?: TrackStatus;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  allowDownloads?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  commentsEnabled?: boolean;
}
