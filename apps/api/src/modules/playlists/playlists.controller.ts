import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { UserEntity } from 'src/database/entities/user.entity';
import { AddTrackDto } from 'src/modules/playlists/dto/add-track.dto';
import { CreatePlaylistDto } from 'src/modules/playlists/dto/create-playlist.dto';
import { ReorderPlaylistDto } from 'src/modules/playlists/dto/reorder-playlist.dto';
import { UpdatePlaylistDto } from 'src/modules/playlists/dto/update-playlist.dto';
import { PlaylistsService } from 'src/modules/playlists/playlists.service';

@Controller('api/playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Public()
  @Get()
  listPlaylists(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('ownerId') ownerId?: string,
    @CurrentUser() user?: UserEntity,
  ) {
    return this.playlistsService.listPlaylists(page, limit, ownerId, user);
  }

  @Get('me')
  getMyPlaylists(@CurrentUser() user: UserEntity) {
    return this.playlistsService.listMyPlaylists(user.id);
  }

  @Public()
  @Get(':id')
  getPlaylist(@Param('id') id: string, @CurrentUser() user?: UserEntity) {
    return this.playlistsService.getPlaylist(id, user);
  }

  @Post()
  createPlaylist(@CurrentUser() user: UserEntity, @Body() dto: CreatePlaylistDto) {
    return this.playlistsService.createPlaylist(user, dto);
  }

  @Patch(':id')
  updatePlaylist(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.updatePlaylist(id, user, dto);
  }

  @Delete(':id')
  deletePlaylist(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.playlistsService.deletePlaylist(id, user);
  }

  @Post(':id/tracks')
  addTrack(@Param('id') id: string, @CurrentUser() user: UserEntity, @Body() dto: AddTrackDto) {
    return this.playlistsService.addTrack(id, user, dto);
  }

  @Delete(':id/tracks/:trackId')
  removeTrack(
    @Param('id') id: string,
    @Param('trackId') trackId: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.playlistsService.removeTrack(id, user, trackId);
  }

  @Patch(':id/tracks/reorder')
  reorderTracks(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: ReorderPlaylistDto,
  ) {
    return this.playlistsService.reorderTracks(id, user, dto);
  }
}
