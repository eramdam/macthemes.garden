import rawPaletteData from "../themes/palettes.json" with { type: "json" };

import * as colorDiff from "color-diff";
import { isEqual, memoize, shuffle, uniqBy } from "lodash-es";
import {
  parseToRgb,
  rgbToColorString,
  saturate,
  toColorString,
} from "polished";
import type { RgbPixel } from "quantize";

const paletteData = rawPaletteData as unknown as Record<string, RgbPixel[]>;

const debug = false;

function log(message?: any, ...opts: any[]) {
  if (debug) {
    console.log(message, ...opts);
  }
}

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

export function findNameForPaletteColor(color: colorDiff.LabColor) {
  const matchedIndex = targetPaletteColorsLab.findIndex((targetLab) => {
    return isEqual(targetLab, color);
  });
  if (matchedIndex < 0) {
    return undefined;
  }
  return targetPaletteColors[matchedIndex][1];
}

export function findHexForPaletteColor(color: colorDiff.LabColor) {
  const matchedIndex = targetPaletteColorsLab.findIndex((targetLab) => {
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
            hex: toColorString({
              red: rawPaletteColor[0],
              green: rawPaletteColor[1],
              blue: rawPaletteColor[2],
            }),
            name: toColorString({
              red: rawPaletteColor[0],
              green: rawPaletteColor[1],
              blue: rawPaletteColor[2],
            }),
          } as const;
        }

        const rawColorLab = colorDiff.rgb_to_lab({
          R: rawPaletteColor[0],
          G: rawPaletteColor[1],
          B: rawPaletteColor[2],
        });

        let closestLab = colorDiff.closest_lab(
          rawColorLab,
          targetPaletteColorsLab,
        );
        let diff = colorDiff.diff(closestLab, rawColorLab);
        let fixed = false;

        // If diff is too high, increase the saturation a bit to get a "better" (more natural) match
        if (diff > 10) {
          const rawPaletteColorString = rgbToColorString({
            red: rawPaletteColor[0],
            green: rawPaletteColor[1],
            blue: rawPaletteColor[2],
          });
          log("Correcting ", {
            name: findNameForPaletteColor(closestLab),
            diff,
            string: rawPaletteColorString,
          });

          const saturated = parseToRgb(saturate(0.3, rawPaletteColorString));
          const newClosestLab = colorDiff.closest_lab(
            colorDiff.rgb_to_lab({
              R: saturated.red,
              G: saturated.green,
              B: saturated.blue,
            }),
            targetPaletteColorsLab,
          );
          // If we got a different match, then we fixed it.
          if (!isEqual(closestLab, newClosestLab)) {
            closestLab = newClosestLab;
            diff = colorDiff.diff(closestLab, rawColorLab);
            fixed = true;
            log("Fixed ", {
              name: findNameForPaletteColor(closestLab),
              diff,
              string: rgbToColorString({
                red: rawPaletteColor[0],
                green: rawPaletteColor[1],
                blue: rawPaletteColor[2],
              }),
            });
          }
        }

        return {
          fixed,
          diff,
          color: closestLab,
          rawPaletteColor,
          hex: findHexForPaletteColor(closestLab),
          name: findNameForPaletteColor(closestLab),
        } as const;
      })
      .filter((c) => c.diff < 15 || c.fixed),
    (c) => c.name,
  );
}

export const getPaletteForThemeId = memoize(_getPaletteForThemeId);
