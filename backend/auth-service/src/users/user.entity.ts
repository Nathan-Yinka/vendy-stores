import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryColumn({ type: "text" })
  id!: string;

  @Column({ type: "text", unique: true })
  email!: string;

  @Column({ type: "text", default: "USER" })
  role!: string;

  @Column({ type: "text" })
  first_name!: string;

  @Column({ type: "text" })
  last_name!: string;

  @Column({ type: "text" })
  password!: string;
}
