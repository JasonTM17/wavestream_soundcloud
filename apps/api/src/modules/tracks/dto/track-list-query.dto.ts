import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackListQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsString()
  artistId?: string;

  @IsOptional()
  @IsString()
  artistUsername?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  genre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
