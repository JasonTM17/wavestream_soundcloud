import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { CreateCommentDto } from 'src/modules/tracks/dto/create-comment.dto';
import { CreateTrackDto } from 'src/modules/tracks/dto/create-track.dto';
import { RecordPlayDto } from 'src/modules/tracks/dto/record-play.dto';
import { TrackListQueryDto } from 'src/modules/tracks/dto/track-list-query.dto';
import { UpdateTrackDto } from 'src/modules/tracks/dto/update-track.dto';
import { TracksService } from 'src/modules/tracks/tracks.service';

@Controller('api/tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Public()
  @Get()
  listTracks(@Query() query: TrackListQueryDto, @CurrentUser() user?: UserEntity) {
    return this.tracksService.listTracks(query, user);
  }

  @Get('me/uploads')
  getMyTracks(@CurrentUser() user: UserEntity) {
    return this.tracksService.listMyTracks(user.id);
  }

  @Get('me/history')
  getListeningHistory(@CurrentUser() user: UserEntity) {
    return this.tracksService.getListeningHistory(user.id);
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
    return this.tracksService.createTrack(user, dto, files.audioFile?.[0], files.coverImage?.[0]);
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

  @Post(':id/like')
  likeTrack(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.tracksService.likeTrack(id, user);
  }

  @Delete(':id/like')
  unlikeTrack(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.tracksService.unlikeTrack(id, user);
  }

  @Post(':id/repost')
  repostTrack(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.tracksService.repostTrack(id, user);
  }

  @Delete(':id/repost')
  unrepostTrack(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.tracksService.unrepostTrack(id, user);
  }

  @Public()
  @Get(':id/comments')
  getComments(@Param('id') id: string, @CurrentUser() user?: UserEntity) {
    return this.tracksService.getComments(id, user);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateCommentDto,
  ) {
    return this.tracksService.addComment(id, user, dto);
  }

  @Public()
  @HttpCode(200)
  @Post(':id/play')
  recordPlay(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity | undefined,
    @Body() dto: RecordPlayDto,
  ) {
    return this.tracksService.recordPlay(id, user, dto);
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
      typeof request.headers.range === 'string' ? request.headers.range : undefined,
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
