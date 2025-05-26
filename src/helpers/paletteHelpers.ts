import rawPaletteData from "../themes/palettes.json" with { type: "json" };

import * as colorDiff from "color-diff";
import { isEqual, memoize, uniqBy } from "lodash-es";
import { parseToRgb, toColorString } from "polished";
import type { RgbPixel } from "quantize";

const paletteData = rawPaletteData as unknown as Record<string, RgbPixel[]>;

// https://www.kreativekorp.com/moccp/#Mac-OS-X-Crayons
export const OSXPaletteColors = [
  ["#000000", "Licorice"],
  ["#191919", "Lead"],
  ["#333333", "Tungsten"],
  ["#4c4c4c", "Iron"],
  ["#666666", "Steel"],
  ["#7f7f7f", "Tin"],
  ["#808080", "Nickel"],
  ["#999999", "Aluminum"],
  ["#b3b3b3", "Magnesium"],
  ["#cccccc", "Silver"],
  ["#e6e6e6", "Mercury"],
  ["#ffffff", "Snow"],

  ["#800000", "Cayenne"],
  ["#804000", "Mocha"],
  ["#808000", "Asparagus"],
  ["#408000", "Fern"],
  ["#008000", "Clover"],
  ["#008040", "Moss"],
  ["#008080", "Teal"],
  ["#004080", "Ocean"],
  ["#000080", "Midnight"],
  ["#400080", "Eggplant"],
  ["#800080", "Plum"],
  ["#800040", "Maroon"],

  ["#ff0000", "Maraschino"],
  ["#ff8000", "Tangerine"],
  ["#ffff00", "Lemon"],
  ["#80ff00", "Lime"],
  ["#00ff00", "Spring"],
  ["#00ff80", "Sea Foam"],
  ["#00ffff", "Turquoise"],
  ["#0080ff", "Aqua"],
  ["#0000ff", "Blueberry"],
  ["#8000ff", "Grape"],
  ["#ff00ff", "Magenta"],
  ["#ff0080", "Strawberry"],

  ["#ff6666", "Salmon"],
  ["#ffcc66", "Cantaloupe"],
  ["#ffff66", "Banana"],
  ["#ccff66", "Honeydew"],
  ["#66ff66", "Flora"],
  ["#66ffcc", "Spindrift"],
  ["#66ffff", "Ice"],
  ["#66ccff", "Sky"],
  ["#6666ff", "Orchid"],
  ["#cc66ff", "Lavender"],
  ["#ff66ff", "Bubblegum"],
  ["#ff70cf", "Carnation"],
] as const;

// https://www.kreativekorp.com/moccp/#Mac-OS-Classic-Crayons
export const ClassicPaletteColors = [
  ["#ffffff", "Chalk"],
  ["#eeeeee", "Marble"],
  ["#cccccc", "Soapstone"],
  ["#aaaaaa", "Concrete"],
  ["#888888", "Granite"],
  ["#777777", "Flint"],
  ["#555555", "Shale"],
  ["#333333", "Gabbro"],
  ["#222222", "Basalt"],
  ["#000000", "Obsidian"],

  ["#7465dc", "Violet Dusk"],
  ["#5b87f2", "Sky Blue"],
  ["#62d6ac", "Ocean Green"],
  ["#5fbd71", "Spring Frost"],
  ["#7e835b", "Mildew"],
  ["#e6e658", "Mustard"],
  ["#ffbf56", "Canteloupe"],
  ["#f87b57", "Tulip"],
  ["#da456b", "Carnation"],
  ["#bb56c3", "Orchid"],

  ["#8154d1", "Pale Violet"],
  ["#6876e7", "Evening Blue"],
  ["#5dbaca", "Fog"],
  ["#60ca8e", "Chlorine"],
  ["#71985e", "Moss"],
  ["#b2b459", "Olive"],
  ["#ffe957", "Banana"],
  ["#ff9456", "Grapefruit"],
  ["#f06157", "Salmon"],
  ["#dc54ad", "Grape"],

  ["#5918bb", "Violet"],
  ["#1822cd", "Blue"],
  ["#18605a", "Seaweed"],
  ["#2f8b20", "Clover"],
  ["#8cbc1c", "Cactus"],
  ["#ffea18", "Lemon"],
  ["#ffaf18", "Tangerine"],
  ["#ff7518", "Melon"],
  ["#f63f1b", "Red Orange"],
  ["#ed181e", "Red"],

  ["#6c18b0", "Royal Violet"],
  ["#4618c6", "Blue Violet"],
  ["#184b81", "Sea Blue"],
  ["#187534", "Pine"],
  ["#5da31e", "Fern"],
  ["#bad41a", "Watercress"],
  ["#ffcc18", "Marigold"],
  ["#ff9218", "Orange"],
  ["#fa4e19", "Fire"],
  ["#ef1f1d", "Apple"],

  ["#291a10", "Sepia"],
  ["#5b3d23", "Raw Sienna"],
  ["#8c6137", "Dirt"],
  ["#be844a", "Tan"],
  ["#cdc7c1", "Warm Marble"],
  ["#8c8073", "Warm Granite"],
  ["#3e3832", "Warm Shale"],
  ["#c1c1cd", "Cool Marble"],
  ["#73738c", "Cool Granite"],
  ["#32323e", "Cool Shale"],
] as const;

export const targetPaletteColors = ClassicPaletteColors;

const targetPaletteColorsRgb = targetPaletteColors.map(([color]) => {
  const rgb = parseToRgb(color);
  return {
    R: rgb.red,
    G: rgb.green,
    B: rgb.blue,
  };
});

export const targetPaletteColorsLab = targetPaletteColorsRgb.map(
  colorDiff.rgb_to_lab,
);

export function findNameForPaletteColor(color: colorDiff.RGBColor) {
  const matchedIndex = targetPaletteColorsRgb.findIndex((targetLab) => {
    return isEqual(targetLab, color);
  });
  if (matchedIndex < 0) {
    return undefined;
  }
  return targetPaletteColors[matchedIndex][1];
}

export function findHexForPaletteColor(color: colorDiff.RGBColor) {
  const matchedIndex = targetPaletteColorsRgb.findIndex((targetLab) => {
    return isEqual(targetLab, color);
  });
  if (matchedIndex < 0) {
    return undefined;
  }
  return targetPaletteColors[matchedIndex][0];
}

function _getPaletteForThemeId(
  themeId: string,
  rawPaletteColors = paletteData[themeId],
) {
  if (!rawPaletteColors) {
    return undefined;
  }

  return uniqBy(
    rawPaletteColors
      .map((rawPaletteColor) => {
        const useRaw = false;
        if (useRaw) {
          return {
            diff: 0,
            color: {
              R: rawPaletteColor[0],
              G: rawPaletteColor[1],
              B: rawPaletteColor[2],
            },
            name: toColorString({
              red: rawPaletteColor[0],
              green: rawPaletteColor[1],
              blue: rawPaletteColor[2],
            }),
          } as const;
        }

        const closest = colorDiff.closest(
          {
            R: rawPaletteColor[0],
            G: rawPaletteColor[1],
            B: rawPaletteColor[2],
          },
          targetPaletteColorsRgb,
        );

        return {
          color: closest,
          rawPaletteColor,
          hex: findHexForPaletteColor(closest),
          name: findNameForPaletteColor(closest),
        } as const;
      })
      .filter(Boolean)
      .slice(0, 6),
    (c) => c.name,
  );
}

export const getPaletteForThemeId = memoize(_getPaletteForThemeId);
