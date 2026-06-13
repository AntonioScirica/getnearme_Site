import { S3Client, CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';

const ACCOUNT_ID = '89751de0af300652b3af30900643709a';
const ACCESS_KEY = '2da0635166a5fba20a45f9f7b1d96c32';
const SECRET_KEY = 'bb1ecbdf95eeabad45f2ac116ab97e4f79bba9344f2d13f173a240c7736c3019';
const BUCKET_NAME = 'getnearme-media';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

async function run() {
  try {
    console.log(`Creating bucket ${BUCKET_NAME}...`);
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
    console.log('Bucket created!');

    console.log('Configuring CORS...');
    await s3.send(new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedHeaders: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          }
        ]
      }
    }));
    console.log('CORS configured!');
  } catch (err) {
    console.error(err);
  }
}

run();
