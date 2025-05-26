import { useSignal } from "@preact/signals";
import { actions } from "astro:actions";
import { Fragment, type JSX } from "preact";
import { getPaletteForThemeId } from "../helpers/paletteHelpers";

export function ThemePaletteDebugger() {
  const themeThumbnail = useSignal("");
  const themePalette = useSignal<[number, number, number][]>([]);
  const themePaletteMatches = useSignal<
    undefined | Awaited<ReturnType<typeof getPaletteForThemeId>>
  >(undefined);

  const onSubmit: JSX.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const { data } = await actions.debugPalette({
      themeId: String(form.themeId.value).trim(),
    });

    if (data && data.palette) {
      themeThumbnail.value = data.thumbnail;
      themePalette.value = data.palette;
      getPaletteForThemeId.cache?.clear?.();
      themePaletteMatches.value = getPaletteForThemeId(
        String(form.themeId.value).trim(),
        data.palette,
      );
    }
  };

  return (
    <div>
      <form action="#" onSubmit={onSubmit}>
        <label htmlFor="themeId">Theme Id:</label>
        <input type="text" id="themeId" name="themeId" />

        <button type="submit">Get palette</button>
      </form>
      {themeThumbnail.value && <img src={themeThumbnail.value} alt="" />}

      {themePalette.value.length > 0 && (
        <Fragment>
          Raw palette:
          <ul
            style={{
              display: "flex",
              flexWrap: "wrap",
              listStyleType: "none",
              gap: 5,
            }}
          >
            {themePalette.value.map((color) => {
              return (
                <li>
                  <div
                    style={{
                      height: 20,
                      width: 20,
                      backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                      border: "1px solid black",
                    }}
                  ></div>
                </li>
              );
            })}
          </ul>
        </Fragment>
      )}
      {themePaletteMatches.value && themePaletteMatches.value.length > 0 && (
        <Fragment>
          Matched palette:
          <ul
            style={{
              display: "flex",
              flexWrap: "wrap",
              listStyleType: "none",
              gap: 5,
            }}
          >
            {themePaletteMatches.value.map((obj) => {
              const { hex } = obj;
              console.log(obj);
              return (
                <li>
                  <div
                    style={{
                      height: 20,
                      width: 20,
                      backgroundColor: hex,
                      border: "1px solid black",
                    }}
                  ></div>
                </li>
              );
            })}
          </ul>
        </Fragment>
      )}
    </div>
  );
}
