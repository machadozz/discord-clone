import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Usamos esse guard em qualquer rota que exija login:
// @UseGuards(JwtAuthGuard)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
