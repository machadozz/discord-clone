import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

// Envia pedido de amizade usando a tag do Discord (usuario#0001)
export class SendFriendRequestDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  discriminator: string;
}

// Aceitar ou recusar pedido pendente
export class RespondFriendRequestDto {
  @IsBoolean()
  accept: boolean;
}

// Bloquear alguém pelo ID
export class BlockUserDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
