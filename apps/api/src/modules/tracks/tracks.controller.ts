import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { UserEntity } from 'src/database/entities/user.entity';
import { CreateTrackDto } from 'src/modules/tracks/dto/create-track.dto';
import { TrackListQueryDto } from 'src/modules/tracks/dto/track-list-query.dto';
import { UpdateTrackDto } from 'src/modules/tracks/dto/update-track.dto';
import { TracksService } from 'src/modules/tracks/tracks.service';

@Controller('api/tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Public()
  @Get()
  listTracks(
    @Query() query: TrackListQueryDto,
    @CurrentUser() user?: UserEntity,
  ) {
    return this.tracksService.listTracks(query, user);
  }

  @Get('me/uploads')
  getMyTracks(@CurrentUser() user: UserEntity) {
    return this.tracksService.listMyTracks(user.id);
  }

  @Public()
  @Get(':id')
  getTrack(@Param('id') id: string, @CurrentUser() user?: UserEntity) {
    return this.tracksService.getTrack(id, user);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'audioFile', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
    ]),
  )
  createTrack(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateTrackDto,
    @UploadedFiles()
    files: {
      audioFile?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    },
  ) {
    return this.tracksService.createTrack(
      user,
      dto,
      files.audioFile?.[0],
      files.coverImage?.[0],
    );
  }

  @Patch(':id')
  updateTrack(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateTrackDto,
  ) {
    return this.tracksService.updateTrack(id, user, dto);
  }

  @Delete(':id')
  deleteTrack(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.tracksService.deleteTrack(id, user);
  }

  @Public()
  @Get(':id/stream')
  async streamTrack(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const result = await this.tracksService.streamTrack(
      id,
      user,
      request.headers.range,
    );

    response.status(result.contentRange ? 206 : 200);
    response.setHeader('Content-Type', result.contentType);
    response.setHeader('Content-Length', result.contentLength.toString());
    response.setHeader('Accept-Ranges', result.acceptRanges ?? 'bytes');
    if (result.contentRange) {
      response.setHeader('Content-Range', result.contentRange);
    }

    result.stream.pipe(response);
  }

  @Public()
  @Get(':id/download')
  async downloadTrack(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity | undefined,
    @Res() response: Response,
  ) {
    const result = await this.tracksService.getDownloadUrl(id, user);
    response.redirect(result.url);
  }
}
