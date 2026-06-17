// @vitest-environment node

import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildGibsTileJobs,
  buildGibsWmsGetMapUrl,
  getSnapshotDimensionsForMaxZoom,
  parseGibsCapabilities,
} from "./download-gibs-imagery";

const CAPABILITIES_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1">
  <Contents>
    <Layer>
      <ows:Identifier>MODIS_Terra_CorrectedReflectance_TrueColor</ows:Identifier>
      <Dimension>
        <ows:Identifier>Time</ows:Identifier>
        <Default>2026-03-15</Default>
      </Dimension>
      <TileMatrixSetLink>
        <TileMatrixSet>GoogleMapsCompatible_Level9</TileMatrixSet>
      </TileMatrixSetLink>
      <ResourceURL
        format="image/jpeg"
        resourceType="tile"
        template="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg"
      />
    </Layer>
    <Layer>
      <ows:Identifier>VIIRS_Black_Marble</ows:Identifier>
      <Dimension>
        <ows:Identifier>Time</ows:Identifier>
        <Default>2016-01-01</Default>
      </Dimension>
      <TileMatrixSetLink>
        <TileMatrixSet>GoogleMapsCompatible_Level9</TileMatrixSet>
      </TileMatrixSetLink>
      <ResourceURL
        format="image/png"
        resourceType="tile"
        template="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png"
      />
    </Layer>
    <Layer>
      <ows:Identifier>MODIS_Terra_Cloud_Fraction_Day</ows:Identifier>
      <Dimension>
        <ows:Identifier>Time</ows:Identifier>
        <Default>2026-03-15</Default>
      </Dimension>
      <TileMatrixSetLink>
        <TileMatrixSet>GoogleMapsCompatible_Level9</TileMatrixSet>
      </TileMatrixSetLink>
      <ResourceURL
        format="image/png"
        resourceType="tile"
        template="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Cloud_Fraction_Day/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png"
      />
    </Layer>
  </Contents>
</Capabilities>`;

describe("download-gibs-imagery", () => {
  it("parses the configured GIBS capabilities into local layer metadata", () => {
    const parsed = parseGibsCapabilities(CAPABILITIES_FIXTURE);

    expect(parsed["true-color"]).toMatchObject({
      id: "true-color",
      remoteLayerId: "MODIS_Terra_CorrectedReflectance_TrueColor",
      defaultDate: "2026-03-15",
      tileMatrixSet: "GoogleMapsCompatible_Level9",
      fileExtension: "jpg",
    });
    expect(parsed["night-lights"]).toMatchObject({
      id: "night-lights",
      remoteLayerId: "VIIRS_Black_Marble",
      defaultDate: "2016-01-01",
      fileExtension: "png",
    });
  });

  it("builds full-world tile download jobs using local z/x/y output paths", () => {
    const jobs = buildGibsTileJobs({
      date: "2026-03-15",
      destinationRootDir: path.join("C:", "offline-imagery"),
      fileExtension: "jpg",
      localLayerId: "true-color",
      maxZoom: 1,
      minZoom: 0,
      template:
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg",
      tileMatrixSet: "GoogleMapsCompatible_Level9",
    });

    expect(jobs).toHaveLength(5);
    expect(jobs[0]).toMatchObject({
      outputFile: path.join("C:", "offline-imagery", "true-color", "2026-03-15", "0", "0", "0.jpg"),
      url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-03-15/GoogleMapsCompatible_Level9/0/0/0.jpeg",
      x: 0,
      y: 0,
      z: 0,
    });
    expect(jobs.at(-1)).toMatchObject({
      outputFile: path.join("C:", "offline-imagery", "true-color", "2026-03-15", "1", "1", "1.jpg"),
      url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-03-15/GoogleMapsCompatible_Level9/1/1/1.jpeg",
      x: 1,
      y: 1,
      z: 1,
    });
  });

  it("builds a web-mercator WMS snapshot request for local offline tiling", () => {
    expect(getSnapshotDimensionsForMaxZoom(3)).toEqual({
      height: 2048,
      width: 2048,
    });

    expect(
      buildGibsWmsGetMapUrl({
        date: "2026-03-15",
        format: "image/jpeg",
        remoteLayerId: "MODIS_Terra_CorrectedReflectance_TrueColor",
        width: 2048,
        height: 2048,
      }),
    ).toBe(
      "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&STYLES=&FORMAT=image%2Fjpeg&SRS=EPSG%3A3857&BBOX=-20037508.34278925%2C-20037508.34278925%2C20037508.34278925%2C20037508.34278925&WIDTH=2048&HEIGHT=2048&TIME=2026-03-15",
    );
  });
});
