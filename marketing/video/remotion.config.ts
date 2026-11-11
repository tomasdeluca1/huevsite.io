import { existsSync } from "node:fs";
import { Config } from "@remotion/cli/config";

Config.setOverwriteOutput(true);
Config.setVideoImageFormat("jpeg");

// El render en la nube (Linux) usa el Chrome del sistema y swiftshader.
// En una Mac ese binario no existe: Remotion baja su propio headless shell.
const LINUX_CHROME = "/usr/local/bin/google-chrome";
if (existsSync(LINUX_CHROME)) {
  Config.setBrowserExecutable(LINUX_CHROME);
  Config.setChromiumOpenGlRenderer("swiftshader");
}
