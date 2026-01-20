import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "orders" })
export class Order {
  @PrimaryColumn({ type: "text" })
  id!: string;

  @Column({ type: "text" })
  @Index()
  product_id!: string;

  @Column({ type: "integer" })
  quantity!: number;

  @Column({ type: "text" })
  @Index()
  user_id!: string;

  @Column({ type: "text" })
  status!: string;
}
