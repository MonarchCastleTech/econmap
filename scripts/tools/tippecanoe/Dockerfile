# Reproducible tippecanoe toolchain for the EconMap globe → PMTiles pipeline.
# Felt's tippecanoe fork writes .pmtiles natively (no mbtiles → pmtiles conversion step).
# Build:  docker build -t econmap/tippecanoe scripts/tools/tippecanoe
# Used by: scripts/data/globe/generate-pmtiles.ts
FROM ubuntu:24.04 AS build
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      git ca-certificates build-essential libsqlite3-dev zlib1g-dev \
 && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 https://github.com/felt/tippecanoe.git /src
WORKDIR /src
RUN make -j"$(nproc)" && make install

FROM ubuntu:24.04
RUN apt-get update \
 && apt-get install -y --no-install-recommends libsqlite3-0 zlib1g \
 && rm -rf /var/lib/apt/lists/*
COPY --from=build /usr/local/bin/tippecanoe /usr/local/bin/tippecanoe
COPY --from=build /usr/local/bin/tile-join /usr/local/bin/tile-join
COPY --from=build /usr/local/bin/tippecanoe-decode /usr/local/bin/tippecanoe-decode
ENTRYPOINT []
