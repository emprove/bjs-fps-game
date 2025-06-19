import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Matrix } from "@babylonjs/core/Maths/math.vector";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Ray } from "@babylonjs/core/Culling/ray.core";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector2WithInfo } from "@babylonjs/gui/2D/math2D";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
// app
import { emitter } from "../lib/emitter";
import { options } from "../core/options";
import { device } from "../lib/deviceDetection";
// assets
import jumpIcon from "../assets/icons/arrow-up.png";
import walkIcon from "../assets/icons/walk_icon_white.png";
import pointerIconImg from "../assets/pointer.png";
import handIconImg from "../assets/hand.png";
import { SceneUI } from "./sceneUI";

class Puck extends Ellipse {
  public floatLeft: number = 0;
  public floatTop: number = 0;
  public isDown: boolean = false;

  constructor(name: string, thickness: number, color: string, background: string) {
    super(name);
    this.thickness = thickness;
    this.color = color;
    this.background = background;
  }

  static makeThumbArea(name: string, thickness: number, color: string, background?: string) {
    let ellipse = new Ellipse(name);
    ellipse.thickness = thickness;
    ellipse.color = color;
    ellipse.background = background || "";
    ellipse.paddingLeft = "0px";
    ellipse.paddingRight = "0px";
    ellipse.paddingTop = "0px";
    ellipse.paddingBottom = "0px";

    return ellipse;
  }
}

export class Player {
  #scene: Scene;
  #sceneUI: SceneUI;
  #material: StandardMaterial;
  #playerGroundRay: PhysicsRaycastResult;
  #playerTargetRay: Ray;
  #dt: number = 0;
  #inAir: boolean;
  #pointerImage: Image;
  #handImage: Image;
  #grabbedObject: Mesh | undefined = undefined;
  #pickDistance: number = 3.0;
  #playerHeight: number = 1.75;
  public mesh: Mesh;
  public physicsAggregate: PhysicsAggregate;
  public command = {
    moveForwardKeyDown: false,
    moveBackwardKeyDown: false,
    moveLeftKeyDown: false,
    moveRightKeyDown: false,
    jumpKeyDown: false,
    sprint: options.sprint,
    cameraAlpha: 0,
    cameraBeta: 0,
    xAddRot: 0,
    yAddRot: 0,
    xAddPos: 0,
    yAddPos: 0,
  };
  public headNode: TransformNode;
  public groundRayPickState = {
    collidedWith: undefined as PhysicsBody | undefined,
    collidedAt: 0,
  };

