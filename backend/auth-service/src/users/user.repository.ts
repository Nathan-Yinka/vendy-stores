import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";
import bcrypt from "bcryptjs";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
    private readonly config: ConfigService
  ) {}

  async seedDefault(): Promise<void> {
    const seedEmail = this.config.get<string>("auth.seed.email");
    const seedPassword = this.config.get<string>("auth.seed.password");
    if (!seedEmail || !seedPassword) {
      return;
    }

    const existing = await this.repository.findOne({
      where: { email: seedEmail },
    });
    const hashedPassword = await bcrypt.hash(seedPassword, 10);
    const seedUser = {
      id: existing?.id ?? "user-1",
      email: seedEmail,
      role: this.config.get<string>("auth.seed.role", "ADMIN"),
      first_name: this.config.get<string>("auth.seed.firstName", "Lead"),
      last_name: this.config.get<string>("auth.seed.lastName", "Engineer"),
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
