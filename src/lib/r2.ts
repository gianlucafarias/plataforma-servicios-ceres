import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = normalizeR2Endpoint(process.env.R2_ENDPOINT);
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL;

let warnedAboutEndpointPath = false;

function normalizeR2Endpoint(value?: string) {
  if (!value) {
    return value;
  }

  try {
    const url = new URL(value);
    const hadPath = url.pathname && url.pathname !== "/";
    url.pathname = "";
    url.search = "";
    url.hash = "";

    if (hadPath && !warnedAboutEndpointPath) {
      warnedAboutEndpointPath = true;
      console.warn(
        "R2_ENDPOINT incluye un path. Se ignora automaticamente y se usa solo el endpoint de cuenta."
      );
    }

    return url.toString().replace(/\/+$/, "");
  } catch {
    return value.replace(/\/+$/, "");
  }
}

export function isR2StorageConfigured() {
  return !!R2_BUCKET_NAME && !!R2_ENDPOINT && !!R2_ACCESS_KEY_ID && !!R2_SECRET_ACCESS_KEY;
}

export function isR2Configured() {
  return isR2StorageConfigured() && !!R2_PUBLIC_BASE_URL;
}

let r2Client: S3Client | null = null;

function getR2Client() {
  if (!isR2StorageConfigured()) {
    throw new Error("R2 no esta correctamente configurado");
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

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType,
    })
  );

  return {
    key: options.key,
    url: getR2PublicUrl(options.key),
  };
}

export async function uploadPrivateToR2(options: {
  key: string;
  contentType: string;
  body: Buffer;
}) {
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType,
    })
  );

  return {
    key: options.key,
  };
}

export async function getR2Object(key: string) {
  const client = getR2Client();

  return client.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}

export function getR2PublicUrl(key: string): string {
  const base = R2_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "";
  const cleanKey = key.replace(/^\/+/, "");
  return `${base}/${cleanKey}`;
}
