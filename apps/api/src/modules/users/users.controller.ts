import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { UserEntity } from 'src/database/entities/user.entity';
import { UpdateProfileDto } from 'src/modules/users/dto/update-profile.dto';
import { UsersService } from 'src/modules/users/users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get(':username')
  getProfile(@Param('username') username: string, @CurrentUser() user?: UserEntity) {
    return this.usersService.getProfile(username, user?.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: UserEntity, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post(':id/follow')
  follow(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.usersService.followUser(user.id, id);
  }

  @Delete(':id/follow')
  unfollow(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.usersService.unfollowUser(user.id, id);
  }

  @Public()
  @Get(':id/followers/list')
  getFollowers(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getFollowers(id, page, limit);
  }

  @Public()
  @Get(':id/following/list')
  getFollowing(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getFollowing(id, page, limit);
  }
}
