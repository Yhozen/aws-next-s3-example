import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "stream";
import { env } from "~/env.mjs";

const conf = {
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
};

const s3 = new S3Client(conf);

const bucketName = env.AWS_BUCKET_NAME;

/**
 * It returns a presigned URL that can be used to upload a file to S3
 * @param objectKey - The name of the file you want to upload.
 * @param contentType - The content type of the file you're uploading.
 * @returns A presigned URL that can be used to upload a file to S3.
 */
export const getPresignUrl = async (objectKey: string, contentType: string) => {
  const params = {
    Bucket: bucketName,
    Key: objectKey,
    ContentType: contentType,
  };
  const command = new PutObjectCommand(params);

  const url = await getSignedUrl(s3, command, { expiresIn: 60 * 60 });

  console.log({ url });

  return url;
};

const readableToBuffer = (stream: Readable) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.once("end", () => resolve(Buffer.concat(chunks)));
    stream.once("error", reject);
  });

/**
 * It gets a file from S3
 * @param objectKey - The name of the file you want to get.
 * @returns The file object
 */
export const getFile = async (objectKey: string) => {
  const params = {
    Bucket: bucketName,
    Key: objectKey,
  };

  const command = new GetObjectCommand(params);

  const file = await s3.send(command);
  const body = await readableToBuffer(file.Body as Readable);

  if (!body) return;

  return body.toString();
};
