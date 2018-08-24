package backend

import (
	"io/ioutil"

	"cloud.google.com/go/storage"
	"golang.org/x/net/context"
	"google.golang.org/appengine/file"
)

func readFileFromDatastore(ctx context.Context, filename string) ([]byte, error) {
	bucketName, err := file.DefaultBucketName(ctx)
	if err != nil {
		return nil, err
	}

	client, err := storage.NewClient(ctx)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	bucket := client.Bucket(bucketName)

	rc, err := bucket.Object(filename).NewReader(ctx)
	if err != nil {
		return nil, err
	}
	defer rc.Close()

	data, err := ioutil.ReadAll(rc)
	if err != nil {
		return nil, err
	}

	return data, nil
}
