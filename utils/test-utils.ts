import { NextRequest } from "next/server";

export const generateRequestBody = (handle: string) => {
  return {
    nextUrl: {
      searchParams: new URLSearchParams({ handle }),
    },
  } as NextRequest;
};
