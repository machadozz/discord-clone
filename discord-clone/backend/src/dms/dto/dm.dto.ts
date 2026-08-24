import { IsString, IsNotEmpty } from 'class-validator';

// Criar ou buscar uma conversa direta com outro usuário
export class CreateDmDto {
  @IsString()
  @IsNotEmpty()
  userId: string; // ID do outro participante
}

// Enviar mensagem direta via socket (usado no gateway)
export class SendDmDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
