const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { generateRandomImageName } = require("./randomNameGenerator");

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY,
  },
});

class AwsBucket {
  #bucket = process.env.AWS_S3_BUCKET_NAME;

  constructor() {}

  uploadFile(buffer, type) {
    const awsParams = {
      Bucket: this.#bucket,
      Key: generateRandomImageName(),
      Body: buffer,
      ContentType: type,
    };
    const awsCommand = new PutObjectCommand(awsParams);
    return s3Client.send(awsCommand);
  }

  deleteFile(filename) {
    const awsParams = {
      Bucket: this.#bucket,
      Key: filename,
    };

    const command = new DeleteObjectCommand(awsParams);
    return s3Client.send(command);
  }

  createSignedUrl(filename) {
    const command = new GetObjectCommand({
      Bucket: this.#bucket,
      Key: filename,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }
}

module.exports = { AwsBucket: new AwsBucket(), s3Client };
