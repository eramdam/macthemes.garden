import { actions } from "astro:actions";
import { useCallback, useState } from "preact/hooks";
import { Fragment } from "preact/jsx-runtime";

interface LikeButtonProps {
  themeId: string;
  initialLike: boolean;
}
export function LikeButton(props: LikeButtonProps) {
  const [hasLiked, setHasLiked] = useState(props.initialLike);

  const onClickLike = useCallback(async () => {
    try {
      const currentHasLiked = hasLiked;
      const newLikeValue = !currentHasLiked;
      setHasLiked(newLikeValue);
      const { data, error } = await actions.toggleLike({
        themeId: props.themeId,
      });

      if (error) {
        setHasLiked(currentHasLiked);
        return;
      }

      setHasLiked(Boolean(data.liked));
      const likesCountElement = document.querySelector("[data-likes-count]");
      if (likesCountElement) {
        likesCountElement.textContent = data.likes.toString();
      }
    } catch (e) {}
  }, []);

  return (
    <Fragment>
      <a
        href="#"
        id="likeButton"
        data-themeid={props.themeId}
        onClick={(e) => {
          e.preventDefault();
          onClickLike();
        }}
      >
        <img
          src="/assets/finder-smile.png"
          style={{
            width: 16,
            height: 16,
            display: "inline-block",
            verticalAlign: "sub",
            marginRight: 4,
          }}
        />
        {hasLiked ? "Liked" : "Like"}
      </a>
    </Fragment>
  );
}
