import { useCallback, useEffect, useState } from "preact/hooks";
import { actions } from "astro:actions";
import { Fragment } from "preact/jsx-runtime";
import { getLocalLike, setLocalLike } from "../helpers/storageHelpers";

interface LikeButtonProps {
  themeId: string;
}
export function LikeButton(props: LikeButtonProps) {
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    const localLike = getLocalLike(props.themeId);

    setHasLiked(localLike);
  }, []);

  const onClickLike = useCallback(async () => {
    try {
      const currentHasLiked = hasLiked;
      const newLikeValue = !currentHasLiked;
      console.log({ newLikeValue });
      setHasLiked(newLikeValue);
      setLocalLike(props.themeId, newLikeValue);
      const { data, error } = await actions.toggleLike({
        themeId: props.themeId,
      });
      console.log(data);

      if (error) {
        setHasLiked(currentHasLiked);
        return;
      }

      setHasLiked(Boolean(data.liked));
    } catch (e) {}
  }, []);

  return (
    <Fragment>
      <a
        href="#"
        id="likeButton"
        data-themeid={props.themeId}
        onClick={onClickLike}
      >
        {hasLiked ? "Liked" : "Like"}
      </a>
    </Fragment>
  );
}
