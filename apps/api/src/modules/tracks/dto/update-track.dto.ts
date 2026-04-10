import { PartialType } from '@nestjs/swagger';
import { CreateTrackDto } from 'src/modules/tracks/dto/create-track.dto';

export class UpdateTrackDto extends PartialType(CreateTrackDto) {}
