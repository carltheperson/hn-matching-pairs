import {
  Accessor,
  createComputed,
  createContext,
  createEffect,
  createMemo,
  createReaction,
  createRenderEffect,
  createResource,
  createRoot,
  createSignal,
  createUniqueId,
  onCleanup,
  Setter,
} from "solid-js";
import { CardData, getNonInlineStyle } from ".";

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
    offStyles: createSignal(nonFlippedStyles)[0],
    onStyles: createSignal(flippedStyles)[0],
  });

  revartableAnimation({
    el: outer,
    animationState: outerAnimationState,
    setAnimationState: setOuterAnimationState,
    offStyles: createSignal(nonFlippedZIndexStyles)[0],
    onStyles: createSignal(flippedZIndexStyles)[0],
  });
}

const RIGHT_OVERFLOW = {
  coordVal: (x: number, width: number) => x + width,
  overflow: (coordVal: number) => coordVal - window.innerWidth,
  isOver: (overflow: number) => overflow > 0,
};

const LEFT_OVERFLOW = {
  coordVal: (rect: DOMRect) => rect.x,
  overflow: (coordVal: number) => coordVal,
  isOver: (overflow: number) => overflow < 0,
};

const OVERFLOW_SIDES = [RIGHT_OVERFLOW];

export async function registerOverflowPreventionAnimation(
  inner: HTMLElement,
  outer: HTMLElement,
  flipped: Accessor<boolean>
) {
  await new Promise((r) => setTimeout(r));
  const [animationState, setAnimationState] =
    createSignal<AnimationState>("ended");

  const [correctionAmount, setCorrectionAmount] = createSignal(0);
  const [defaultStyles] = createSignal({ left: "0px" });

  const getOverflow = ({
    overflow,
    coordVal,
  }: typeof OVERFLOW_SIDES[number]) => {
    const oldLeft = parseFloat(getComputedStyle(outer).left);
    const rect = outer.getBoundingClientRect();
    const calculatedOverflow = overflow(coordVal(rect.x - oldLeft, rect.width));
    return calculatedOverflow;
  };

  const calculateCorrectionAmount = () => {
    const overflowingSide = OVERFLOW_SIDES.find((side) =>
      side.isOver(getOverflow(side))
    );
    if (overflowingSide) {
      setCorrectionAmount(getOverflow(overflowingSide) * -1);
    } else {
      setCorrectionAmount(0);
    }
  };

  createEffect(() => {
    if (flipped() === undefined) {
      return;
    }
    if (flipped()) {
      setAnimationState("to-start");
    } else if (!flipped()) {
      setAnimationState("to-end");
    }
  });

  calculateCorrectionAmount();

  revartableAnimation({
    el: outer,
    animationState,
    offStyles: defaultStyles,
    onStyles: createMemo(() => ({
      left: `${correctionAmount()}px`,
    })),
    setAnimationState,
  });

  const observer = new ResizeObserver(() => {
    calculateCorrectionAmount();
  });
  observer.observe(document.body);
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
  onStyles: Accessor<Record<string, string>>;
  offStyles: Accessor<Record<string, string>>;
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
      animation = el.animate([{}, onStyles()], ANIMATIONS_OPS);
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

      animation = el.animate([{}, offStyles()], ANIMATIONS_OPS);
      animation.towards = "ended";
      const scopedAnimation = animation;
      animation.onfinish = () => {
        if (scopedAnimation == animation) {
          animation = null;
          setAnimationState("ended");
        }
      };
    } else if (animationState() == "started") {
      applyStyles(el, onStyles());
    } else if (animationState() == "ended") {
      applyStyles(el, offStyles());
      console.log("Ended");
    }
  });
}
