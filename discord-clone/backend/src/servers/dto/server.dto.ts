import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateServerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;
}

export class JoinServerDto {
  @IsString()
  inviteCode: string;
}
