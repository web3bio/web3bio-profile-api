import type { NextRequest } from "next/server";
import { getSocialGraph } from "../utils";

export const GET = (req: NextRequest) => getSocialGraph(req, "recommendations");
