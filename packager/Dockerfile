# Maybe switch to one of the Google-provided images? But seems to be go 1.8, not 1.10:
# https://cloud.google.com/appengine/docs/flexible/custom-runtimes/build#base
FROM golang:1.11

ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init
ENTRYPOINT ["dumb-init", "--"]

RUN groupadd -r amppkg && useradd --no-log-init -r -g amppkg amppkg
WORKDIR /amppkg

COPY amppkg.toml /amppkg
COPY dist /www
# Copy whatever certs are available in the certs/ directory (both encrypted and
# unencrypted) into the container. (./decrypt.sh will NOOP if any *.pem exist.)
COPY certs/*pem* /amppkg/
COPY decrypt.sh /amppkg
# Need an easy way to generate this diff? Use the GitHub API--example of a diff
# between ampproject/amppackager:master and a fork at
# ithinkihaveacat/ampproject:abe:
# https://github.com/ampproject/amppackager/compare/master...ithinkihaveacat:abe.diff
COPY amppackager.diff /amppkg
RUN chmod +x /amppkg/decrypt.sh
RUN chown -R amppkg:amppkg /amppkg

# Because it's not possible to directly install a fork of a package via "go get"
# (see https://blog.sgmansfield.com/2016/06/working-with-forks-in-go/), we
# instead download the upstream, apply the appropriate patch, and then install
# the patched version.
RUN go get -d -u github.com/ampproject/amppackager/cmd/amppkg
# See above for how to instructions on how to generate the diff
RUN git -C $GOPATH/src/github.com/ampproject/amppackager apply < /amppkg/amppackager.diff
RUN go install github.com/ampproject/amppackager/cmd/amppkg

USER amppkg
EXPOSE 8080
CMD [ "bash", "-c", "./decrypt.sh && exec amppkg -config /amppkg/amppkg.toml" ]
