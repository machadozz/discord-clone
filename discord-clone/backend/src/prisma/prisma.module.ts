import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() faz com que qualquer módulo da aplicação possa injetar o PrismaService
// sem precisar importar o PrismaModule toda vez.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
