import unoGardenScenePreview from "../assets/images/uno_garden_scene_preview.webp";

export const getSceneNameFromURI = (): string | undefined =>
  location.search.split("scene=")[1]?.split("&")[0] || undefined;

export function setFavicon(href: string, rel: string) {
  const link = document.createElement("link");
  link.rel = rel;
  link.type = "image/png";
  link.href = href;

  const head = document.head;
  const existing = head.querySelectorAll(`link[rel="${rel}"]`);
  existing.forEach((e) => head.removeChild(e));
  head.appendChild(link);
}

const originalSceneList = [
  {
    name: "unoGarden",
    previewName: "UNO Garden",
    preview: unoGardenScenePreview,
  },
];

export const BUILD_SCENE_LIST: string[] = import.meta.env.VITE_APP_BUILD_SCENE_LIST.split(",");
export const PLAYABLE_SCENES = originalSceneList.filter((s) => BUILD_SCENE_LIST.includes(s.name));
