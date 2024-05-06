import { NextRequest } from "next/server";

export const generateRequestBody = (handle: string) => {
  const req = new NextRequest("http://localhost:3000", {});
  req.nextUrl.searchParams.set("handle", handle);
  return req;
};
