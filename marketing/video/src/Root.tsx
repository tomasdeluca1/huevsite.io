import { Composition } from "remotion";
import { Film } from "./Film";
import { McpFilm } from "./mcp/McpFilm";
import { DURATION as MCP_DURATION } from "./mcp/timeline";
import { DURATION, FPS } from "./timing";

const shared = { component: Film, durationInFrames: DURATION, fps: FPS };
const mcp = { component: McpFilm, durationInFrames: MCP_DURATION, fps: FPS };

export function RemotionRoot() {
  return (
    <>
      <Composition {...shared} id="OrganicVertical" width={1080} height={1920} defaultProps={{ layout: "vertical" as const, variant: "organic" as const }} />
      <Composition {...shared} id="OrganicLandscape" width={1920} height={1080} defaultProps={{ layout: "landscape" as const, variant: "organic" as const }} />
      <Composition {...shared} id="AdsVertical" width={1080} height={1920} defaultProps={{ layout: "vertical" as const, variant: "ads" as const }} />
      <Composition {...shared} id="AdsLandscape" width={1920} height={1080} defaultProps={{ layout: "landscape" as const, variant: "ads" as const }} />
      <Composition {...mcp} id="McpVertical" width={1080} height={1920} defaultProps={{ layout: "vertical" as const }} />
      <Composition {...mcp} id="McpLandscape" width={1920} height={1080} defaultProps={{ layout: "landscape" as const }} />
    </>
  );
}
