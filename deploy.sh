TRAVIS_PULL_REQUEST = false

export CLOUDSDK_CORE_DISABLE_PROMPTS=1
export CLOUDSDK_PYTHON_SITEPACKAGES=1
export PATH=$PATH:${HOME}/google-cloud-sdk/bin
test $TRAVIS_PULL_REQUEST == "true" && exit 0
if [ ! -d ${HOME}/google-cloud-sdk ]; then
   curl https://sdk.cloud.google.com | bash;
fi
curl https://storage.googleapis.com/appengine-sdks/featured/go_appengine_sdk_linux_amd64-1.9.33.zip > go_appengine_sdk_linux_amd64.zip
unzip go_appengine_sdk_linux_amd64.zip
gcloud auth activate-service-account --key-file client-secret.json
go_appengine/appcfg.py update . --skip_sdk_update_check --oauth2_access_token=$(gcloud auth print-access-token) -A amp-by-example -V 1
