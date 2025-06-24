import type { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexBuffer } from "@babylonjs/core/Buffers";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Animation } from "@babylonjs/core/Animations/animation";
import { EasingFunction, SineEase } from "@babylonjs/core/Animations/easing";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
// assets
import unoCardsAtlas from "../../assets/textures/uno_cards_atlas.png";
import type { SoundPool } from ".";

export type UnoDeck = { [name: string]: Mesh };
export type UnoGameState = { turn: number; maxTurns: number };

export class UnoGame {
  #scene: Scene;
  #sounds: SoundPool;
  #gameState: UnoGameState = {
    turn: 0,
    maxTurns: 6,
  };
  #unoDeck: UnoDeck = {};
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
  #cardMaterial: StandardMaterial;
  #cardMaterialTransparent: StandardMaterial;

  constructor(scene: Scene, sounds: SoundPool) {
    this.#scene = scene;
    this.#sounds = sounds;
  }

  public async init(): Promise<void> {
    const texture = new Texture(unoCardsAtlas, this.#scene);
    this.#cardMaterial = new StandardMaterial("cardMat", this.#scene);
    this.#cardMaterial.diffuseTexture = texture;
    this.#cardMaterial.backFaceCulling = false;
    this.#cardMaterial.specularColor = Color3.Black();
    this.#cardMaterial.emissiveColor = Color3.White();
    this.#cardMaterial.disableLighting = true;
    this.#cardMaterial.useAlphaFromDiffuseTexture = true;
    this.#cardMaterial.diffuseTexture.hasAlpha = true;
    this.#cardMaterial.transparencyMode = StandardMaterial.MATERIAL_ALPHATEST;

    this.#cardMaterialTransparent = this.#cardMaterial.clone("cardMatTrans");
    this.#cardMaterialTransparent.alpha = 0.5;
    this.#cardMaterialTransparent.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;

    const cardBase = MeshBuilder.CreatePlane(
      "uno_card_base",
      { width: 0.86, height: 1.4 },
      this.#scene,
    );
    cardBase.isVisible = false;
    cardBase.material = this.#cardMaterial;

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
        mesh.material = this.#cardMaterial;
        mesh.makeGeometryUnique();
        setCardUV(mesh, n, row);
        mesh.isVisible = false;
        this.#unoDeck[name] = mesh;
      }
    }

    const wild = cardBase.clone("card_wild") as Mesh;
    wild.material = this.#cardMaterial;
    wild.makeGeometryUnique();
    setCardUV(wild, 1, 0);
    wild.isVisible = false;
    this.#unoDeck["card_wild"] = wild;

    const spawnPoints = this.#scene.transformNodes.filter((n) => /^card_spawn_point/.test(n.name));
    const secretSpawnPoints = this.#scene.transformNodes.filter((n) =>
      /^card_secret_spawn_point/.test(n.name),
    );

    this.#deckOfRegularUnoCardNames = this.buildDeckOfRegularCards(this.#unoDeck);
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
  }

  public getCardMaterial(): StandardMaterial {
    return this.#cardMaterial;
  }

  public getCardMaterialTransparent(): StandardMaterial {
    return this.#cardMaterialTransparent;
  }

  public getDeck(): UnoDeck {
    return this.#unoDeck;
  }

  public getDeckOfRegularCardNames(): string[] {
    return this.#deckOfRegularUnoCardNames;
  }

  public getGameState(): UnoGameState {
    return this.#gameState;
  }

  public checkCardIsMatchingPreviousCard(card: Mesh, previousToroCard: Mesh): boolean {
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

  public nextTurn(currentToro: Mesh): void {
    ++this.#gameState.turn;

    console.log("turn changed to", this.#gameState.turn);

    currentToro.material = this.#scene.getMaterialByName("colors_texture");

    const nextToro = this.#scene.getMeshByName("toro_gaming." + this.#gameState.turn);
    nextToro.material = this.#scene.getMaterialByName("colors_texture_blink");
    nextToro.edgesColor = new Color4(1, 1, 1, 1);
  }

  public async endGame(): Promise<boolean> {
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

  public attachCardToMesh(card: AbstractMesh, mesh: AbstractMesh): void {
    card.setParent(mesh);
    card.position = this.calcCardPosition(card, mesh);
    card.rotation.y = -(Math.PI * 90) / 180;
    card.metadata.isGrabbable = false; // don't grab attached card
    card.visibility = 1;

    this.#sounds.get("cardAttachedToToroSound").play({ volume: 1.5 });
  }

  public async opponentMove(currentToro: Mesh): Promise<void> {
    console.log("opponent move");

    let card;
    if (this.#gameState.turn === 1) {
      card = this.getRandomRegularCard();
    } else {
      const previousToro = this.#scene.getMeshByName(
        "toro_gaming." + (this.#gameState.turn - 1),
      ) as Mesh;
      const previousToroCard = previousToro.getChildren()[0] as Mesh;
      card = this.getNextMatchingCard(previousToroCard);
    }

    if (!card) {
      throw new Error("no matching card found. Bug");
    }

    const cardEndPosition = this.calcCardPosition(card, currentToro);
    const toroPosition = currentToro.position.clone();
    toroPosition.addInPlace(cardEndPosition);

    await this.animateCardFly(card, toroPosition);

    this.attachCardToMesh(card, currentToro);

    if (this.#gameState.turn !== 1 && this.#gameState.turn % 2 !== 0) {
      const randomIndex = Math.floor(Math.random() * this.#dragonTextReplicas.length);
      this.#dragonTextBlock.text = this.#dragonTextReplicas[randomIndex];
    }
  }

  public async startGame(): Promise<void> {
    this.#gameState.turn = 1;

    console.log("uno game started");

    this.#sounds.get("gardenIntroSound").play({ volume: 0.5 });

    const dragon = this.#scene.getMeshByName("dragon");
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
      const toroMesh = this.#scene.getMeshByName(name) as Mesh;
      const splittedName = name.split(".");
      toroMesh.metadata = {
        isSlot: true,
        slotNumber: Number(splittedName[1]),
      };
    });

    const currentToro = this.#scene.getMeshByName("toro_gaming.1") as Mesh;
    await this.opponentMove(currentToro);
    this.nextTurn(currentToro);
  }

  public shuffleDeckOfCardNames(cardNames: string[]): string[] {
    return cardNames
      .map((n) => ({ n, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map((o) => o.n);
  }

  private getNextMatchingCard(previousToroCard: Mesh): Mesh {
    const previousNumber = previousToroCard.metadata.number;
    const previousColor = previousToroCard.metadata.color;
    let matchingCard;

    // todo previousToroCard.metadata.type === "wild";
    if (previousToroCard.metadata.type === "wild") {
      matchingCard = this.getRandomRegularCard();
    }

    // same number but a different color
    if (!matchingCard) {
      matchingCard = this.#scene.meshes.find(
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
      matchingCard = this.#scene.meshes.find(
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
      matchingCard = this.#scene.meshes.find(
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

  private calcCardPosition(card: AbstractMesh, mesh: AbstractMesh): Vector3 {
    const maxY =
      mesh.getBoundingInfo().maximum.y + card.getBoundingInfo().boundingBox.maximum.y + 0.5;

    return new Vector3(0, maxY, 0);
  }

  private getRandomRegularCard(): Mesh {
    const regularUnoCards = this.#scene.meshes.filter(
      (mesh) =>
        /^card_(yellow|red|blue|green)_[0-9]_clone_\d+$/.test(mesh.name) &&
        mesh.isVisible &&
        mesh.parent === null, // not attached to toro and not is grabbed (grabbing use parenting)
    );
    const randomIndex = Math.floor(Math.random() * regularUnoCards.length);

    console.log("random uno card picked: ", regularUnoCards[randomIndex].name);

    return regularUnoCards[randomIndex] as Mesh;
  }

  private buildDeckOfRegularCards(unoDeck: { [name: string]: Mesh }): string[] {
    let cardNames: string[] = [];
    Object.keys(unoDeck).forEach((name) => {
      if (name !== "card_wild") {
        cardNames.push(name);
      }
    });

    return cardNames;
  }

  private async animateCardFly(card: Mesh, endPosition: Vector3): Promise<boolean> {
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

      this.#scene.beginAnimation(card, 0, frameRate, false, 0.5, () => {
        card.animations.pop();
        resolve(true);
      });
    });
  }
}
