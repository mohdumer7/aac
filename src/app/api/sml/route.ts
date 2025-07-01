// app/api/sml/route.ts
import { fileManager } from "@/server/managers/smlFileManager";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { createMongooseObjectId } from "@/shared/functions";
import { SUCCESS, ERROR, INSUFFIENT_DATA } from "@/shared/constants";
import formidable from "formidable";
import { NextRequest } from "next/server";
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
// Disable Next.js default body parsing
// src/app/api/sml/route.ts




// Ensure upload dir exists
const uploadDir = "./public/uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export const config = {
  api: {
    bodyParser: false, // Needed for formidable
  },
};

export async function POST(req: NextRequest) {
  const nodeReq = (req as any)[Symbol.for("nodejs.request")];

  if (!nodeReq || !nodeReq.headers) {
    console.error("Unable to get raw Node request");
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const form = new IncomingForm({
    multiples: true,
    keepExtensions: true,
    uploadDir,
  });

  return await new Promise<Response>((resolve) => {
    form.parse(nodeReq, (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        resolve(
          new Response(JSON.stringify({ error: "Form parse error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        );
        return;
      }

      resolve(
        new Response(JSON.stringify({ fields, files }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });
}
