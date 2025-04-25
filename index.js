
const sharp = require('sharp');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const BUCKET_NAME = 'lambdafunction-task2.5'; 

exports.handler = async (event) => {
    try {
        // Extract the S3 bucket and key from the event
        //const { bucket, key } = event;
        const bucket = event.Records[0].s3.bucket.name;  // Get bucket name from the event
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));  // Get key (path) from the event and decode it
        console.log(`Bucket: ${bucket}`);
        console.log(`Key: ${key}`);



        // Get the image from S3
        const s3Object = await s3.getObject({ Bucket: bucket, Key: key }).promise();
        const imageBuffer = s3Object.Body;

        // Resize the image to 200x200
        const resizedImageBuffer = await sharp(imageBuffer)
            .resize(200, 200)
            .toBuffer();

        // Extract just the filename (e.g., image1.jpg)
        const filename = key.split('/').pop();

        // Define new key for the resized image
          const resizedKey = `resized/${filename}`;

        // Upload the resized image back to S3
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: resizedKey, // The resized image will be stored in a 'resized' folder
            Body: resizedImageBuffer,
            ContentType: 'image/jpeg',
        };

        const uploadResult = await s3.upload(uploadParams).promise();

        console.log(`Resized image uploaded to: ${uploadResult.Location}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Image resized successfully',
                uploadedTo: uploadResult.Location,
            }),
        };
    } catch (error) {
        console.error('Error resizing image:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error resizing the image' }),
        };
    }
};
