import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Player } from "./player";
import { device } from "../lib/deviceDetection";
import type { Scene } from "@babylonjs/core/scene";

export class Camera {
  #scene: Scene;
  public camera: ArcRotateCamera;

  constructor(scene: Scene) {
    this.#scene = scene;
    this.camera = new ArcRotateCamera("camera", 0, Math.PI / 2, 5, new Vector3(), this.#scene);
  }

  public init(player: Player) {
    this.camera.lowerRadiusLimit = 0;
    this.camera.upperRadiusLimit = 0;
    this.camera.angularSensibilityX = 500;
    this.camera.angularSensibilityY = 500;
    this.camera.inertia = 0;
    this.camera.minZ = 0.1;
    this.camera.fov = 0.9;

    if (device.isHoverable) {
      this.camera.attachControl(this.#scene.getEngine().getRenderingCanvas());
      this.camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
    }

    this.#scene.activeCamera = this.camera;

    this.camera.lockedTarget = player.headNode;
    this.camera.radius = 0;
    this.camera.alpha = 0;
    this.camera.beta = Math.PI / 2;
    this.camera.target = player.headNode.getAbsolutePosition();
  }
}
