#
# Copyright 2016 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
 
#!/bin/sh
set -ev

# do not reploy pull requests
test $TRAVIS_PULL_REQUEST = "true" && exit 0
# download google-cloud-sdk if not installed
if [ ! -d ${HOME}/google-cloud-sdk ]; then
   curl https://sdk.cloud.google.com | bash;
   source ~/.bash_profile
fi
# add gcloud to the path
source ~/google-cloud-sdk/path.bash.inc
source ~/google-cloud-sdk/completion.bash.inc
export CLOUDSDK_CORE_DISABLE_PROMPTS=1
gcloud auth activate-service-account --key-file client-secret.json
# download go_appengine if not installed
if [ ! -d ${HOME}/go_appengine ]; then
   curl https://storage.googleapis.com/appengine-sdks/featured/go_appengine_sdk_linux_amd64-1.9.33.zip > go_appengine_sdk_linux_amd64.zip
   unzip go_appengine_sdk_linux_amd64.zip -d ~/
fi
# retrive the auth access token
TOKEN=$(gcloud auth print-access-token)
# deploy to app engine
~/go_appengine/appcfg.py update . --skip_sdk_update_check --oauth2_access_token=$TOKEN -A amp-by-example -V 1
