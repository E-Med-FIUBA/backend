import { User } from "@prisma/client";

export type ReqUser = Request & { user: User };