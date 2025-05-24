import { useSignal } from "@preact/signals";
import { actions } from "astro:actions";
import { type JSX } from "preact";

export function ThemePaletteDebugger() {
  const themeThumbnail = useSignal("");
  const themePalette = useSignal<[number, number, number][]>([]);

  const onSubmit: JSX.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    console.log("aaaaaa");
    const form = e.target as HTMLFormElement;
    console.log(form.themeId.value);
    const { data } = await actions.debugPalette({
      themeId: String(form.themeId.value).trim(),
    });

    if (data && data.palette) {
      themeThumbnail.value = data.thumbnail;
      themePalette.value = data.palette;
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
        <ul>
          {themePalette.value.map((color) => {
            return (
              <li>
                <div
                  style={{
                    height: 20,
                    width: 20,
                    backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                  }}
                ></div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
