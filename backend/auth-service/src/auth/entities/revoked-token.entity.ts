import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "revoked_tokens" })
export class RevokedToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", unique: true })
  token!: string;

  @Column({ type: "timestamptz" })
  expires_at!: Date;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;
}
