import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

type R2Config = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

let client: S3Client | null = null;

function getR2Config(): R2Config {
  const endpoint = env.R2_ENDPOINT;
  const bucket = env.R2_BUCKET;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 storage is not configured");
  }

  return {
    endpoint,
    bucket,
    accessKeyId,
    secretAccessKey,
  };
}

function getR2Client() {
  if (client) {
    return client;
  }

  const config = getR2Config();
  client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return client;
}

export async function uploadFileToR2(input: {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
}) {
  const config = getR2Config();
  const r2 = getR2Client();

  await r2.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: input.key,
    Body: input.body,
    ContentType: input.contentType,
    CacheControl: input.cacheControl ?? "private, max-age=31536000, immutable",
  }));

  return { key: input.key };
}

export async function downloadFileFromR2(key: string) {
  const config = getR2Config();
  const r2 = getR2Client();
  const result = await r2.send(new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  }));

  if (!result.Body) {
    throw new Error("Stored file body missing");
  }

  const body = Buffer.from(await result.Body.transformToByteArray());

  return {
    body,
    contentType: result.ContentType ?? "application/octet-stream",
    contentLength: result.ContentLength ?? body.byteLength,
    etag: result.ETag ?? undefined,
    lastModified: result.LastModified ?? undefined,
  };
}

export async function getSignedDownloadUrlFromR2(
  key: string,
  options?: { expiresIn?: number },
) {
  const config = getR2Config();
  const r2 = getR2Client();

  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
    { expiresIn: options?.expiresIn ?? 300 },
  );
}

export async function deleteFileFromR2(key: string) {
  const config = getR2Config();
  const r2 = getR2Client();

  await r2.send(new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: key,
  }));
}
