import { type ComponentChildren, type JSX } from "preact";
import "./OS9Button.scss";

type OS9ButtonProps =
  | ({
      asButton: true;
      children?: ComponentChildren;
    } & JSX.ButtonHTMLAttributes<HTMLButtonElement>)
  | ({
      asButton?: false | undefined;
      children: ComponentChildren;
    } & JSX.AnchorHTMLAttributes<HTMLAnchorElement>);

export function OS9Button({ children, ...attributes }: OS9ButtonProps) {
  const content = (
    <div className="grid">
      {Array.from({ length: 38 }).map((_, index) => (
        <div
          key={index}
          className="shadow"
          data-n={String(index + 1).padStart(2, "0")}
        />
      ))}
      <div className="bgd" data-n="1"></div>
      <div className="bgd" data-n="2"></div>
      <div className="bgd" data-n="3"></div>
      <div className="bgd" data-n="4"></div>
      <div className="label">{children}</div>
    </div>
  );

  if ("asButton" in attributes && attributes.asButton)
    return (
      <button className="button" {...attributes}>
        {content}
      </button>
    );

  return (
    <a className="button" {...attributes}>
      {content}
    </a>
  );
}
