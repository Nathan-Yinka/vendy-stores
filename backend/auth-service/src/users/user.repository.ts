import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";

@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private readonly repository: Repository<User>) {}

  async seedDefault(): Promise<void> {
    const existing = await this.repository.findOne({
      where: { email: "lead@vendyz.dev" },
    });
    if (!existing) {
      await this.repository.save({
        id: "user-1",
        email: "lead@vendyz.dev",
        role: "ADMIN",
        first_name: "Lead",
        last_name: "Engineer",
        password:
          "$2a$10$Q5R.XW.Fx2lIihY2l5fSEu0aMWEa8m9GQfq2R2zpcY45KpP2k9BEO",
      });
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async createUser(user: {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
    password: string;
  }): Promise<User> {
    return this.repository.save(user);
  }
}
