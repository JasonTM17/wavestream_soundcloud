import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { UserRole } from '@wavestream/shared';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserEntity } from 'src/database/entities/user.entity';
import { AdminService } from 'src/modules/admin/admin.service';
import { ModerationNoteDto } from 'src/modules/admin/dto/moderation-note.dto';
import { ResolveReportDto } from 'src/modules/admin/dto/resolve-report.dto';
import { UpdateUserRoleDto } from 'src/modules/admin/dto/update-user-role.dto';

@Roles(UserRole.ADMIN)
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  listUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.listUsers(page, limit);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(user, id, dto);
  }

  @Get('tracks')
  listTracks(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.listTracks(page, limit);
  }

  @Patch('tracks/:id/hide')
  hideTrack(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: ModerationNoteDto,
  ) {
    return this.adminService.hideTrack(user, id, dto);
  }

  @Patch('tracks/:id/restore')
  restoreTrack(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.adminService.restoreTrack(user, id);
  }

  @Get('playlists')
  listPlaylists(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.listPlaylists(page, limit);
  }

  @Delete('playlists/:id')
  deletePlaylist(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: ModerationNoteDto,
  ) {
    return this.adminService.deletePlaylist(user, id, dto);
  }

  @Get('comments')
  listComments(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.listComments(page, limit);
  }

  @Patch('comments/:id/hide')
  hideComment(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: ModerationNoteDto,
  ) {
    return this.adminService.hideComment(user, id, dto);
  }

  @Patch('comments/:id/restore')
  restoreComment(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.adminService.restoreComment(user, id);
  }

  @Get('reports')
  listReports(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.listReports(page, limit);
  }

  @Patch('reports/:id/resolve')
  resolveReport(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.adminService.resolveReport(user, id, dto);
  }

  @Get('audit-logs')
  listAuditLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.listAuditLogs(page, limit);
  }
}
