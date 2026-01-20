import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL;

export function isR2Configured() {
  return (
    !!R2_BUCKET_NAME &&
    !!R2_ENDPOINT &&
    !!R2_ACCESS_KEY_ID &&
    !!R2_SECRET_ACCESS_KEY &&
    !!R2_PUBLIC_BASE_URL
  );
}

let r2Client: S3Client | null = null;

function getR2Client() {
  if (!isR2Configured()) {
    throw new Error("R2 no está correctamente configurado");
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID as string,
        secretAccessKey: R2_SECRET_ACCESS_KEY as string,
      },
    });
  }

  return r2Client;
}

export async function uploadToR2(options: {
  key: string;
  contentType: string;
  body: Buffer;
}) {
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: options.key,
    Body: options.body,
    ContentType: options.contentType,
  });

  await client.send(command);

  return {
    key: options.key,
    url: getR2PublicUrl(options.key),
  };
}

export function getR2PublicUrl(key: string): string {
  // R2_PUBLIC_BASE_URL debería ser algo tipo: https://static.ceres.gob.ar
  const base = R2_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "";
  const cleanKey = key.replace(/^\/+/, "");
  return `${base}/${cleanKey}`;
}

