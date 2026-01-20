import { IsString } from "class-validator";

export class HealthPingDto {
  @IsString()
  service!: string;
}
