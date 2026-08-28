import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class OAuthSyncDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
