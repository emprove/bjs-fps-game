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

DracoDecoder.DefaultConfiguration.wasmUrl = "/draco/draco_wasm_wrapper_gltf.js";
DracoDecoder.DefaultConfiguration.wasmBinaryUrl = "/draco/draco_decoder_gltf.wasm";
DracoDecoder.DefaultConfiguration.fallbackUrl = "/draco/draco_decoder_gltf.js";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "https://c0f093481269df2f698aecc92c1c3fae@o480185.ingest.us.sentry.io/4509382132039680",
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
  });
}

if (import.meta.env.DEV) {
  import("@babylonjs/inspector");
  import("@babylonjs/core/Debug/debugLayer");
  import("@babylonjs/core/Instrumentation/sceneInstrumentation");
}
