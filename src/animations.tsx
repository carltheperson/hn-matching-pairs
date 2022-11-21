import {
  Accessor,
  createComputed,
  createContext,
  createEffect,
  createReaction,
  createRenderEffect,
  createResource,
  createRoot,
  createSignal,
  createUniqueId,
  onCleanup,
  Setter,
} from "solid-js";
import { CardData } from ".";

// Animations

// # Card
// - Flip x
// - Flip back x
// - Avoid overflow
// - Avoid overflow back

// # Comparison
// - Compare
// - Compare back
// - Remove compared cards

const scale = "0.5";

const FLIP_DURATION = 1000;
const ANIMATIONS_OPS = {
  duration: FLIP_DURATION,
};

const nonFlippedStyles = { transform: `rotateY(0) scale(${scale})` };
const flippedStyles = { transform: "rotateY(180deg) scale(1)" };
const nonFlippedZIndexStyles = { zIndex: "1" };
const flippedZIndexStyles = {
  // get zIndex() {
  //   return +new Date() + "";
  // },
  zIndex: "100",
};

function applyStyles(el: HTMLElement, styles: Record<string, string>) {
  Object.entries(styles).forEach(([key, val]) => (el.style[key] = val));
}

export type AnimationState = "ended" | "started" | "to-end" | "to-start";

// Create a util called revartable animation
export function registerFlipAnimation(
  inner: HTMLElement,
  outer: HTMLElement,
  flipped: Accessor<boolean>
) {
  const [innerAnimationState, setInnerAnimationState] =
    createSignal<AnimationState>("ended");
  const [outerAnimationState, setOuterAnimationState] =
    createSignal<AnimationState>("ended");

  const setBoth = (val: AnimationState) => {
    setInnerAnimationState(val);
    setOuterAnimationState(val);
  };

  createEffect(() => {
    if (flipped() === undefined) {
      return;
    }
    if (flipped()) {
      setBoth("to-start");
    } else if (!flipped()) {
      setBoth("to-end");
    }
  });

  revartableAnimation({
    el: inner,
    animationState: innerAnimationState,
    setAnimationState: setInnerAnimationState,
    offStyles: nonFlippedStyles,
    onStyles: flippedStyles,
  });

  revartableAnimation({
    el: outer,
    animationState: outerAnimationState,
    setAnimationState: setOuterAnimationState,
    offStyles: nonFlippedZIndexStyles,
    onStyles: flippedZIndexStyles,
  });
}

function revartableAnimation({
  el,
  animationState,
  setAnimationState,
  onStyles,
  offStyles,
}: {
  el: HTMLElement;
  animationState: Accessor<AnimationState>;
  setAnimationState: Setter<AnimationState>;
  onStyles: Record<string, string>;
  offStyles: Record<string, string>;
}) {
  let animation: Animation & { towards?: AnimationState };

  createEffect(() => {
    if (animationState() == "to-start") {
      if (animation && animation.towards == "ended") {
        animation.playbackRate = -1; // This will play back the animation aka "revert" it
        const scopedAnimation = animation;
        animation.onfinish = () => {
          if (animation == scopedAnimation) {
            animation = null;
            setAnimationState("started");
          }
        };
        return;
      }
      animation = el.animate([{}, onStyles], ANIMATIONS_OPS);
      animation.towards = "started";
      const scopedAnimation = animation;
      animation.onfinish = () => {
        if (scopedAnimation == animation) {
          animation = null;
          setAnimationState("started");
        }
      };
    } else if (animationState() == "to-end") {
      if (animation && animation.towards == "started") {
        animation.playbackRate = -1; // This will play back the animation aka "revert" it
        const scopedAnimation = animation;
        animation.onfinish = () => {
          if (scopedAnimation == animation) {
            animation = null;
            setAnimationState("ended");
          }
        };
        return;
      }

      animation = el.animate([{}, offStyles], ANIMATIONS_OPS);
      animation.towards = "ended";
      const scopedAnimation = animation;
      animation.onfinish = () => {
        if (scopedAnimation == animation) {
          animation = null;
          setAnimationState("ended");
        }
      };
    } else if (animationState() == "started") {
      applyStyles(el, onStyles);
    } else if (animationState() == "ended") {
      applyStyles(el, offStyles);
    }
  });
}
