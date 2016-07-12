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
