import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";

export class UpdateStockDto {
  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(0)
  stock!: number;
}
