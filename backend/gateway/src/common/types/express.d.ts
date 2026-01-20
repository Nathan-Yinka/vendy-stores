import "express-serve-static-core";
import { AuthUserPayload } from "../../gateway/guards/auth.guard";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUserPayload;
  }
}
