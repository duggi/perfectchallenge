/*
 * GCS utils
 *
 * Exports `uploadPublicURL` function that publishes a file
 * to a bucket specified by envars, given a mime type and a buffer.
 *
 * The envars are stored as heroku secrets.
 */

// Set up bucket
const {Storage} = require("@google-cloud/storage");
const googleCloudStorage = new Storage({
  //projectId: 'chicksdigscars-216617',
  keyFilename: process.env.GCLOUD_KEY_FILE
});
const bucket = googleCloudStorage.bucket(
  process.env.GCLOUD_STORAGE_BUCKET
);

const q = require('q');
const request = require('request-promise');

exports.uploadFromUrl = function (filename, contentType, url) {
  const defer = q.defer();
  const blob = bucket.file(addExtension(filename, contentType));
  const blobStream = blob.createWriteStream({metadata: {contentType}});
  blobStream.on("error", defer.reject);
  blobStream.on("finish", () => {
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    blob.makePublic().then(() => defer.resolve(publicUrl));
  });
  request(url).pipe(blobStream);
  return defer.promise;
}

function addExtension(filename, mimetype) {
  // Adds extension for mime types image/{gif,png,jpeg}
  // Otherwise returns filename unchanged.
  const match = /^image\/(gif|png|jpeg)$/.exec(mimetype);
  return filename + (match ? '.' + match[1] : '');
}
