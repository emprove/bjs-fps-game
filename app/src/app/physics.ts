import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";

export const initializePhysics = async (scene: Scene) => {
  try {
    const havokInstance = await HavokPhysics({
      locateFile: () => import.meta.env.VITE_APP_BASE_DIR + "HavokPhysics.wasm",
    });

    const gravityVector = new Vector3(0, -9.81, 0);
    const physicsPlugin = new HavokPlugin(true, havokInstance);
    physicsPlugin.setTimeStep(1 / 60);

    scene.enablePhysics(gravityVector, physicsPlugin);

    return physicsPlugin;
  } catch (error) {
    console.error("Failed to initialize Havok physics:", error);
    throw error;
  }
};
