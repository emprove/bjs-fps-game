import { DracoDecoder } from "@babylonjs/core/Meshes/Compression/dracoDecoder.js";
import * as Sentry from "@sentry/browser";
// fix tree-shaking
import "@babylonjs/core/Culling/ray";
import "@babylonjs/core/Physics/v2/physicsEngineComponent";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Loading/Plugins/babylonFileLoader";
import "@babylonjs/core/Animations/animatable.core";
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Misc/screenshotTools";

DracoDecoder.DefaultConfiguration.wasmUrl =
  import.meta.env.VITE_APP_BASE_DIR + "draco/draco_wasm_wrapper_gltf.js";
DracoDecoder.DefaultConfiguration.wasmBinaryUrl =
  import.meta.env.VITE_APP_BASE_DIR + "draco/draco_decoder_gltf.wasm";
DracoDecoder.DefaultConfiguration.fallbackUrl =
  import.meta.env.VITE_APP_BASE_DIR + "draco/draco_decoder_gltf.js";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_APP_SENTRY_DSN,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
  });
}

if (import.meta.env.DEV) {
  import("@babylonjs/inspector");
  import("@babylonjs/core/Debug/debugLayer");
  import("@babylonjs/core/Instrumentation/sceneInstrumentation");
}
