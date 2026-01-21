import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Min } from "class-validator";

export class CreateProductDto {
  @ApiProperty({ example: "Vendyz Flash Item" })
  @IsString()
  name!: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  stock!: number;
}
