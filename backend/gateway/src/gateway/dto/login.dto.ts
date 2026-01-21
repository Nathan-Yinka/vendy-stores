import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "lead@vendyz.dev" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "flashsale" })
  @IsString()
  @MinLength(6)
  password!: string;
}
