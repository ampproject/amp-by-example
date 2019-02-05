#!/usr/bin/env bash

if [[ -e /amppkg/privkey.pem && -e /amppkg/cert.pem ]]; then
  echo "info: /amppkg/{privkey,cert}.pem already exist, not decrypting"
  exit 0
fi

if [[ -z $PASSWORD ]]; then
  # To set the password, see https://cloud.google.com/compute/docs/storing-retrieving-metadata?hl=en_US#projectwide
  # Re security, see https://cloud.google.com/compute/docs/storing-retrieving-metadata#is_metadata_information_secure
  PASSWORD=$(curl -Ss -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/project/attributes/password)
  if [[ $? -ne 0 ]]; then
    echo "error: can't retrieve PASSWORD from metadata store, can't decrypt keys"
    exit 1
  fi
fi

# Why -md md5? https://www.openssl.org/docs/faq.html#USER3
openssl aes-256-cbc -d -md md5 -k "$PASSWORD" -in /amppkg/privkey.pem.enc -out /amppkg/privkey.pem

if [[ $? -ne 0 ]]; then
  echo "error: can't decrypt /amppkg/privkey.pem.enc (wrong password?)"
  exit 1
fi

openssl aes-256-cbc -d -md md5 -k "$PASSWORD" -in /amppkg/cert.pem.enc -out /amppkg/cert.pem

if [[ $? -ne 0 ]]; then
  echo "error: can't decrypt /amppkg/cert.pem.enc (wrong password?)"
  exit 1
fi
