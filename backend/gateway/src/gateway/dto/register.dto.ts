import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "jane@vendyz.dev" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "strongpass" })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: "Jane" })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  @MinLength(1)
  lastName!: string;
}
