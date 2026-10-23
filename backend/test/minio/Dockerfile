# Synthetic tests only. Upstream no longer serves the pinned prebuilt image.
# Source: MinIO RELEASE.2025-09-07T16-13-09Z, verified annotated release tag.
FROM --platform=$BUILDPLATFORM golang:1.24.7-bookworm@sha256:b8bae5bd9ba9b1f89b635c91c24cc75cea335a16fb5076310f38566fc674b1ec AS build
ARG TARGETOS
ARG TARGETARCH
WORKDIR /src
RUN curl --fail --location --silent --show-error \
      https://codeload.github.com/minio/minio/tar.gz/07c3a429bfed433e49018cb0f78a52145d4bedeb \
      --output /tmp/minio.tar.gz \
    && echo '8819e3e7817e46b7b3798f8f200ead208562e571563c2e040352378031abe9f2  /tmp/minio.tar.gz' | sha256sum --check \
    && tar -xzf /tmp/minio.tar.gz --strip-components=1 \
    && rm /tmp/minio.tar.gz
ENV GOTOOLCHAIN=local
RUN go mod download
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -mod=readonly -trimpath -buildvcs=false \
    -ldflags='-s -w -X github.com/minio/minio/cmd.Version=2025-09-07T16:13:09Z -X github.com/minio/minio/cmd.ReleaseTag=RELEASE.2025-09-07T16-13-09Z -X github.com/minio/minio/cmd.CommitID=07c3a429bfed433e49018cb0f78a52145d4bedeb' \
    -o /out/minio .

FROM scratch
LABEL org.opencontainers.image.source="https://github.com/minio/minio" \
      org.opencontainers.image.revision="07c3a429bfed433e49018cb0f78a52145d4bedeb" \
      org.opencontainers.image.licenses="AGPL-3.0-only"
COPY --from=build /out/minio /minio
COPY --from=build /tmp /tmp
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=build /src/LICENSE /LICENSE
EXPOSE 9000
ENTRYPOINT ["/minio"]
CMD ["server", "/data"]
