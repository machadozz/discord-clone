import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ServersService } from './servers.service';
import { CreateServerDto, JoinServerDto } from './dto/server.dto';

@Controller('servers')
@UseGuards(JwtAuthGuard) // todas as rotas aqui exigem login
export class ServersController {
  constructor(private serversService: ServersService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateServerDto) {
    return this.serversService.create(req.user.userId, dto);
  }

  @Post('join')
  join(@Req() req, @Body() dto: JoinServerDto) {
    return this.serversService.join(req.user.userId, dto);
  }

  @Get()
  findMyServers(@Req() req) {
    return this.serversService.findMyServers(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.serversService.findOne(id, req.user.userId);
  }

  @Post(':id/leave')
  leave(@Req() req, @Param('id') id: string) {
    return this.serversService.leave(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.serversService.delete(id, req.user.userId);
  }

  @Delete(':id/members/:memberId')
  kick(
    @Req() req,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.serversService.kick(id, memberId, req.user.userId);
  }

  @Post(':id/bans')
  ban(
    @Req() req,
    @Param('id') id: string,
    @Body('userId') userIdToBan: string,
    @Body('reason') reason?: string,
  ) {
    return this.serversService.ban(id, userIdToBan, req.user.userId, reason);
  }
}
