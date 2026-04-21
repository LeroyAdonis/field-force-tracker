import { auth } from "../../src/lib/auth";

export const POST = (req: Request) => {
  return auth.handler(req);
};

export const GET = (req: Request) => {
  return auth.handler(req);
};
