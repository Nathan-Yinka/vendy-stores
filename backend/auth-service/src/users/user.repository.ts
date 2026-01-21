import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";
import bcrypt from "bcryptjs";

@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private readonly repository: Repository<User>) {}

  async seedDefault(): Promise<void> {
    const existing = await this.repository.findOne({
      where: { email: "lead@vendyz.dev" },
    });
    const hashedPassword = await bcrypt.hash("flashsale", 10);
    const seedUser = {
      id: existing?.id ?? "user-1",
      email: "lead@vendyz.dev",
      role: "ADMIN",
      first_name: "Lead",
      last_name: "Engineer",
      password: hashedPassword,
    };

    if (!existing) {
      await this.repository.save(seedUser);
      return;
    }

    await this.repository.update({ id: existing.id }, seedUser);
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
