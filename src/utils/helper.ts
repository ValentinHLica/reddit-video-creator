import { ScrollAnimationHandler } from "../interface/helper";
import { TextComment } from "../interface/post";

/**
 * Roundup number to 1k, 1M ...
 * @param number Number to Roundup
 * @returns Rounded number
 */
export const roundUp = (number: number): string => {
  const newStr = ("" + number)
    .split("")
    .reverse()
    .join("")
    .match(/.{1,3}/g) as string[];

  return `${newStr[newStr.length - 1].split("").reverse().join("")}${
    " kmgtpe"[newStr.length - 1]
  }`;
};

/**
 * Calculate scroll effect on comments
 */
export const scrollAnimationHandler: ScrollAnimationHandler = ({
  container,
  comments,
  durationInFrames,
}) => {
  if (container.current) {
    const layout = (
      document.querySelector(".layout__container") as HTMLDivElement
    ).getBoundingClientRect();
    let count: number = 0;
    let frame: number[] = [];
    let animation: number[] = [];
    const inFrameHeight = layout.height - layout.height / 3;

    const commentsList = container.current.querySelectorAll("li.comment");
    const topMargin = container.current.getBoundingClientRect().top;

    for (
      let commentIndex = 0;
      commentIndex < commentsList.length;
      commentIndex++
    ) {
      const comment = commentsList[commentIndex];

      const content = comment.querySelector(
        "span.calc__content"
      ) as HTMLSpanElement;

      const body = comments[commentIndex].body as TextComment[];

      for (let textIndex = 0; textIndex < body.length; textIndex++) {
        content.textContent = body
          .slice(0, textIndex)
          .map((e) => e.text)
          .join(" ");

        const { height, top } = content.getBoundingClientRect();

        const inFrame =
          inFrameHeight * count + inFrameHeight - (count > 0 ? topMargin : 0);

        if (height + top > inFrame) {
          const frames = body[textIndex].frames as [number, number];
          frame.push(frames[0] - 1, frames[0]);

          animation.push(
            count === 0 ? 0 : (animation.at(-1) as number),
            inFrame
          );

          count++;
        }
      }
    }

    frame.push((frame.at(-1) as number) + 1, durationInFrames);
    const lastAnimation = animation.at(-1) as number;
    animation.push(lastAnimation, lastAnimation);

    if (frame.length > 1) return [frame, animation];
  }

  return [
    [0, 1],
    [0, 0],
  ];
};
