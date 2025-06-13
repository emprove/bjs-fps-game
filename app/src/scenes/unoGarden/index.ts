import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { AppendSceneAsync } from "@babylonjs/core/Loading/sceneLoader";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";
import { VertexBuffer } from "@babylonjs/core/Buffers";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { ColorGradingTexture } from "@babylonjs/core/Materials/Textures/colorGradingTexture";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Animation } from "@babylonjs/core/Animations/animation";
import { EasingFunction, SineEase } from "@babylonjs/core/Animations/easing";
import { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { AbstractSound } from "@babylonjs/core/AudioV2/abstractAudio/abstractSound";
import "@babylonjs/core/Particles/webgl2ParticleSystem";
import { GPUParticleSystem } from "@babylonjs/core/Particles/gpuParticleSystem";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { ReflectionProbe } from "@babylonjs/core/Probes/reflectionProbe";
import type { AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
// app
import { CreateSceneClass } from "../../core/createScene";
import { Player } from "../../app/player";
import { Camera } from "../../app/camera";
import { SceneUI } from "../../app/sceneUI";
import { initializePhysics } from "../../app/physics";
import { emitter } from "../../lib/emitter";
import { device } from "../../lib/deviceDetection";
import { DeltaTimeAverager } from "../../app/deltaTimeAverager";
// assets
import lutAsset from "../../assets/luts/standard_warm.3dl?url";
import cubeNX from "../../assets/cubemaps/sunrise_pure_sky_green_ground_20el/nx.webp";
import cubeNY from "../../assets/cubemaps/sunrise_pure_sky_green_ground_20el/ny.webp";
import cubeNZ from "../../assets/cubemaps/sunrise_pure_sky_green_ground_20el/nz.webp";
import cubePX from "../../assets/cubemaps/sunrise_pure_sky_green_ground_20el/px.webp";
import cubePY from "../../assets/cubemaps/sunrise_pure_sky_green_ground_20el/py.webp";
import cubePZ from "../../assets/cubemaps/sunrise_pure_sky_green_ground_20el/pz.webp";
import unoGardenGlb from "../../assets/uno_garden.glb?url";
import unoCardsAtlas from "../../assets/textures/uno_cards_atlas.png";
import starImg from "../../assets/textures/star.png";
import star2Img from "../../assets/textures/star2.png";
import cardGrabAudio from "../../assets/sounds/card_grab.mp3";
import cardDropAudio from "../../assets/sounds/card_drop.mp3";
import cardAttachedToToroAudio from "../../assets/sounds/card_attached_to_toro.mp3";
import bgBirdsAudio from "../../assets/sounds/bg_birds.mp3";
import bgNightAudio from "../../assets/sounds/bg_night.mp3";
import waterLakeAudio from "../../assets/sounds/water_lake.mp3";
import microwaveDingAudio from "../../assets/sounds/microwave_ding.mp3";
import gardenIntroAudio from "../../assets/sounds/garden_intro.mp3";
import gardenOutroAudio from "../../assets/sounds/garden_outro.mp3";
import touchObjectAudio from "../../assets/sounds/touch_object.mp3";
import unoGameEndAudio from "../../assets/sounds/uno_game_end.mp3";
import secretFoundAudio from "../../assets/sounds/secret_found.mp3";
import doorsScreamAudio from "../../assets/sounds/doors_scream.mp3";
import fireworkBangAudio from "../../assets/sounds/firework_bang.mp3";
import fireworkRocketAudio from "../../assets/sounds/firework_rocket.mp3";
import hokkuData from "../../assets/misc/hokku.json";

type Engine = import("@babylonjs/core/Engines/engine").Engine;

class SecondScene implements CreateSceneClass {
  #audioEngine: AudioEngineV2;
  #player: Player;
  #sounds: Map<string, AbstractSound> = new Map();
  #unoGameState = {
    turn: 0,
    maxTurns: 6,
  };
  #unoDeck: { [name: string]: Mesh } = {};
  #deckOfRegularUnoCardNames: string[];
  #dragonTextBlock: TextBlock;
  #dragonTextReplicas = [
    "I'm an very, very old rake.",
    "What a sunny day! Say cheeese!",
    "When I was young... I was young.",
    "Please, don't cheat! You must win fair and square, and I will open the doors.",
    "Драконы существуют! Я статуя, из камня и краски, это доказываю.",
    "Статуя будды говорит по-китайски и может помочь с игрой.",
    "Есть тут один светильник... творит магию.",
    "I know, I know... there is a hole to other side. What? Nothing.",
    "Я совершал сотни ошибок. Поэтому я стал мудрым Драконом.",
    "I shuffle cards better than I shuffle fates.",
  ];
  #chineseLampColor = new Color3(1, 0.85, 0.6);
  #sunLightDayColor = new Color3(1, 0.85, 0.7);
  #sunLightNightColor = new Color3(0.7, 0.9, 0.9);
  #fogDayColor = new Color3(0.8, 0.85, 0.9);
  #fogNightColor = new Color3(0.3, 0.35, 0.35);
  public playerSpawnPoint: Vector3 = new Vector3(0, 2.0, -75.0);

  public async init(engine: Engine, audioEngine: AudioEngineV2): Promise<Scene> {
    this.#audioEngine = audioEngine;

    const scene = new Scene(engine, {
      useGeometryUniqueIdsMap: true,
      useMaterialMeshMap: true,
      useClonedMeshMap: true,
    });
    engine.maxFPS = 60;

    scene.fogMode = 2;
    scene.fogDensity = 0.001;
    scene.fogColor = this.#fogDayColor;

    await initializePhysics(scene);

    const sceneUI = new SceneUI(engine, scene);
    sceneUI.init();

    this.#player = new Player(scene, sceneUI);
    this.#player.init();
    this.#player.setPosition(this.playerSpawnPoint);
    this.#audioEngine.listener.position = this.#player.mesh.position;
    this.#audioEngine.listener.attach(this.#player.mesh);

    const camera = new Camera(scene);
    scene.activeCamera = camera.camera;

    camera.init(this.#player);
    camera.camera.alpha = 4.01;
    camera.camera.beta = 1.546;
    this.#player.syncCameraAlphaBetaWithCommand(camera.camera);

    const sunLight = new DirectionalLight("sunLight", new Vector3(-150, -100, 200), scene);
    sunLight.diffuse = this.#sunLightDayColor;
    sunLight.intensity = 1.8;
    sunLight.autoUpdateExtends = true;
    sunLight.shadowMinZ = 100;
    sunLight.shadowMaxZ = 350;

    const sunDisk = MeshBuilder.CreateSphere("sunDisk", { diameter: 20 }, scene);
    sunDisk.position = sunLight.direction.scale(-2);
    sunDisk.billboardMode = Mesh.BILLBOARDMODE_ALL;

    const sunMaterial = new StandardMaterial("sunMaterial", scene);
    sunMaterial.emissiveColor = new Color3(1, 1, 1);
    sunMaterial.disableLighting = true;
    sunDisk.material = sunMaterial;

    const backlight = new HemisphericLight("backlight", new Vector3(0, 1, 0), scene);
    backlight.diffuse = new Color3(1, 1, 1);
    backlight.groundColor = new Color3(0.5, 0.5, 0.5);
    backlight.intensity = 0.2;

    const envTexture = CubeTexture.CreateFromImages(
      [cubePX, cubePY, cubePZ, cubeNX, cubeNY, cubeNZ],
      scene,
    );
    scene.environmentTexture = envTexture;
    scene.environmentIntensity = 3;

    const skyBoxMesh = MeshBuilder.CreateBox("skyBoxMesh", { size: 2000 }, scene);
    skyBoxMesh.infiniteDistance = true;
    skyBoxMesh.applyFog = false;
    skyBoxMesh.rotation.y = 1;

    const skyboxMaterial = new StandardMaterial("skyboxMaterial", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = envTexture;
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
    skyboxMaterial.specularColor = new Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;
    skyBoxMesh.material = skyboxMaterial;

    await Promise.all([AppendSceneAsync(unoGardenGlb, scene)]);

    // fix gltf to bjs coordinate system
    const rootNode = scene.getNodeByName("__root__");
    rootNode.getChildren().forEach((m) => {
      (m as Mesh).setParent(null);
    });
    rootNode.dispose();

    this.setupFinalGazeboLights(scene); // this is must be before all other code

    const shadowGenerator = new ShadowGenerator(2048, sunLight);
    shadowGenerator.bias = 0.004;
    shadowGenerator.normalBias = 0.0015;
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.transparencyShadow = true;

    const activeZoneBBoxMesh = scene.getMeshByName("active_zone_bbox") as Mesh;
    activeZoneBBoxMesh.isPickable = false;
    activeZoneBBoxMesh.isVisible = false;
    const activeZoneBBoxMeshBoundingBox = activeZoneBBoxMesh.getBoundingInfo().boundingBox;

    const groundMesh = scene.getMeshByName("ground");
    groundMesh.receiveShadows = true;
    groundMesh.checkCollisions = true;
    groundMesh.isPickable = true;
    groundMesh.freezeWorldMatrix();
    new PhysicsAggregate(
      groundMesh,
      PhysicsShapeType.MESH,
      {
        mass: 0,
        friction: 1,
        restitution: 0,
      },
      scene,
    );
    shadowGenerator.addShadowCaster(groundMesh);

    const colorsTextureMaterial = scene.getMaterialByName("colors_texture") as PBRMaterial;
    colorsTextureMaterial.roughness = 0.95;
    colorsTextureMaterial.maxSimultaneousLights = 10;
    colorsTextureMaterial.freeze();

    const probe = new ReflectionProbe("mainProbe", 128, scene);
    probe.position = new Vector3(0, 10, 0);
    probe.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    probe.renderList.push(skyBoxMesh);

    colorsTextureMaterial.reflectionTexture = probe.cubeTexture;

    this.setupColorsTextureBlinkingMaterial(scene, colorsTextureMaterial);

    const groundBigMesh = scene.getMeshByName("ground_big");
    groundBigMesh.receiveShadows = true;
    groundBigMesh.checkCollisions = false;
    groundBigMesh.isPickable = false;
    groundBigMesh.freezeWorldMatrix();

    const meshesToMerge = scene.meshes.filter(
      (mesh) => /^chinese_wall\.\d+$/.test(mesh.name) && mesh.getClassName() !== "InstancedMesh",
    );
    const mergedMesh = Mesh.MergeMeshes(meshesToMerge as Mesh[]);
    mergedMesh.name = "merged_chinese_walls";

    const meshesToShadowAndPhys = [
      "gazebo",
      "gazebo_square",
      "gazebo_square_wooden_plate",
      "old_door",
      "old_door_reversed",
      "old_door.001",
      "old_door_reversed.001",
      "corner_1_sand",
      "corner_1_gravel",
      "sand_gazebo_square",
      "dragon",
      "gate_2",
      "old_door_tall",
      "old_door_tall_reversed",
      "rock_small_1",
      "statue_budda",
      "microwave_oven",
      "microwave_oven.001",
      "microwave_oven.002",
      "wooden_bridge",
      "wooden_table",
      "merged_chinese_walls",
    ];
    meshesToShadowAndPhys.forEach((name) => {
      const m = scene.getMeshByName(name) as Mesh;
      if (!m) {
        console.error("mesh not found with name: " + name);

        return;
      }
      m.freezeWorldMatrix();
      m.isPickable = true;
      m.receiveShadows = true;
      shadowGenerator.addShadowCaster(m);
      new PhysicsAggregate(
        m,
        PhysicsShapeType.MESH,
        {
          mass: 0,
          friction: 1,
          restitution: 0,
        },
        scene,
      );
    });

    const meshesToShadowReceiversOnlyRegexp = [
      /^stone_valley_long/,
      /^stone_valley_long_2/,
      /^stone_valley_small/,
      /^stone_valley_trio/,
      /^stone_valley_plate/,
      /^BambooJA/,
      /^Grass_2JA/,
      /^flower_yellow_big/,
      /^flower_yellow_small/,
      /^Rock_SmallJA/,
    ];
    scene.meshes
      .filter(
        (m) =>
          meshesToShadowReceiversOnlyRegexp.some((regexp) => regexp.test(m.name)) &&
          activeZoneBBoxMeshBoundingBox.intersectsPoint(m.position),
      )
      .forEach((m: AbstractMesh) => {
        m.isPickable = false;
        m.receiveShadows = true;
        m.freezeWorldMatrix();
      });

    const meshesToShadowsRegexp = [
      /^rock_huge_1\.\d+$/,
      /^rock_huge_2\.\d+$/,
      /^tree_big_1_leafs/,
      /^tree_tall_big_leafs/,
      /^sakura_2_leafs/,
      /^water_grass_1/,
      /^leaves_water_big_green/,
      /^leaves_water_small_pink/,
      /^bush_sphere_mid_light/,
      /^bush_sphere_mid_dark/,
      /^bush_sphere_big_light/,
      /^flower_pink_big/,
      /^flags/,
      /^birthday_cake/,
      /^lantern/,
      /^r_letter$/,
      /^congrat_planes$/,
    ];
    scene.meshes
      .filter(
        (m) =>
          meshesToShadowsRegexp.some((regexp) => regexp.test(m.name)) &&
          activeZoneBBoxMeshBoundingBox.intersectsPoint(m.position),
      )
      .forEach((m: AbstractMesh) => {
        m.isPickable = false;
        m.receiveShadows = true;
        m.freezeWorldMatrix();
        shadowGenerator.addShadowCaster(m);
      });

    const meshesToShadowAndPhysRegexp = [
      /^bridge_opora/,
      /^bridge_walk/,
      /^Rock_BigJA/,
      /^Rock_HugeJA/,
      /^plate_one_level/,
      /^plate_two_level/,
      /^stone_big_2/,
      /^Rock_MediumJA/,
      /^stone_big_twisted_1/,
      /^tree_big_1_bark/,
      /^tree_tall_big_bark/,
      /^sakura_2_bark/,
      /^CherryTreeJA/,
      /^toro_small/,
      /^toro_gaming/,
      /^toro_big/,
      /^chinese_wall/,
    ];

    scene.meshes
      .filter(
        (m) =>
          meshesToShadowAndPhysRegexp.some((regexp) => regexp.test(m.name)) &&
          activeZoneBBoxMeshBoundingBox.intersectsPoint(m.position),
      )
      .forEach((m: AbstractMesh) => {
        m.receiveShadows = true;
        m.isPickable = true;
        m.freezeWorldMatrix();
        shadowGenerator.addShadowCaster(m);

        new PhysicsAggregate(
          m,
          PhysicsShapeType.MESH,
          { mass: 0, friction: 1, restitution: 0 },
          scene,
        );
      });

    const water = scene.getMeshByName("water_0");
    water.isPickable = false;
    water.position.y = 0;
    water.receiveShadows = true;

    const waterMaterial = new StandardMaterial("waterMat");
    waterMaterial.diffuseColor = new Color3(0.05, 0.2, 0);
    waterMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
    waterMaterial.reflectionTexture = probe.cubeTexture;
    waterMaterial.reflectionTexture.level = 0.7;
    waterMaterial.transparencyMode = PBRMaterial.MATERIAL_ALPHABLEND;
    waterMaterial.alpha = 0.8;
    waterMaterial.disableLighting = true;

    water.material = waterMaterial;

    const water1 = scene.getMeshByName("water_1");
    water1.isPickable = false;
    water1.receiveShadows = true;
    water1.material = waterMaterial;

    const underwaterGround = scene.getMeshByName("underwater_ground");
    underwaterGround.receiveShadows = true;

    new PhysicsAggregate(
      underwaterGround,
      PhysicsShapeType.BOX,
      { mass: 0, friction: 1, restitution: 0 },
      scene,
    );

    const cloudMesh = scene.getMeshByName("cloud_big") as Mesh;
    cloudMesh.isVisible = false;
    cloudMesh.isPickable = false;
    cloudMesh.checkCollisions = false;

    const cloudMatetial = new StandardMaterial("cloudMatetial");
    cloudMatetial.emissiveColor = new Color3(1, 1, 1);
    cloudMatetial.alpha = 0.55;
    cloudMatetial.transparencyMode = PBRMaterial.MATERIAL_ALPHABLEND;

    cloudMesh.material = cloudMatetial;

    this.spawnClouds(scene, cloudMesh, 50);

    /**
     * Postprocess
     */
    const defaultPipeline = new DefaultRenderingPipeline("defaultPipeline", true, scene, [
      scene.activeCamera,
    ]);
    defaultPipeline.sharpenEnabled = true;
    defaultPipeline.sharpen.edgeAmount = 0.2;
    defaultPipeline.imageProcessingEnabled = true;
    defaultPipeline.imageProcessing.contrast = 1;
    defaultPipeline.imageProcessing.exposure = 1;
    defaultPipeline.imageProcessing.colorGradingEnabled = true;

    const colorGrading = new ColorGradingTexture(lutAsset, scene);
    defaultPipeline.imageProcessing.colorGradingTexture = colorGrading;

    if (device.isDesktop) {
      defaultPipeline.samples = 4;
    } else {
      defaultPipeline.fxaaEnabled = true;
      defaultPipeline.samples = 2;
    }

    const dragonTriggerZone = scene.getMeshByName("dragon_trigger_zone");
    dragonTriggerZone.checkCollisions = true;
    dragonTriggerZone.isVisible = false;

    /**
     * Runtime
     */
    scene.onBeforeRenderObservable.add(() => {
      if (this.#player.mesh.position.y < -10) {
        this.#player.setPosition(this.playerSpawnPoint);
      }
    });

    scene.onBeforeRenderObservable.add(async () => {
      if (this.#unoGameState.turn === 0 && this.#player.mesh.intersectsMesh(dragonTriggerZone)) {
        console.log("dragon zone triggered");
        await this.unoStartGame(scene);
      }
    });

    this.setupLODMeshes(scene);
    await this.setupUnoCards(scene);
    this.setupToroActivity(scene);
    this.setupStatueBuddaActivity(scene);
    this.setupToroHokkuActivity(scene);
    await this.setupSounds(scene);
    this.setupOutroSoundAction(scene);
    this.setupMicrowaveCollision();
    this.setupSecretPlacesAction(scene);
    this.setupTorusActivityAnimation(scene);
    this.setupCakeAction(scene);
    this.spawnStars(scene);
    this.setupFinalAction(scene);

    await scene.whenReadyAsync();

    await audioEngine.unlockAsync();
    this.#sounds.get("bgBirdsSound").play({ loop: true, volume: 1.5 });
    this.#sounds.get("waterLakeSound").play({ loop: true });

    shadowGenerator.getShadowMap().refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    sunLight.autoUpdateExtends = false;

    this.watchFrameRate(scene);
    sceneUI.loopUpdateFpsLabel();

    return scene;
  }

  private watchFrameRate(scene: Scene): void {
    const startStabilizationMs = performance.now();
    console.log("scene loaded at local ts: " + startStabilizationMs * 0.001 + " sec");
    const deltaAverager = new DeltaTimeAverager(21, 0.05, 21, 7);
    let spentSec: number = 0;

    const observer = scene.onAfterRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() * 0.001;
      deltaAverager.addSample(dt);
      spentSec = (performance.now() - startStabilizationMs) * 0.001;
      if (deltaAverager.isStable) {
        console.log(
          `frame stabilized at avg dt: ${deltaAverager.average}, it took: ${spentSec} sec`,
        );
        this.#player.loopUpdate();
        scene.onAfterRenderObservable.remove(observer);
      }

      if (spentSec >= 5) {
        scene.onAfterRenderObservable.remove(observer);
        if (confirm("Sorry, your device is too slow to have a good experience.")) {
          window.location.reload();
        } else {
          window.location.reload();
        }
      }
    });
  }

  private setupColorsTextureBlinkingMaterial(scene: Scene, originalMaterial: PBRMaterial) {
    const colorsTextureMaterialBlink = originalMaterial.clone("colors_texture_blink");
    colorsTextureMaterialBlink.emissiveColor = Color3.Black();
    colorsTextureMaterialBlink.emissiveIntensity = 0.5;
    colorsTextureMaterialBlink.unfreeze();

    const colorsTextureMaterialBlinkAnimation = new Animation(
      "colorsTextureMaterialBlinkAnimation",
      "emissiveColor",
      10,
      Animation.ANIMATIONTYPE_COLOR3,
      Animation.ANIMATIONLOOPMODE_CYCLE,
    );
    const blinkAnimationKeys = [
      { frame: 0, value: colorsTextureMaterialBlink.emissiveColor },
      { frame: 5, value: new Color3(0.2, 0.2, 0.2) },
      { frame: 10, value: colorsTextureMaterialBlink.emissiveColor },
    ];
    colorsTextureMaterialBlinkAnimation.setKeys(blinkAnimationKeys);
    colorsTextureMaterialBlink.animations = [colorsTextureMaterialBlinkAnimation];

    scene.beginAnimation(colorsTextureMaterialBlink, 0, 10, true, 0.5);
  }

  private setupTorusActivityAnimation(scene: Scene) {
    const activityTorusMat = new StandardMaterial("activityTorusMat");
    activityTorusMat.pointsCloud = true;
    activityTorusMat.pointSize = device.isMobile ? 1.5 : 1;
    activityTorusMat.disableLighting = true;
    activityTorusMat.emissiveColor = new Color3(0, 0.65, 1);
    activityTorusMat.diffuseColor = activityTorusMat.emissiveColor;

    const activityTorusAnimation = new Animation(
      "activityTorusAnimation",
      "rotation.y",
      10,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE,
    );
    const activityTorusAnimationKeys = [
      {
        frame: 0,
        value: 0,
      },
      { frame: 10, value: Math.PI * 2 },
    ];
    activityTorusAnimation.setKeys(activityTorusAnimationKeys);

    scene.meshes
      .filter((m) => m.name.includes("activity_torus"))
      .forEach((m) => {
        m.material = activityTorusMat;
        m.isPickable = false;
        m.checkCollisions = false;
        m.rotationQuaternion = null;
        m.animations.push(activityTorusAnimation);
        scene.beginAnimation(m, 0, 10, true, 0.125);
      });
  }

  private setupFinalGazeboLights(scene: Scene) {
    const lanternMat = new StandardMaterial("lanternMat");
    lanternMat.diffuseColor = new Color3(1, 0.95, 0.9);
    lanternMat.backFaceCulling = false;
    lanternMat.emissiveColor = new Color3(0.35, 0.3, 0.25);

    scene.meshes
      .filter((m) => /^lantern\.\d+$/.test(m.name))
      .forEach((m, idx) => {
        m.material = lanternMat;

        const light = new PointLight("lanternPointLight_" + idx, m.position, scene);
        light.diffuse = this.#chineseLampColor;
        light.intensity = 0;
        light.falloffType = PointLight.FALLOFF_PHYSICAL;
        light.range = 20;
      });

    const spotOne = scene.getLightByName("Spot");
    const spotTwo = scene.getLightByName("Spot.001");
    spotOne.intensity = 0;
    spotTwo.intensity = 0;
  }

  private spawnStars(scene: Scene) {
    const starCount = 100;
    const radius = 800;
    const yCenter = 150;

    const baseStar = MeshBuilder.CreatePlane("star_base", { size: 12 }, scene);
    baseStar.billboardMode = Mesh.BILLBOARDMODE_ALL;
    baseStar.infiniteDistance = true;
    baseStar.isPickable = false;

    const starMat = new StandardMaterial("starMat", scene);
    starMat.emissiveColor = Color3.White();
    starMat.disableLighting = true;
    starMat.alpha = 0;
    starMat.diffuseTexture = new Texture(star2Img);
    starMat.useAlphaFromDiffuseTexture = true;
    starMat.diffuseTexture.hasAlpha = true;

    baseStar.material = starMat;
    baseStar.isVisible = false;
    baseStar.checkCollisions = false;

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random());
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = yCenter + radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const star = baseStar.createInstance(`star_${i}`);
      star.position.set(x, y, z);
      star.billboardMode = Mesh.BILLBOARDMODE_ALL;
      star.infiniteDistance = true;
      star.isPickable = false;
      star.checkCollisions = false;
    }
  }

  private async changeDaytime(scene: Scene, reverse: boolean) {
    const frameRate = 10;
    const startFrame = reverse ? frameRate : 0;
    const endFrame = reverse ? 0 : frameRate;

    if (reverse) {
      this.#sounds.get("bgBirdsSound").play({ loop: true, volume: 1.5 });
      this.#sounds.get("bgNightSound").stop();
    } else {
      this.#sounds.get("bgBirdsSound").stop();
      this.#sounds.get("bgNightSound").play({ loop: true, volume: 0.25 });
    }

    const sunLightStartColor = reverse ? this.#sunLightNightColor : this.#sunLightDayColor;
    const sunLightEndColor = reverse ? this.#sunLightDayColor : this.#sunLightNightColor;
    const sunLight = scene.getLightByName("sunLight") as DirectionalLight;
    const sunLightColorAnimation = new Animation(
      "sunLightColorAnimation",
      "diffuse",
      frameRate,
      Animation.ANIMATIONTYPE_COLOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );
    const sunLightColorAnimationKeys = [
      {
        frame: startFrame,
        value: sunLightStartColor,
      },
      { frame: endFrame, value: sunLightEndColor },
    ];
    sunLightColorAnimation.setKeys(sunLightColorAnimationKeys);
    sunLight.animations.push(sunLightColorAnimation);

    const backlight = scene.getLightByName("backlight") as HemisphericLight;
    const dimBacklightAnimation = new Animation(
      "dimBacklightAnimation",
      "intensity",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );
    const dimBacklightKeys = [
      { frame: startFrame, value: backlight.intensity },
      { frame: endFrame, value: 0.02 },
    ];
    dimBacklightAnimation.setKeys(dimBacklightKeys);
    backlight.animations.push(dimBacklightAnimation);

    const cloudBig = scene.getMeshByName("cloud_big");
    const cloudBigAnimation = new Animation(
      "cloudBigAnimation",
      "material.alpha",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );
    const cloudBigAnimationKeys = [
      {
        frame: startFrame,
        value: (cloudBig.material as StandardMaterial).alpha,
      },
      { frame: endFrame, value: 0 },
    ];
    cloudBigAnimation.setKeys(cloudBigAnimationKeys);
    cloudBig.animations.push(cloudBigAnimation);

    const skyBoxMesh = scene.getMeshByName("skyBoxMesh");
    const skyboxLevelAnimation = new Animation(
      "skyboxLevelAnimation",
      "material.reflectionTexture.level",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );
    const skyboxLevelAnimationKeys = [
      {
        frame: startFrame,
        value: (skyBoxMesh.material as StandardMaterial).reflectionTexture.level,
      },
      { frame: endFrame, value: 0.3 },
    ];
    skyboxLevelAnimation.setKeys(skyboxLevelAnimationKeys);
    skyBoxMesh.animations.push(skyboxLevelAnimation);

    const dimSunLightAnimation = new Animation(
      "dimSunLightAnimation",
      "intensity",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );
    const dimSunLightKeys = [
      { frame: startFrame, value: sunLight.intensity },
      { frame: endFrame, value: 0.5 },
    ];
    dimSunLightAnimation.setKeys(dimSunLightKeys);
    sunLight.animations.push(dimSunLightAnimation);

    const starMat = scene.getMaterialByName("starMat") as StandardMaterial;
    const starsAnimation = new Animation(
      "starsAnimation",
      "alpha",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );
    const starsAnimationKeys = [
      { frame: startFrame, value: starMat.alpha },
      { frame: endFrame * 0.5, value: 0.05 },
      { frame: endFrame, value: 0.8 },
    ];
    starsAnimation.setKeys(starsAnimationKeys);
    starMat.animations = [starsAnimation];

    const waterMat = scene.getMaterialByName("waterMat") as StandardMaterial;
    const waterMatAnimation = new Animation(
      "waterMatAnimation",
      "reflectionTexture.level",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );
    const waterMatAnimationKeys = [
      { frame: startFrame, value: waterMat.reflectionTexture.level },
      { frame: endFrame, value: 0.3 },
    ];
    waterMatAnimation.setKeys(waterMatAnimationKeys);
    waterMat.animations = [waterMatAnimation];

    const fogColorAnimation = new Animation(
      "fogColorAnimation",
      "fogColor",
      frameRate,
      Animation.ANIMATIONTYPE_COLOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );
    const fogStartColor = reverse ? this.#fogNightColor : this.#fogDayColor;
    const fogEndColor = reverse ? this.#fogDayColor : this.#fogNightColor;
    const fogColorKeys = [
      { frame: startFrame, value: fogStartColor },
      { frame: endFrame, value: fogEndColor },
    ];
    fogColorAnimation.setKeys(fogColorKeys);
    scene.animations.push(fogColorAnimation);

    const environmentIntensityAnimation = new Animation(
      "environmentIntensityAnimation",
      "environmentIntensity",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );
    const environmentIntensityKeys = [
      { frame: 0, value: scene.environmentIntensity },
      { frame: frameRate, value: scene.environmentIntensity + 2 },
    ];
    environmentIntensityAnimation.setKeys(environmentIntensityKeys);
    scene.animations.push(environmentIntensityAnimation);

    const sunDisk = scene.getMeshByName("sunDisk");
    const sunDiskAnimation = new Animation(
      "sunDiskAnimation",
      "visibility",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );

    const sunDiskAnimationKeys = [
      { frame: startFrame, value: sunDisk.visibility },
      { frame: endFrame, value: 0 },
    ];
    sunDiskAnimation.setKeys(sunDiskAnimationKeys);
    sunDisk.animations.push(sunDiskAnimation);

    const batchAnim = async () => {
      const promises = [
        new Promise((resolve) => {
          scene.beginAnimation(sunLight, startFrame, endFrame, false, 0.25, () => {
            resolve(true);
          });
        }),
        new Promise((resolve) => {
          scene.beginAnimation(backlight, startFrame, endFrame, false, 0.25, () => {
            resolve(true);
          });
        }),
        new Promise((resolve) => {
          scene.beginAnimation(scene, startFrame, endFrame, false, 0.25, () => {
            resolve(true);
          });
        }),
        new Promise((resolve) => {
          scene.beginAnimation(skyBoxMesh, startFrame, endFrame, false, 0.25, () => {
            resolve(true);
          });
        }),
        new Promise((resolve) => {
          scene.beginAnimation(cloudBig, startFrame, endFrame, false, 0.25, () => {
            resolve(true);
          });
        }),
        new Promise((resolve) => {
          scene.beginAnimation(starMat, startFrame, endFrame, false, 0.25, () => {
            resolve(true);
          });
        }),
        new Promise((resolve) => {
          scene.beginAnimation(sunDisk, 0, frameRate, false, 0.25, () => {
            resolve(true);
          });
        }),
        new Promise((resolve) => {
          scene.beginAnimation(waterMat, 0, frameRate, false, 0.25, () => {
            resolve(true);
          });
        }),
      ];

      await Promise.all(promises);
    };

    await batchAnim();

    const lightsToOn = ["lanternPointLight_0", "lanternPointLight_1"];
    lightsToOn.forEach((name) => {
      const light = scene.getLightByName(name) as PointLight;
      light.intensity = 15;
    });

    const spotOne = scene.getLightByName("Spot");
    const spotTwo = scene.getLightByName("Spot.001");
    spotOne.intensity = 150;
    spotTwo.intensity = 150;

    const lanternMat = scene.getMaterialByName("lanternMat") as StandardMaterial;
    lanternMat.emissiveColor = new Color3(0.6, 0.4, 0.2);
  }

  private setupCakeAction(scene: Scene) {
    const fireworkLight = scene.getLightByName("firework_point_light");
    fireworkLight.intensity = 0;

    const cake = scene.getMeshByName("birthday_cake");
    cake.isPickable = true;
    cake.metadata = {};
    cake.metadata.isTouchable = true;
    cake.metadata.onTouch = async () => {
      const spawnPoints = scene.transformNodes.filter((node) =>
        /^firework_spawn_point/.test(node.name),
      );

      const shuffled = spawnPoints
        .map((n) => ({ n, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map((o) => o.n);

      const explosionCount = 30;
      let fireworkLightFadeId: NodeJS.Timeout | null = null;
      let lastRocketSoundPlayTime: number = 0;

      for (let i = 0; i < explosionCount; i++) {
        if (
          this.#sounds.get("fireworkRocketSound").currentTime === 0 &&
          Date.now() - lastRocketSoundPlayTime > 2500 &&
          i < explosionCount
        ) {
          this.#sounds.get("fireworkRocketSound").play({ volume: 0.8 });
          lastRocketSoundPlayTime = Date.now();
        }

        if (i === 0) {
          // initial delay rocket sound
          await new Promise((resolve) => {
            const id = setTimeout(() => {
              resolve(true);
              clearTimeout(id);
            }, 400);
          });
        }

        const randomIndex = Math.floor(Math.random() * shuffled.length);
        this.fireworkExplode(shuffled[randomIndex].getAbsolutePosition().clone(), scene);

        this.#sounds.get("fireworkBangSound").play();

        // explosion light
        fireworkLight.intensity = 2000;
        if (fireworkLightFadeId !== null) {
          clearInterval(fireworkLightFadeId);
        }
        fireworkLightFadeId = setInterval(() => {
          fireworkLight.intensity *= 0.95;
          if (fireworkLight.intensity < 1) {
            fireworkLight.intensity = 0;
            clearInterval(fireworkLightFadeId!);
            fireworkLightFadeId = null;
          }
        }, 30);

        await new Promise((resolve) => {
          const id = setTimeout(() => {
            resolve(true);
            clearTimeout(id);
          }, Math.random() * 500);
        });
      }
    };
  }

  private fireworkExplode(position: Vector3, scene: Scene): void {
    let ps: GPUParticleSystem | ParticleSystem;
    if (GPUParticleSystem.IsSupported) {
      ps = new GPUParticleSystem("firework_explosion", { capacity: 5000 }, scene);
    } else {
      ps = new ParticleSystem("firework_explosion", 5000, scene);
    }

    ps.particleTexture = new Texture(starImg, scene);
    ps.emitter = position;
    ps.color1 = new Color4(Math.random(), Math.random(), Math.random(), 1.0);
    ps.color2 = new Color4(Math.random(), Math.random(), Math.random(), 1.0);
    ps.colorDead = new Color4(0, 0, 0.2, 0.0);
    ps.minSize = 1.25;
    ps.maxSize = 1.25;
    ps.minLifeTime = 0.5;
    ps.maxLifeTime = 0.6;
    ps.emitRate = 5000;
    ps.minEmitPower = 30;
    ps.updateSpeed = 0.0035;
    ps.gravity = new Vector3(0, -9.81, 0);
    ps.createSphereEmitter(0.1);
    ps.addSizeGradient(0.75, 1.2);
    ps.addSizeGradient(1, 0.5);

    ps.start();

    const id = setTimeout(() => {
      ps.stop();
      clearTimeout(id);
    }, 100);

    const id2 = setTimeout(() => {
      ps.dispose();
      clearTimeout(id2);
    }, 2000);
  }

  private setupFinalAction(scene: Scene) {
    const finalZoneTriggerBoxMesh = scene.getMeshByName("second_garden_zone_trigger");
    finalZoneTriggerBoxMesh.isVisible = false;
    finalZoneTriggerBoxMesh.isPickable = true;

    const finalZoneAction = new ExecuteCodeAction(
      {
        trigger: ActionManager.OnIntersectionEnterTrigger,
        parameter: finalZoneTriggerBoxMesh,
      },
      async () => {
        this.#player.mesh.actionManager.unregisterAction(finalZoneAction);

        await this.changeDaytime(scene, false);
      },
    );

    this.#player.mesh.actionManager.registerAction(finalZoneAction);
  }

  private setupSecretPlacesAction(scene: Scene) {
    if (!this.#player.mesh.actionManager) {
      this.#player.mesh.actionManager = new ActionManager(scene);
    }

    const triggerMeshes = scene.meshes.filter((m) => m.name.includes("secret_place_trigger_box"));
    triggerMeshes.forEach((triggerMesh) => {
      triggerMesh.isVisible = false;
      triggerMesh.isPickable = true;

      const secretPlaceZoneSoundAction = new ExecuteCodeAction(
        {
          trigger: ActionManager.OnIntersectionEnterTrigger,
          parameter: triggerMesh,
        },
        () => {
          this.#sounds.get("gardenOutroSound").play();
          this.#player.mesh.actionManager.unregisterAction(secretPlaceZoneSoundAction);
        },
      );

      this.#player.mesh.actionManager.registerAction(secretPlaceZoneSoundAction);
    });
  }

  private setupOutroSoundAction(scene: Scene) {
    if (!this.#player.mesh.actionManager) {
      this.#player.mesh.actionManager = new ActionManager(scene);
    }

    const squareGazeboTriggerBox = scene.getMeshByName("square_gazebo_trigger_box");
    squareGazeboTriggerBox.isVisible = false;
    squareGazeboTriggerBox.isPickable = true;

    let hasPlayedGardenOutroSound = false;
    const playerEntersFinalZoneSoundAction = new ExecuteCodeAction(
      {
        trigger: ActionManager.OnIntersectionEnterTrigger,
        parameter: squareGazeboTriggerBox,
      },
      () => {
        if (hasPlayedGardenOutroSound) {
          return;
        }

        this.#sounds.get("gardenOutroSound").play();
        hasPlayedGardenOutroSound = true;
        this.#player.mesh.actionManager.unregisterAction(playerEntersFinalZoneSoundAction);
      },
    );

    this.#player.mesh.actionManager.registerAction(playerEntersFinalZoneSoundAction);
  }

  private setupMicrowaveCollision() {
    emitter.on("player_picked_object", (transformNode) => {
      const node = transformNode as TransformNode;
      if (node.name.includes("microwave")) {
        this.#sounds.get("microwaveDingSound").play({ volume: 0.5 });
      }
    });
  }

  private async setupSounds(scene: Scene) {
    const soundPromises = [
      this.#audioEngine.createSoundAsync("bgBirdsSound", bgBirdsAudio).then((sound) => {
        this.#sounds.set("bgBirdsSound", sound);
      }),

      this.#audioEngine.createSoundAsync("bgNightSound", bgNightAudio).then((sound) => {
        this.#sounds.set("bgNightSound", sound);
      }),

      this.#audioEngine
        .createSoundAsync("waterLakeSound", waterLakeAudio, {
          volume: 0.5,
          spatialEnabled: true,
          spatialMaxDistance: 50,
          spatialRolloffFactor: 1,
          spatialDistanceModel: "linear",
        })
        .then((sound) => {
          this.#sounds.set("waterLakeSound", sound);
          sound.spatial.attach(scene.getMeshByName("gazebo"));
        }),

      this.#audioEngine
        .createSoundAsync("cardGrabSound", cardGrabAudio, {
          maxInstances: 1,
          volume: 0.8,
        })
        .then((sound) => {
          this.#sounds.set("cardGrabSound", sound);
        }),

      this.#audioEngine
        .createSoundAsync("cardDropSound", cardDropAudio, {
          maxInstances: 1,
        })
        .then((sound) => {
          this.#sounds.set("cardDropSound", sound);
        }),

      this.#audioEngine
        .createSoundAsync("cardAttachedToToroSound", cardAttachedToToroAudio, {
          maxInstances: 1,
        })
        .then((sound) => {
          this.#sounds.set("cardAttachedToToroSound", sound);
        }),

      this.#audioEngine
        .createSoundAsync("microwaveDingSound", microwaveDingAudio, {
          maxInstances: 1,
        })
        .then((sound) => {
          this.#sounds.set("microwaveDingSound", sound);
        }),

      this.#audioEngine
        .createSoundAsync("gardenIntroSound", gardenIntroAudio, {
          maxInstances: 1,
        })
        .then((sound) => {
          this.#sounds.set("gardenIntroSound", sound);
        }),

      this.#audioEngine
        .createSoundAsync("gardenOutroSound", gardenOutroAudio, {
          maxInstances: 1,
        })
        .then((sound) => {
          this.#sounds.set("gardenOutroSound", sound);
        }),

      this.#audioEngine
        .createSoundAsync("touchObjectSound", touchObjectAudio, {
          maxInstances: 3,
        })
        .then((sound) => {
          this.#sounds.set("touchObjectSound", sound);
        }),

      this.#audioEngine
        .createSoundAsync("secretFoundSound", secretFoundAudio, {
          maxInstances: 1,
        })
        .then((sound) => {
          this.#sounds.set("secretFoundSound", sound);
        }),

      this.#audioEngine
        .createSoundAsync("unoGameEndSound", unoGameEndAudio, {
          maxInstances: 1,
        })
        .then((sound) => {
          this.#sounds.set("unoGameEndSound", sound);
        }),

      this.#audioEngine
        .createSoundAsync("doorsScreamSound", doorsScreamAudio, {
          maxInstances: 1,
        })
        .then((sound) => {
          this.#sounds.set("doorsScreamSound", sound);
        }),

      this.#audioEngine
        .createSoundAsync("fireworkRocketSound", fireworkRocketAudio, {
          maxInstances: 1,
        })
        .then((sound) => {
          this.#sounds.set("fireworkRocketSound", sound);
        }),

      this.#audioEngine
        .createSoundAsync("fireworkBangSound", fireworkBangAudio, {
          maxInstances: 10,
        })
        .then((sound) => {
          this.#sounds.set("fireworkBangSound", sound);
        }),
    ];

    await Promise.all(soundPromises);

    emitter.on("player_touched_touchable_object", () => {
      this.#sounds.get("touchObjectSound").play({ volume: 0.75 });
    });
  }

  private setupStatueBuddaActivity(scene: Scene) {
    const statueBudda = scene.getMeshByName("statue_budda") as Mesh;
    statueBudda.metadata = {};
    statueBudda.metadata.isTouchable = true;
    statueBudda.metadata.onTouch = function () {
      const meshName = "statue_budda_plane";
      if (scene.getMeshByName(meshName) !== null) {
        // create once

        return;
      }

      const plane = MeshBuilder.CreatePlane(meshName, {
        size: 2,
      });
      plane.isVisible = true;
      plane.billboardMode = TransformNode.BILLBOARDMODE_ALL;

      plane.position = statueBudda.position.clone();
      plane.position.y += 2;

      const adt = AdvancedDynamicTexture.CreateForMesh(plane, 1024, 1024);
      const text = new TextBlock("statue_budda_plane_text", "我丢掉了三张外卡。");
      text.textWrapping = false;
      text.resizeToFit = true;
      text.fontSize = 120;
      text.color = "white";

      adt.addControl(text);
    };
  }

  private getRandomHokku(): string {
    interface HokkuEntry {
      lines: string[];
    }
    interface HokkuJson {
      hokku: HokkuEntry[];
    }

    const typedHokkuData = hokkuData as HokkuJson;
    console.log("typedHokkuData", typedHokkuData);
    const randomIndex = Math.floor(Math.random() * typedHokkuData.hokku.length);
    const random = typedHokkuData.hokku[randomIndex];
    console.log("random", random);

    return random.lines.join("\n");
  }

  private setupToroHokkuActivity(scene: Scene) {
    const hokkuHideTimeout = 10000;
    const toroSmall001 = scene.getMeshByName("toro_small.001") as Mesh;
    toroSmall001.metadata = {};
    toroSmall001.metadata.isTouchable = true;

    const toroSmall001Plane = MeshBuilder.CreatePlane("toro_small_001_plane", {
      width: 2,
      height: 0.66,
    });
    toroSmall001Plane.isPickable = false;
    toroSmall001Plane.isVisible = false;
    toroSmall001Plane.billboardMode = TransformNode.BILLBOARDMODE_ALL;
    toroSmall001Plane.position = toroSmall001.position.clone();
    toroSmall001Plane.position.y += 2;

    const toroSmall001Adt = AdvancedDynamicTexture.CreateForMesh(toroSmall001Plane, 768, 256);

    const rect = new Rectangle();
    rect.thickness = 0;
    rect.cornerRadius = 40;
    rect.background = "#e4d8c8";
    toroSmall001Adt.addControl(rect);

    const toroSmall001text = new TextBlock("toro_small_001_plane_text", "");
    toroSmall001text.textWrapping = true;
    toroSmall001text.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
    toroSmall001text.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP;
    toroSmall001text.paddingLeft = "30px";
    toroSmall001text.paddingTop = "20px";
    toroSmall001text.fontSize = 42;
    toroSmall001text.color = "black";

    toroSmall001Adt.addControl(toroSmall001text);

    let timeoutId: NodeJS.Timeout | undefined;
    toroSmall001.metadata.onTouch = () => {
      if (!toroSmall001Plane.isVisible) {
        toroSmall001Plane.isVisible = true;
      }

      toroSmall001text.text = this.getRandomHokku();

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        toroSmall001Plane.isVisible = false;
        timeoutId = undefined;
      }, hokkuHideTimeout);
    };

    // toro_big
    const toroBig = scene.getMeshByName("toro_big") as Mesh;
    toroBig.metadata = {};
    toroBig.metadata.isTouchable = true;

    const toroBigMeshName = "toro_big_plane";
    const toroBigPlane = MeshBuilder.CreatePlane(toroBigMeshName, {
      width: 2,
      height: 0.66,
    });
    toroBigPlane.isPickable = false;
    toroBigPlane.isVisible = false;
    toroBigPlane.billboardMode = TransformNode.BILLBOARDMODE_ALL;
    toroBigPlane.position = toroBig.position.clone();
    toroBigPlane.position.y += 2.5;

    const toroBigAdt = AdvancedDynamicTexture.CreateForMesh(toroBigPlane, 768, 256);
    toroBigAdt.addControl(rect);

    const toroBigtext = new TextBlock("toro_big_plane_text", "");
    toroBigtext.textWrapping = true;
    toroBigtext.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
    toroBigtext.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP;
    toroBigtext.paddingLeft = "20px";
    toroBigtext.paddingTop = "20px";
    toroBigtext.fontSize = 42;
    toroBigtext.color = "black";

    toroBigAdt.addControl(toroBigtext);

    let timeoutId2: NodeJS.Timeout | undefined;
    toroBig.metadata.onTouch = () => {
      if (!toroBigPlane.isVisible) {
        toroBigPlane.isVisible = true;
      }

      toroBigtext.text = this.getRandomHokku();

      if (timeoutId2 !== undefined) {
        clearTimeout(timeoutId2);
      }
      timeoutId2 = setTimeout(() => {
        toroBigPlane.isVisible = false;
        timeoutId2 = undefined;
      }, hokkuHideTimeout);
    };
  }

  private setupToroActivity(scene: Scene) {
    const toro = scene.getMeshByName("toro_small") as Mesh;
    toro.metadata = {};
    toro.metadata.isTouchable = true;

    if (toro.getChildMeshes().length !== 0) {
      // has cards attached
      return;
    }

    const meshName = "toro_cards_double_plane";
    if (scene.getMeshByName(meshName) !== null) {
      // create once
      return;
    }

    const plane = MeshBuilder.CreatePlane(meshName, {
      size: 1,
    });
    plane.isVisible = false;
    plane.billboardMode = TransformNode.BILLBOARDMODE_ALL;
    plane.position = toro.position.clone();
    plane.position.y += 1.75;

    const adt = AdvancedDynamicTexture.CreateForMesh(plane, 512, 512);
    const text = new TextBlock(
      "toro_cards_double_plane_text",
      "Give me a card and I'll give you two!",
    );
    text.textWrapping = true;
    text.fontSize = 76;
    text.color = "white";

    adt.addControl(text);

    toro.metadata.onTouch = function () {
      plane.isVisible = true;
    };
  }

  private unoCheckCardIsMatchingPreviousCard(card: Mesh, previousToroCard: Mesh): boolean {
    const previousType = previousToroCard.metadata.type;
    if (previousType === "wild" || card.metadata.type === "wild") {
      return true;
    }

    if (previousType === "regular") {
      const previousNumber = previousToroCard.metadata.number;
      const previousColor = previousToroCard.metadata.color;

      return card.metadata.color === previousColor || card.metadata.number === previousNumber;
    }

    throw new Error("unknown previous card type: " + previousType);
  }

  private unoNextTurn(scene: Scene, currentToro: Mesh) {
    ++this.#unoGameState.turn;

    console.log("turn changed to", this.#unoGameState.turn);

    currentToro.material = scene.getMaterialByName("colors_texture");

    const nextToro = scene.getMeshByName("toro_gaming." + this.#unoGameState.turn);
    nextToro.material = scene.getMaterialByName("colors_texture_blink");
    nextToro.edgesColor = new Color4(1, 1, 1, 1);
  }

  private unoGetNextMatchingCard(scene: Scene, previousToroCard: Mesh): Mesh {
    const previousNumber = previousToroCard.metadata.number;
    const previousColor = previousToroCard.metadata.color;
    let matchingCard;

    // todo previousToroCard.metadata.type === "wild";
    if (previousToroCard.metadata.type === "wild") {
      matchingCard = this.getRandomRegularUnoCard(scene);
    }

    // same number but a different color
    if (!matchingCard) {
      matchingCard = scene.meshes.find(
        (mesh) =>
          /^card_(yellow|red|blue|green)_[0-9]_clone_\d+$/.test(mesh.name) &&
          mesh.isVisible &&
          mesh.metadata.isGrabbable === true &&
          mesh.metadata.number === previousNumber &&
          mesh.metadata.color !== previousColor,
      ) as Mesh;
    }

    // same color but a different number
    if (!matchingCard) {
      matchingCard = scene.meshes.find(
        (mesh) =>
          /^card_(yellow|red|blue|green)_[0-9]_clone_\d+$/.test(mesh.name) &&
          mesh.isVisible &&
          mesh.metadata.isGrabbable === true &&
          mesh.metadata.color === previousColor &&
          mesh.metadata.number !== previousNumber,
      ) as Mesh;
    }

    // or get a wild card
    if (!matchingCard) {
      matchingCard = scene.meshes.find(
        (mesh) =>
          /^card_wild_clone_\d+$/.test(mesh.name) &&
          mesh.metadata.isGrabbable === true &&
          mesh.isVisible,
      ) as Mesh;
    }

    if (!matchingCard) {
      throw new Error("no matching card found. It's a bug.");
    }

    return matchingCard;
  }

  private openGateDoors(scene: Scene) {
    console.log("open doors");

    const frameRate = 10;
    const easingFunction = new SineEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    const oldDoorTall = scene.getMeshByName("old_door_tall") as Mesh;
    const oldDoorTallReversed = scene.getMeshByName("old_door_tall_reversed") as Mesh;

    if (!oldDoorTall || !oldDoorTallReversed) {
      console.error("Door meshes not found");
      return;
    }

    oldDoorTall.unfreezeWorldMatrix();
    oldDoorTallReversed.unfreezeWorldMatrix();

    const targetRotationTall = Quaternion.FromEulerAngles(0, -Math.PI / 2, Math.PI); // Rotate -90 degrees on Y
    const targetRotationTallReversed = Quaternion.FromEulerAngles(0, Math.PI / 2, Math.PI); // Rotate 90 degrees on Y

    const doorTallAnimation = new Animation(
      "doorTallRotation",
      "rotationQuaternion",
      frameRate,
      Animation.ANIMATIONTYPE_QUATERNION,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );

    const doorTallKeys = [
      { frame: 0, value: oldDoorTall.rotationQuaternion.clone() },
      { frame: frameRate, value: targetRotationTall },
    ];
    doorTallAnimation.setKeys(doorTallKeys);
    doorTallAnimation.setEasingFunction(easingFunction);

    const doorTallReversedAnimation = new Animation(
      "doorTallReversedRotation",
      "rotationQuaternion",
      frameRate,
      Animation.ANIMATIONTYPE_QUATERNION,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    );

    const doorTallReversedKeys = [
      { frame: 0, value: oldDoorTallReversed.rotationQuaternion.clone() },
      { frame: frameRate, value: targetRotationTallReversed },
    ];
    doorTallReversedAnimation.setKeys(doorTallReversedKeys);
    doorTallReversedAnimation.setEasingFunction(easingFunction);

    oldDoorTall.animations.push(doorTallAnimation);
    oldDoorTallReversed.animations.push(doorTallReversedAnimation);

    oldDoorTall.physicsBody.disablePreStep = false;
    oldDoorTallReversed.physicsBody.disablePreStep = false;

    this.#sounds.get("doorsScreamSound").play();

    scene.beginAnimation(oldDoorTall, 0, frameRate, false, 0.5, () => {
      oldDoorTall.physicsBody.disablePreStep = true;
    });
    scene.beginAnimation(oldDoorTallReversed, 0, frameRate, false, 0.5, () => {
      oldDoorTallReversed.physicsBody.disablePreStep = true;
    });
  }

  private async unoEndGame() {
    return new Promise((resolve) => {
      const sound = this.#sounds.get("unoGameEndSound");
      sound.onEndedObservable.addOnce(() => {
        const id = setTimeout(() => {
          this.#dragonTextBlock.text = "Found! Come in!";
          resolve(true);
          clearTimeout(id);
        }, 3000);
      });
      this.#sounds.get("unoGameEndSound").play();
      this.#dragonTextBlock.text =
        "Too be doo be dooo, ough I forgot where my keys for the doors...";
    });
  }

  private attachUnoCardToToro(card: AbstractMesh, toroMesh: AbstractMesh) {
    card.setParent(toroMesh);
    card.position = this.calcCardToroPosition(card, toroMesh);
    card.rotation.y = -(Math.PI * 90) / 180;
    card.metadata.isGrabbable = false; // don't grab attached card
    card.visibility = 1;

    this.#sounds.get("cardAttachedToToroSound").play({ volume: 1.5 });
  }

  private calcCardToroPosition(card: AbstractMesh, toroMesh: AbstractMesh): Vector3 {
    const maxY =
      toroMesh.getBoundingInfo().maximum.y + card.getBoundingInfo().boundingBox.maximum.y + 0.5;

    return new Vector3(0, maxY, 0);
  }

  private async unoOpponentMove(scene: Scene, currentToro: Mesh) {
    console.log("opponent move");

    let card;
    if (this.#unoGameState.turn === 1) {
      card = this.getRandomRegularUnoCard(scene);
    } else {
      const previousToro = scene.getMeshByName(
        "toro_gaming." + (this.#unoGameState.turn - 1),
      ) as Mesh;
      const previousToroCard = previousToro.getChildren()[0] as Mesh;
      card = this.unoGetNextMatchingCard(scene, previousToroCard);
    }

    if (!card) {
      throw new Error("no matching card found. Bug");
    }

    const cardEndPosition = this.calcCardToroPosition(card, currentToro);
    const toroPosition = currentToro.position.clone();
    toroPosition.addInPlace(cardEndPosition);

    await this.animateCardFly(scene, card, toroPosition);

    this.attachUnoCardToToro(card, currentToro);

    if (this.#unoGameState.turn !== 1 && this.#unoGameState.turn % 2 !== 0) {
      const randomIndex = Math.floor(Math.random() * this.#dragonTextReplicas.length);
      this.#dragonTextBlock.text = this.#dragonTextReplicas[randomIndex];
    }
  }

  private async animateCardFly(scene: Scene, card: Mesh, endPosition: Vector3) {
    return new Promise((resolve) => {
      const frameRate = 20;
      const easingFunction = new SineEase();
      easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
      const cardFlyAnimation = new Animation(
        "cardFlyAnimation",
        "position",
        frameRate,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
      );
      const animationKeys = [
        { frame: 0, value: card.position.clone() },
        { frame: frameRate, value: endPosition },
      ];
      cardFlyAnimation.setEasingFunction(easingFunction);
      cardFlyAnimation.setKeys(animationKeys);

      card.animations.push(cardFlyAnimation);

      scene.beginAnimation(card, 0, frameRate, false, 0.5, () => {
        card.animations.pop();
        resolve(true);
      });
    });
  }

  private async unoStartGame(scene: Scene) {
    this.#unoGameState.turn = 1;

    console.log("uno game started");

    this.#sounds.get("gardenIntroSound").play({ volume: 0.5 });

    const dragon = scene.getMeshByName("dragon");
    const dragonPlane = MeshBuilder.CreatePlane("dragon_plane", { size: 5 });
    dragonPlane.isVisible = true;
    dragonPlane.billboardMode = TransformNode.BILLBOARDMODE_ALL;
    dragonPlane.position = dragon.position.clone();
    dragonPlane.position.y += 2.25;

    const adt = AdvancedDynamicTexture.CreateForMesh(dragonPlane, 1024, 1024);
    this.#dragonTextBlock = new TextBlock(
      "dragon_text_plane",
      "Hey Rodion! You like candies? No? Doesn't matter. You have to play with me! One UNO party, please!",
    );
    this.#dragonTextBlock.textWrapping = true;
    this.#dragonTextBlock.fontSize = 76;
    this.#dragonTextBlock.color = "white";

    adt.addControl(this.#dragonTextBlock);

    const toroMeshNames = [
      "toro_gaming.1",
      "toro_gaming.2",
      "toro_gaming.3",
      "toro_gaming.4",
      "toro_gaming.5",
      "toro_gaming.6",
    ];
    // just initial setup
    toroMeshNames.forEach((name) => {
      const toroMesh = scene.getMeshByName(name) as Mesh;
      const splittedName = name.split(".");
      toroMesh.metadata = {
        isSlot: true,
        slotNumber: Number(splittedName[1]),
      };
    });

    const currentToro = scene.getMeshByName("toro_gaming.1") as Mesh;
    await this.unoOpponentMove(scene, currentToro);
    this.unoNextTurn(scene, currentToro);

    scene.onBeforeRenderObservable.add(async () => {
      if (this.#unoGameState.turn === 0) {
        return;
      }

      if (this.#player.getGrabbedObject() === undefined) {
        return;
      }

      let currentToro = scene.getMeshByName("toro_gaming." + this.#unoGameState.turn) as Mesh;
      const grabbedCard = this.#player.getGrabbedObject();

      if (grabbedCard.intersectsMesh(currentToro)) {
        const previousToro = scene.getMeshByName("toro_gaming." + (this.#unoGameState.turn - 1));
        const previousToroCard = previousToro.getChildren()[0] as Mesh;
        const matched = this.unoCheckCardIsMatchingPreviousCard(grabbedCard, previousToroCard);
        if (matched) {
          this.#player.dropObject(); // fix card release after attached to toro
          this.attachUnoCardToToro(grabbedCard, currentToro);

          emitter.emit("grabbed_object_attached", grabbedCard.uniqueId);

          if (this.#unoGameState.turn === this.#unoGameState.maxTurns) {
            currentToro.material = scene.getMaterialByName("colors_texture");

            await this.unoEndGame();
            this.openGateDoors(scene);

            return;
          }

          this.unoNextTurn(scene, currentToro);

          if (this.#unoGameState.turn % 2 !== 0) {
            currentToro = scene.getMeshByName("toro_gaming." + this.#unoGameState.turn) as Mesh;

            await this.unoOpponentMove(scene, currentToro);
            this.unoNextTurn(scene, currentToro);
          }
        } else {
          console.log("grabbed card cant be attached by uno rules");

          return;
        }
      }
    });
  }

  private getRandomRegularUnoCard(scene: Scene): Mesh {
    const regularUnoCards = scene.meshes.filter(
      (mesh) =>
        /^card_(yellow|red|blue|green)_[0-9]_clone_\d+$/.test(mesh.name) &&
        mesh.isVisible &&
        mesh.parent === null, // not attached to toro and not is grabbed (grabbing use parenting)
    );
    const randomIndex = Math.floor(Math.random() * regularUnoCards.length);

    console.log("random uno card picked: ", regularUnoCards[randomIndex].name);

    return regularUnoCards[randomIndex] as Mesh;
  }

  private async setupUnoCards(scene: Scene) {
    const texture = new Texture(unoCardsAtlas, scene);
    const cardMat = new StandardMaterial("cardMat", scene);
    cardMat.diffuseTexture = texture;
    cardMat.backFaceCulling = false;
    cardMat.specularColor = Color3.Black();
    cardMat.emissiveColor = Color3.White();
    cardMat.disableLighting = true;
    cardMat.useAlphaFromDiffuseTexture = true;
    cardMat.diffuseTexture.hasAlpha = true;
    cardMat.transparencyMode = StandardMaterial.MATERIAL_ALPHATEST;

    const cardMatTrans = cardMat.clone("cardMatTrans");
    cardMatTrans.alpha = 0.5;
    cardMatTrans.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;

    const cardBase = MeshBuilder.CreatePlane("uno_card_base", { width: 0.86, height: 1.4 }, scene);
    cardBase.isVisible = false;
    cardBase.material = cardMat;

    const cols = 13;
    const rows = 8.43;
    const cellW = 1 / cols;
    const cellH = 1 / rows;

    function setCardUV(mesh: Mesh, col: number, row: number) {
      const uvs = mesh.getVerticesData(VertexBuffer.UVKind)!;
      const newUVs: number[] = [];
      const startU = col * cellW;
      const startV = 1 - (row + 1) * cellH;

      for (let i = 0; i < uvs.length; i += 2) {
        const u = uvs[i];
        const v = uvs[i + 1];
        newUVs.push(startU + u * cellW, startV + v * cellH);
      }

      mesh.setVerticesData(VertexBuffer.UVKind, newUVs, true);
    }

    const colorRows: Record<string, number> = {
      yellow: 1,
      red: 2,
      blue: 3,
      green: 4,
    };
    for (const [color, row] of Object.entries(colorRows)) {
      for (let n = 0; n <= 9; n++) {
        const name = `card_${color}_${n}`;
        const mesh = cardBase.clone(name) as Mesh;
        mesh.material = cardMat;
        mesh.makeGeometryUnique();
        setCardUV(mesh, n, row);
        mesh.isVisible = false;
        this.#unoDeck[name] = mesh;
      }
    }

    const wild = cardBase.clone("card_wild") as Mesh;
    wild.material = cardMat;
    wild.makeGeometryUnique();
    setCardUV(wild, 1, 0);
    wild.isVisible = false;
    this.#unoDeck["card_wild"] = wild;

    const spawnPoints = scene.transformNodes.filter((n) => /^card_spawn_point/.test(n.name));
    const secretSpawnPoints = scene.transformNodes.filter((n) =>
      /^card_secret_spawn_point/.test(n.name),
    );

    this.#deckOfRegularUnoCardNames = this.buildDeckOfRegularUnoCards(this.#unoDeck);
    let cardNames = this.shuffleDeckOfCardNames(this.#deckOfRegularUnoCardNames);

    // repeat if needed to cover all spawnPoints
    while (cardNames.length < spawnPoints.length) {
      cardNames.push(...cardNames);
    }
    cardNames.length = spawnPoints.length;

    spawnPoints.forEach((pt, i) => {
      const cardName = cardNames[i];
      const tmpl = this.#unoDeck[cardName];
      const inst = tmpl.clone(`${cardName}_clone_${i}`);

      inst.isVisible = true;
      inst.isPickable = true;
      inst.setAbsolutePosition(pt.getAbsolutePosition());
      inst.rotation.y = Math.random() * Math.PI;
      inst.metadata = {
        type: "regular",
        color: cardName.split("_")[1],
        number: cardName.split("_")[2],
        isGrabbable: true,
      };
    });

    secretSpawnPoints.forEach((pt, i) => {
      const inst = wild.clone(`card_wild_clone_${i}`);
      inst.isVisible = true;
      inst.isPickable = true;
      inst.setAbsolutePosition(pt.getAbsolutePosition());
      inst.rotation.y = Math.random() * Math.PI;
      inst.metadata = { type: "wild", isGrabbable: true };
    });

    // setup events
    emitter.on("player_object_grabbed", (uniqueId) => {
      this.#sounds.get("cardGrabSound").play();

      const id = uniqueId as number;
      const card = scene.getMeshByUniqueId(id);
      card.material = cardMatTrans;

      card.actionManager = new ActionManager(scene);

      const action = new ExecuteCodeAction(
        {
          trigger: ActionManager.OnIntersectionEnterTrigger,
          parameter: scene.getMeshByName("toro_small"),
        },
        () => {
          const toro = scene.getMeshByName("toro_small");
          if (toro.getChildMeshes().length !== 0) {
            return; // card already attached to this toro = challenge completed
          }

          const meshName = "toro_cards_double_plane";
          const plane = scene.getMeshByName(meshName);
          plane.dispose();
          card.material = cardMat;

          // fix card release after attached to toro
          if (card.parent === this.#player.mesh && this.#player.getGrabbedObject() !== undefined) {
            this.#player.dropObject();
          }

          this.attachUnoCardToToro(card, toro);

          // create random two cards and place near the toro
          const cardNames = this.shuffleDeckOfCardNames(this.#deckOfRegularUnoCardNames);

          let firstRandomCard = this.#unoDeck[cardNames[0]];
          firstRandomCard = firstRandomCard.clone(
            firstRandomCard.name + "_clone_" + Math.floor(Math.random() * Date.now()),
          );
          firstRandomCard.isVisible = true;
          firstRandomCard.visibility = 0;
          firstRandomCard.metadata = {
            isGrabbable: false,
            isAttachableTo: true,
            type: "regular",
            color: firstRandomCard.name.split("_")[1],
            number: firstRandomCard.name.split("_")[2],
          };

          let secondRandomCard = this.#unoDeck[cardNames[1]];
          secondRandomCard = secondRandomCard.clone(
            secondRandomCard.name + "_clone_" + Math.floor(Math.random() * Date.now()),
          );
          secondRandomCard.isVisible = true;
          secondRandomCard.visibility = 0;
          secondRandomCard.metadata = {
            isGrabbable: false,
            isAttachableTo: true,
            type: "regular",
            color: secondRandomCard.name.split("_")[1],
            number: secondRandomCard.name.split("_")[2],
          };

          const firstPosition = toro.position.clone();
          firstPosition.z -= 2;
          firstRandomCard.position = firstPosition;

          const secondPosition = toro.position.clone();
          secondPosition.z += 2;
          secondRandomCard.position = secondPosition;

          // animation
          const frameRate = 20;
          const cardFadeInAnimation = new Animation(
            "cardFadeInAnimation",
            "visibility",
            frameRate,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT,
          );
          const animationKeys = [
            { frame: 0, value: 0 },
            { frame: frameRate, value: 1 },
          ];
          cardFadeInAnimation.setKeys(animationKeys);

          firstRandomCard.animations.push(cardFadeInAnimation);
          secondRandomCard.animations.push(cardFadeInAnimation);

          [firstRandomCard, secondRandomCard].forEach((card) => {
            scene.beginAnimation(card, 0, frameRate, false, 1, () => {
              card.animations.pop();
              card.metadata.isGrabbable = true;
            });
          });

          card.actionManager.unregisterAction(action);
          card.actionManager.dispose();
        },
      );

      card.actionManager.registerAction(action);
    });

    emitter.on("player_object_dropping", (uniqueId) => {
      const id = uniqueId as number;
      const m = scene.getMeshByUniqueId(id);
      m.material = cardMat;
      this.#sounds.get("cardDropSound").play();
    });

    emitter.on("grabbed_object_attached", (uniqueId) => {
      const id = uniqueId as number;
      const m = scene.getMeshByUniqueId(id);
      m.material = cardMat;
    });
  }

  private buildDeckOfRegularUnoCards(unoDeck: { [name: string]: Mesh }): string[] {
    let cardNames: string[] = [];
    Object.keys(unoDeck).forEach((name) => {
      if (name !== "card_wild") {
        cardNames.push(name);
      }
    });

    return cardNames;
  }

  private shuffleDeckOfCardNames(cardNames: string[]): string[] {
    return cardNames
      .map((n) => ({ n, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map((o) => o.n);
  }

  public randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  public spawnClouds(scene: Scene, baseCloud: Mesh, count: number): void {
    const cloudsData: {
      mesh: InstancedMesh;
      speedZ: number;
      fadingOut: boolean;
      fadingIn: boolean;
      fadeStartTime?: number;
    }[] = [];
    const endZ = 1000;
    const frameRate = 15;

    for (let i = 0; i < count; i++) {
      const cloudClone = baseCloud.createInstance(`cloud_${i}`);
      cloudClone.isPickable = false;
      cloudClone.checkCollisions = false;
      cloudClone.visibility = 1;

      const startX = this.randomRange(-500, 500);
      const startY = this.randomRange(60, 200);
      const startZ = this.randomRange(-500, 500);
      cloudClone.position.set(startX, startY, startZ);

      const speedZ = this.randomRange(0.075, 0.15);
      cloudsData.push({
        mesh: cloudClone,
        speedZ,
        fadingOut: false,
        fadingIn: false,
      });

      const animation = new Animation(
        "cloudsAnimation",
        "position.z",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE,
      );

      const duration = (endZ - startZ) / speedZ;
      const keyFrames = [
        { frame: 0, value: startZ },
        { frame: duration, value: endZ },
      ];
      animation.setKeys(keyFrames);
      cloudClone.animations.push(animation);
      scene.beginAnimation(cloudClone, 0, duration, true);
    }
  }

  private setupLODMeshes(scene: Scene) {
    const grass2JA = scene.getMeshByName("Grass_2JA") as Mesh;
    grass2JA.setEnabled(false);
    const grass2JALOD = scene.getMeshByName("Grass_2JA_LOD") as Mesh;
    grass2JA.addLODLevel(45, grass2JALOD);
    grass2JA.addLODLevel(120, null);

    const treeTallBigBark = scene.getMeshByName("tree_tall_big_bark") as Mesh;
    const treeTallBigLeafs = scene.getMeshByName("tree_tall_big_leafs") as Mesh;
    const treeTallBigBarkLOD1 = scene.getMeshByName("tree_tall_big_bark_LOD1") as Mesh;
    const treeTallBigLOD2 = scene.getMeshByName("tree_tall_big_LOD2") as Mesh;
    (treeTallBigLOD2.material as PBRMaterial).useAlphaFromAlbedoTexture = true;
    (treeTallBigLOD2.material as PBRMaterial).albedoTexture.hasAlpha = true;
    (treeTallBigLOD2.material as PBRMaterial).roughness = 1.0;
    (treeTallBigLOD2.material as PBRMaterial).transparencyMode = PBRMaterial.MATERIAL_ALPHABLEND;
    const treeTallBigLeafsLOD1 = scene.getMeshByName("tree_tall_big_leafs_LOD1") as Mesh;
    treeTallBigBark.setEnabled(false);
    treeTallBigLeafs.setEnabled(false);
    treeTallBigLOD2.setEnabled(false);
    treeTallBigBark.addLODLevel(60, treeTallBigBarkLOD1);
    treeTallBigBark.addLODLevel(150, treeTallBigLOD2);
    treeTallBigLeafs.addLODLevel(60, treeTallBigLeafsLOD1);
    treeTallBigLeafs.addLODLevel(150.5, null);

    const treeBig1Bark = scene.getMeshByName("tree_big_1_bark") as Mesh;
    const treeBig1Leafs = scene.getMeshByName("tree_big_1_leafs") as Mesh;
    const treeBig1BarkLOD1 = scene.getMeshByName("tree_big_1_bark_LOD1") as Mesh;
    const treeBig1LeafsLOD1 = scene.getMeshByName("tree_big_1_leafs_LOD1") as Mesh;
    treeBig1Bark.setEnabled(false);
    treeBig1Leafs.setEnabled(false);
    treeBig1Bark.addLODLevel(45, treeBig1BarkLOD1);
    treeBig1Leafs.addLODLevel(45, treeBig1LeafsLOD1);

    const bushSphereBigLight = scene.getMeshByName("bush_sphere_big_light") as Mesh;
    const bushSphereBigLightLOD1 = scene.getMeshByName("bush_sphere_big_light_LOD1") as Mesh;
    bushSphereBigLight.setEnabled(false);
    bushSphereBigLight.addLODLevel(45, bushSphereBigLightLOD1);

    const bushSphereMidDark = scene.getMeshByName("bush_sphere_mid_dark") as Mesh;
    const bushSphereMidDarkLOD1 = scene.getMeshByName("bush_sphere_mid_dark_LOD1") as Mesh;
    bushSphereMidDark.setEnabled(false);
    bushSphereMidDark.addLODLevel(45, bushSphereMidDarkLOD1);

    const bushSphereMidLight = scene.getMeshByName("bush_sphere_mid_light") as Mesh;
    const bushSphereMidLightLOD1 = scene.getMeshByName("bush_sphere_mid_light_LOD1") as Mesh;
    bushSphereMidLight.setEnabled(false);
    bushSphereMidLight.addLODLevel(45, bushSphereMidLightLOD1);

    const plateOneLevel = scene.getMeshByName("plate_one_level") as Mesh;
    const plateOneLevelLOD1 = scene.getMeshByName("plate_one_level_LOD1") as Mesh;
    plateOneLevel.setEnabled(false);
    plateOneLevel.addLODLevel(45, plateOneLevelLOD1);
  }
}

export default new SecondScene();
