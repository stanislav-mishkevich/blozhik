import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ENV } from './env';

function getS3Client() {
  if (!ENV.s3Bucket || !ENV.s3Region || !ENV.s3AccessKeyId || !ENV.s3SecretAccessKey) {
    throw new Error('S3 is not configured');
  }
  return new S3Client({
    region: ENV.s3Region,
    credentials: {
      accessKeyId: ENV.s3AccessKeyId,
      secretAccessKey: ENV.s3SecretAccessKey,
    },
  });
}

export async function getSignedUploadUrl(key: string, contentType = 'application/octet-stream', expiresInSeconds = 900) {
  const client = getS3Client();
  const bucket = ENV.s3Bucket!;
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  return url;
}

export default { getSignedUploadUrl };
