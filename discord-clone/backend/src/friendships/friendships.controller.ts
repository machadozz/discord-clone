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
import { FriendshipsService } from './friendships.service';
import {
  SendFriendRequestDto,
  RespondFriendRequestDto,
  BlockUserDto,
} from './dto/friendship.dto';

@Controller('friends')
@UseGuards(JwtAuthGuard) // todas as rotas exigem login
export class FriendshipsController {
  constructor(private friendshipsService: FriendshipsService) {}

  // Enviar pedido de amizade
  @Post('request')
  sendRequest(@Req() req, @Body() dto: SendFriendRequestDto) {
    return this.friendshipsService.sendRequest(req.user.userId, dto);
  }

  // Aceitar ou recusar pedido pendente
  @Post(':id/respond')
  respond(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: RespondFriendRequestDto,
  ) {
    return this.friendshipsService.respond(id, req.user.userId, dto.accept);
  }

  // Remover amizade
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.friendshipsService.remove(id, req.user.userId);
  }

  // Bloquear usuário
  @Post('block')
  block(@Req() req, @Body() dto: BlockUserDto) {
    return this.friendshipsService.block(req.user.userId, dto.userId);
  }

  // Desbloquear usuário
  @Delete('block/:userId')
  unblock(@Req() req, @Param('userId') userId: string) {
    return this.friendshipsService.unblock(req.user.userId, userId);
  }

  // Listar amigos aceitos
  @Get()
  listFriends(@Req() req) {
    return this.friendshipsService.listFriends(req.user.userId);
  }

  // Listar pedidos pendentes (enviados e recebidos)
  @Get('pending')
  listPending(@Req() req) {
    return this.friendshipsService.listPending(req.user.userId);
  }

  // Listar usuários bloqueados
  @Get('blocked')
  listBlocked(@Req() req) {
    return this.friendshipsService.listBlocked(req.user.userId);
  }
}