  constructor(scene: Scene, sceneUI: SceneUI) {
    this.#scene = scene;
    this.#sceneUI = sceneUI;

    const material = new StandardMaterial("playerMaterial", this.#scene);
    material.wireframe = true;
    material.diffuseColor = new Color3(0, 0, 1);
    material.alpha = 0;
    this.#material = material;

    const body = MeshBuilder.CreateCapsule(
      "playerBody",
      { radius: 0.35, height: this.#playerHeight },
      this.#scene,
    );
    body.isPickable = false;
    body.material = this.#material;
    this.mesh = body;

    const headNode = new TransformNode("headNode", this.#scene);
    headNode.position = new Vector3(0, this.#playerHeight / 2 - 0.05, 0);
    this.headNode = headNode;
    this.mesh.addChild(headNode, true);

    this.#playerTargetRay = new Ray(headNode.getAbsolutePosition(), new Vector3(), 3.0);
    this.#playerGroundRay = new PhysicsRaycastResult();

    // pointer image
    this.#pointerImage = new Image("pointer", pointerIconImg);
    this.#pointerImage.width = "3px";
    this.#pointerImage.height = "3px";
    this.#pointerImage.isVisible = true;

    // hand image
    this.#handImage = new Image("hand", handIconImg);
    this.#handImage.width = "48px";
    this.#handImage.height = "48px";
    this.#handImage.horizontalAlignment = Image.HORIZONTAL_ALIGNMENT_CENTER;
    this.#handImage.verticalAlignment = Image.VERTICAL_ALIGNMENT_CENTER;
    this.#handImage.isVisible = false;

    this.#sceneUI.adt.addControl(this.#pointerImage);
    this.#sceneUI.adt.addControl(this.#handImage);
  }

  public init(): void {
    const canvas = this.#scene.getEngine().getRenderingCanvas();
    if (device.isMobile) {
      canvas.addEventListener("touchstart", (e) => this.onTouchOrClickEvent(e));
      this.initMobileControls();
    } else {
      canvas.addEventListener("pointerdown", (e) => this.onTouchOrClickEvent(e));
      canvas.addEventListener("pointermove", (e) => {
        const cam = this.#scene.activeCamera as ArcRotateCamera;
        cam.alpha += ((-e.movementX * options.lookAroundSens) / 1000) * this.#dt;
        cam.beta += ((-e.movementY * options.lookAroundSens) / 1000) * this.#dt;
        this.syncCameraAlphaBetaWithCommand(cam);
      });
      this.initDesktopControls();
    }
  }

  public loopUpdate(): void {
    this.#scene.onBeforeRenderObservable.add(() => {
      if (!this.physicsAggregate) {
        return;
      }

      this.#dt = this.#scene.getEngine().getDeltaTime() * 0.001; // to seconds
      this.update();
    });
  }

  private initMobileControls(): void {
    this.initMovingArea();
    this.initLookingArea();
    this.initSprintAndJumpButtons();
  }

  private initMovingArea(): void {
    const stickDeadZone = 15;

    const leftThumbContainer = Puck.makeThumbArea("leftThumb", 2, "black");
    leftThumbContainer.height = "100px";
    leftThumbContainer.width = "100px";
    leftThumbContainer.isPointerBlocker = false;
    leftThumbContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftThumbContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    leftThumbContainer.alpha = 0.75;
    leftThumbContainer.left = 0;
    leftThumbContainer.top = 0;
    leftThumbContainer.isVisible = false;
    leftThumbContainer.zIndex = -1;
    this.#sceneUI.adt.addControl(leftThumbContainer);

    const leftInnerThumbContainer = Puck.makeThumbArea("leftInnerThumb", 4, "black");
    leftInnerThumbContainer.height = "60px";
    leftInnerThumbContainer.width = "60px";
    leftInnerThumbContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    leftInnerThumbContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    leftThumbContainer.addControl(leftInnerThumbContainer);

    const leftPuck = new Puck("leftPuck", 0, "black", "black");
    leftPuck.height = "40px";
    leftPuck.width = "40px";
    leftPuck.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftPuck.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    leftPuck.isVisible = false;
    leftThumbContainer.addControl(leftPuck);

    let puckCenterX = 0;
    let puckCenterY = 0;

    const leftScreenZone = new Rectangle("leftScreenZone");
    leftScreenZone.width = "40%";
    leftScreenZone.height = "100%";
    leftScreenZone.thickness = 0;
    leftScreenZone.isPointerBlocker = true;
    leftScreenZone.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftScreenZone.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    leftScreenZone.alpha = 0;
    leftScreenZone.zIndex = 0;
    this.#sceneUI.adt.addControl(leftScreenZone);

    leftScreenZone.onPointerDownObservable.add((coordinates) => {
      leftThumbContainer.isVisible = true;
      leftPuck.isVisible = true;
      leftPuck.isDown = true;

      leftThumbContainer.left = coordinates.x - leftThumbContainer.widthInPixels / 2;
      leftThumbContainer.top = coordinates.y - leftThumbContainer.heightInPixels / 2;
      leftPuck.left = 0;
      leftPuck.top = 0;

      puckCenterX = coordinates.x;
      puckCenterY = coordinates.y;
    });

    const stopAndReset = () => {
      this.command.xAddPos = 0;
      this.command.yAddPos = 0;
      leftPuck.isDown = false;
      leftPuck.isVisible = false;
      leftThumbContainer.isVisible = false;

      this.command.moveForwardKeyDown = false;
      this.command.moveBackwardKeyDown = false;
      this.command.moveLeftKeyDown = false;
      this.command.moveRightKeyDown = false;
    };

    leftScreenZone.onPointerOutObservable.add(() => {
      stopAndReset();
    });

    leftScreenZone.onPointerUpObservable.add(() => {
      stopAndReset();
    });

    leftScreenZone.onPointerMoveObservable.add((coordinates) => {
      if (!leftPuck.isDown) {
        return;
      }

      // calculate movement relative to puck center
      let dx = coordinates.x - puckCenterX;
      let dy = coordinates.y - puckCenterY;

      // clamp and move puck visually inside the container
      const maxRadius = 50;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      const centerX = leftThumbContainer.widthInPixels / 2 - leftPuck.widthInPixels / 2;
      const centerY = leftThumbContainer.heightInPixels / 2 - leftPuck.heightInPixels / 2;

      // move the puck visually within the container
      leftPuck.left = centerX + dx;
      leftPuck.top = centerY + dy;

      this.command.xAddPos = dx;
      this.command.yAddPos = dy;

      this.command.moveLeftKeyDown = dx < -stickDeadZone;
      this.command.moveRightKeyDown = dx > stickDeadZone;
      this.command.moveForwardKeyDown = dy < -stickDeadZone;
      this.command.moveBackwardKeyDown = dy > stickDeadZone;
    });
  }

  private initLookingArea(): void {
    const ROT_FACTOR = 0.2; // radians per pixel

    const rightScreenZone = new Rectangle("rightScreenZone");
    rightScreenZone.width = "40%";
    rightScreenZone.height = "100%";
    rightScreenZone.thickness = 0;
    rightScreenZone.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    rightScreenZone.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    rightScreenZone.isPointerBlocker = true;
    this.#sceneUI.adt.addControl(rightScreenZone);

    let lookActive = false;
    let prevX = 0;
    let prevY = 0;

    rightScreenZone.onPointerDownObservable.add((coord: Vector2WithInfo) => {
      lookActive = true;
      prevX = coord.x;
      prevY = coord.y;
    });

    rightScreenZone.onPointerMoveObservable.add((coord: Vector2) => {
      if (!lookActive) {
        return;
      }

      const dx = coord.x - prevX;
      const dy = coord.y - prevY;
      prevX = coord.x;
      prevY = coord.y;

      // queue for render loop
      this.command.xAddRot += dx * ROT_FACTOR;
      this.command.yAddRot += dy * ROT_FACTOR;

      const cam = this.#scene.activeCamera as ArcRotateCamera;
      cam.alpha += -this.command.xAddRot * options.lookAroundSens * this.#dt;
      cam.beta += -this.command.yAddRot * options.lookAroundSens * this.#dt;

      this.syncCameraAlphaBetaWithCommand(cam);

      // flush so the camera only moves when the finger actually moves - prevent infinity rotation
      this.command.xAddRot = 0;
      this.command.yAddRot = 0;
    });

    rightScreenZone.onPointerUpObservable.add(() => {
      lookActive = false;
    });
  }

  private initSprintAndJumpButtons(): void {
    const walkButtonContainer = new Ellipse("walkButtonContainer");
    this.#sceneUI.adt.addControl(walkButtonContainer);

    walkButtonContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    walkButtonContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    walkButtonContainer.top = 120;
    walkButtonContainer.left = 10;
    walkButtonContainer.width = "40px";
    walkButtonContainer.height = "40px";
    walkButtonContainer.alpha = 0.4;
    walkButtonContainer.thickness = 0;
    walkButtonContainer.background = "black";
    walkButtonContainer.zIndex = 1;

    const walkButton = Button.CreateImageOnlyButton("walkButton", walkIcon);
    walkButtonContainer.addControl(walkButton);

    const updateWalkButtonStyle = () => {
      if (this.command.sprint) {
        walkButton.alpha = 0.8;
        walkButtonContainer.thickness = 0;
      } else {
        walkButton.alpha = 1;
        walkButtonContainer.thickness = 2;
        walkButtonContainer.color = "white";
      }
    };

    walkButton.width = "30px";
    walkButton.height = "30px";
    walkButton.alpha = 0.8;
    walkButton.thickness = 0;
    walkButton.onPointerDownObservable.add(() => {
      this.command.sprint = !this.command.sprint;
      updateWalkButtonStyle();
    });
    updateWalkButtonStyle(); // initial style

    const jumpButtonContainer = new Ellipse("jumpButtonContainer");
    this.#sceneUI.adt.addControl(jumpButtonContainer);

    jumpButtonContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    jumpButtonContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    jumpButtonContainer.top = -20;
    jumpButtonContainer.left = -120;
    jumpButtonContainer.width = "60px";
    jumpButtonContainer.height = "60px";
    jumpButtonContainer.alpha = 0.4;
    jumpButtonContainer.thickness = 0;
    jumpButtonContainer.background = "black";
    jumpButtonContainer.zIndex = 1;
    jumpButtonContainer.onPointerDownObservable.add(() => {
      this.command.jumpKeyDown = true;
    });
    jumpButtonContainer.onPointerUpObservable.add(() => {
      this.command.jumpKeyDown = false;
    });

    const jumpButton = Button.CreateImageOnlyButton("jumpButton", jumpIcon);
    jumpButton.isPointerBlocker = false;
    jumpButtonContainer.addControl(jumpButton);

    jumpButton.width = "40px";
    jumpButton.height = "40px";
    jumpButton.alpha = 0.8;
    jumpButton.thickness = 0;
  }

  private initDesktopControls(): void {
    this.#scene.onKeyboardObservable.add((kbInfo) => {
      switch (kbInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
          switch (kbInfo.event.code) {
            case "Digit1":
              if (import.meta.env.DEV) {
                (this.#scene.activeCamera as ArcRotateCamera).lowerRadiusLimit = 0;
                (this.#scene.activeCamera as ArcRotateCamera).upperRadiusLimit = 0;
                this.#material.alpha = 0;
              }

              break;
            case "Digit2":
              if (import.meta.env.DEV) {
                (this.#scene.activeCamera as ArcRotateCamera).lowerRadiusLimit = 5;
                (this.#scene.activeCamera as ArcRotateCamera).upperRadiusLimit = 5;
                this.#material.alpha = 1;
              }

              break;
            case "KeyW":
            case "ArrowUp":
              this.command.moveForwardKeyDown = true;
              break;
            case "KeyA":
            case "ArrowLeft":
              this.command.moveLeftKeyDown = true;
              break;
            case "KeyS":
            case "ArrowDown":
              this.command.moveBackwardKeyDown = true;
              break;
            case "KeyD":
            case "ArrowRight":
              this.command.moveRightKeyDown = true;
              break;
            case "ShiftLeft":
            case "ShiftRight":
              this.command.sprint = !this.command.sprint;
              break;
            case "Space":
              this.command.jumpKeyDown = true;
              break;
            case "Tab":
              // while 2 keys pressed it freezes movement keys and player continue to move
              this.command.moveForwardKeyDown = false;
              this.command.moveBackwardKeyDown = false;
              this.command.moveLeftKeyDown = false;
              this.command.moveRightKeyDown = false;
              this.command.jumpKeyDown = false;
              emitter.emit("show-menu");
              break;
          }
          break;
        case KeyboardEventTypes.KEYUP:
          switch (kbInfo.event.code) {
            case "KeyW":
            case "ArrowUp":
              this.command.moveForwardKeyDown = false;
              break;
            case "KeyA":
            case "ArrowLeft":
              this.command.moveLeftKeyDown = false;
              break;
            case "KeyS":
            case "ArrowDown":
              this.command.moveBackwardKeyDown = false;
              break;
            case "KeyD":
            case "ArrowRight":
              this.command.moveRightKeyDown = false;
              break;
            case "ShiftLeft":
            case "ShiftRight":
              this.command.sprint = !this.command.sprint;
              break;
            case "Space":
              this.command.jumpKeyDown = false;
              break;
          }
          break;
      }
    });
  }

  public setPosition(position: Vector3): void {
    if (this.physicsAggregate) {
      this.physicsAggregate.dispose();
    }
    this.mesh.position = position.clone();
    this.createPhysicsBody();
  }

  public createPhysicsBody(): void {
    this.physicsAggregate = new PhysicsAggregate(
      this.mesh,
      PhysicsShapeType.CAPSULE,
      {
        mass: 70,
        friction: 1,
        restitution: 0,
      },
      this.#scene,
    );
    this.physicsAggregate.body.setAngularDamping(0);
    this.physicsAggregate.body.setMassProperties({
      inertia: new Vector3(0, 0, 0),
    });
  }

  public syncCameraAlphaBetaWithCommand(camera: ArcRotateCamera): void {
    this.command.cameraAlpha = camera.alpha;
    this.command.cameraBeta = camera.beta;
  }

  private onTouchOrClickEvent(e: TouchEvent | PointerEvent): void {
    const canvas = this.#scene.getEngine().getRenderingCanvas();
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if (typeof TouchEvent !== "undefined" && e instanceof TouchEvent) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e instanceof PointerEvent) {
      if (document.pointerLockElement !== null) {
        // always center of the canvas is in the fullscreen mode
        clientX = rect.width / 2;
        clientY = rect.height / 2;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
    } else {
      throw new Error("unsupported event type: " + typeof e);
    }

    const normalizedX = (clientX - rect.left) * (canvas.width / rect.width);
    const normalizedY = (clientY - rect.top) * (canvas.height / rect.height);

    // required to detect if tap performed on the _playerTargetRay's object
    const tapRay = this.#scene.createPickingRay(
      normalizedX,
      normalizedY,
      Matrix.Identity(),
      this.#scene.activeCamera,
    );
    const tapPick = this.#scene.pickWithRay(
      tapRay,
      (m) => m.metadata?.isGrabbable || m.metadata?.isTouchable,
    );

    const pick = this.#scene.pickWithRay(
      this.#playerTargetRay,
      (m) => m.metadata?.isGrabbable || m.metadata?.isTouchable,
    );
    if (!pick.hit || pick.pickedMesh === null) {
      return;
    }

    if (tapPick?.hit === false) {
      return;
    }
    if (tapPick.pickedMesh !== pick.pickedMesh) {
      return;
    }
    if (pick.distance > this.#pickDistance) {
      return;
    }

    if (
      pick.pickedMesh.metadata?.isTouchable &&
      typeof pick.pickedMesh.metadata?.onTouch === "function"
    ) {
      pick.pickedMesh.metadata.onTouch();
      emitter.emit("player_touched_touchable_object", pick.pickedMesh);
    }

    if (pick.pickedMesh.metadata?.isGrabbable) {
      if (!this.#grabbedObject) {
        // Grab on first tap
        this.grabObject(pick.pickedMesh as Mesh);
      } else {
        // Release on second tap
        this.dropObject();
      }
    }
  }

  private grabObject(grabbedMesh: Mesh): void {
    this.#grabbedObject = grabbedMesh;
    grabbedMesh.metadata = {
      ...grabbedMesh.metadata,
      grabbedAt: Date.now(),
    };
    const forward = this.#scene.activeCamera.getDirection(Axis.Z);
    forward.normalize();

    const playerPosition = this.mesh.position.clone();
    const targetPosition = playerPosition.add(forward.scale(2.5));
    targetPosition.y = playerPosition.y + this.#playerHeight / 2;

    grabbedMesh.setAbsolutePosition(targetPosition);

    this.mesh.addChild(grabbedMesh, true);

    emitter.emit("player_object_grabbed", grabbedMesh.uniqueId);
  }

  public dropObject(): void {
    if (!this.#grabbedObject) {
      return;
    }

    emitter.emit("player_object_dropping", this.#grabbedObject.uniqueId);

    this.#grabbedObject.visibility = 1;
    this.#grabbedObject.setParent(undefined, true);
    this.#grabbedObject = undefined;
  }

  public getGrabbedObject(): Mesh | undefined {
    return this.#grabbedObject;
  }

  public setGrabbedObject(obj: Mesh | undefined) {
    this.#grabbedObject = obj;
  }

  public update(): void {
    this.updatePlayerGroundRay();
    this.updatePlayerTargetRay();
    this.updateRayBasedFeatures();
    this.applyMovement();
  }

  private updatePlayerGroundRay(): void {
    const start = this.mesh.position.clone();
    const end = start.add(new Vector3(0, -1, 0));
    (this.#scene.getPhysicsEngine() as any).raycastToRef(start, end, this.#playerGroundRay);
  }

  private updatePlayerTargetRay(): void {
    const headPosition = this.headNode.getAbsolutePosition();
    this.#playerTargetRay.origin.copyFrom(headPosition);

    const forward = this.#scene.activeCamera.getDirection(Axis.Z);
    this.#playerTargetRay.direction.copyFrom(forward);
  }

  private updateRayBasedFeatures(): void {
    const pick = this.#scene.pickWithRay(this.#playerTargetRay);
    if (
      pick.hit &&
      (pick.pickedMesh?.metadata?.isGrabbable || pick.pickedMesh?.metadata?.isTouchable)
    ) {
      // show hand cursor
      this.#pointerImage.isVisible = false;
      this.#handImage.isVisible = true;
    } else {
      // show pointer cursor
      this.#pointerImage.isVisible = true;
      this.#handImage.isVisible = false;
    }
  }

  private applyMovement(): void {
    // ground-check ray
    if (this.#playerGroundRay.hasHit) {
      this.#inAir = false;
      if (!this.groundRayPickState.collidedWith) {
        this.groundRayPickState.collidedAt = Date.now();
        this.groundRayPickState.collidedWith = this.#playerGroundRay.body;
        emitter.emit("player_picked_object", this.#playerGroundRay.body.transformNode);
      }
    } else {
      this.#inAir = true;
      this.groundRayPickState.collidedAt = 0;
      this.groundRayPickState.collidedWith = null;
    }

    // face the camera’s heading
    const viewAngleY = 2 * Math.PI - this.command.cameraAlpha;
    this.mesh.rotationQuaternion = Quaternion.FromEulerAngles(0, viewAngleY, 0);

    // input vector
    const localDir = new Vector3(
      -((this.command.moveForwardKeyDown ? 1 : 0) - (this.command.moveBackwardKeyDown ? 1 : 0)),
      0,
      (this.command.moveRightKeyDown ? 1 : 0) - (this.command.moveLeftKeyDown ? 1 : 0),
    );
    if (localDir.lengthSquared() > 0) {
      localDir.normalize();
    }

    // fetch the old velocity so we can preserve Y
    const oldVel = this.physicsAggregate.body.getLinearVelocity() || Vector3.Zero();
    const speedMag = oldVel.length();
    const canJump = this.#playerGroundRay.hasHit || speedMag < 0.001;

    let newVelY = oldVel.y;
    if (this.command.jumpKeyDown && canJump && !this.#inAir) {
      newVelY = 5; // jump impulse
      this.#inAir = true;
      this.groundRayPickState.collidedAt = 0;
      this.groundRayPickState.collidedWith = null;
    }

    // rotate into world-space
    const worldDir = Vector3.TransformCoordinates(
      localDir,
      Matrix.RotationAxis(Axis.Y, viewAngleY),
    );

    const speedBase = this.command.sprint ? 9.0 : 6.0;
    const platformFactor = device.isDesktop ? 1.0 : 0.8;
    const speed = speedBase * platformFactor;

    // full horizontal control, even in the air
    const newVelX = worldDir.x * speed;
    const newVelZ = worldDir.z * speed;

    this.physicsAggregate.body.setLinearVelocity(new Vector3(newVelX, newVelY, newVelZ));

    // stick to moving platforms if needed
    if (
      this.#playerGroundRay.hasHit &&
      this.#playerGroundRay?.body?.transformNode?.animations?.length
    ) {
      this.mesh.parent = this.#playerGroundRay.body.transformNode;
    } else {
      this.mesh.parent = null;
    }

    // ground-stick correction
    if (!this.command.jumpKeyDown && !this.#inAir && this.#playerGroundRay.hasHit) {
      const vy = this.physicsAggregate.body.getLinearVelocity().y;
      if (Math.abs(vy) > 0.001) {
        this.physicsAggregate.body.setLinearVelocity(new Vector3(newVelX, -0.5, newVelZ));
      }
    }
  }
}
