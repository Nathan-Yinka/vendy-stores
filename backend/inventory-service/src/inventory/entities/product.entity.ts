import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "products" })
export class Product {
  @PrimaryColumn({ type: "text" })
  id!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "integer", default: 0 })
  stock!: number;
}
