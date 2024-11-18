import { Doctor, Pharmacist, User } from '@prisma/client';

type ExtendedUser = User & { pharmacist?: Pharmacist; doctor?: Doctor };
export type ReqUser = Request & { user: ExtendedUser };
