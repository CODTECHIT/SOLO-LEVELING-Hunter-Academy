import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class OAuthSyncDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;
}
