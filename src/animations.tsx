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
  onCleanup, onMount,
  Setter,
} from "solid-js";
import {CardData, getNonInlineStyle} from ".";

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

const nonFlippedStyles = {transform: `rotateY(0) scale(${scale})`};
const flippedStyles = {transform: "rotateY(180deg) scale(1)"};
const nonFlippedZIndexStyles = {zIndex: "1"};
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
  animationState: Accessor<AnimationState>,
  setAnimationState: Setter<AnimationState>
) {

  revertibleAnimation({
    el: inner,
    animationState,
    setAnimationState,
    offStyles: createSignal(nonFlippedStyles)[0],
    onStyles: createSignal(flippedStyles)[0],
  });

  revertibleAnimation({
    el: outer,
    animationState,
    setAnimationState: () => undefined,
    offStyles: createSignal(nonFlippedZIndexStyles)[0],
    onStyles: createSignal(flippedZIndexStyles)[0],
  });

  return [animationState, setAnimationState] as const;
}

const OVERFLOW_BUFFER = 4; // px

const RIGHT_OVERFLOW = {
  coordVal: (x: number, width: number) => x + width + OVERFLOW_BUFFER,
  overflow: (coordVal: number) => coordVal - window.innerWidth,
  isOver: (overflow: number) => overflow > 0,
};

const LEFT_OVERFLOW = {
  coordVal: (x: number) => x - OVERFLOW_BUFFER,
  overflow: (coordVal: number) => coordVal,
  isOver: (overflow: number) => overflow < 0,
};

const OVERFLOW_SIDES = [LEFT_OVERFLOW, RIGHT_OVERFLOW];

export async function registerOverflowPreventionAnimation(
  card: HTMLElement,
  flipped: Accessor<boolean>,
  animationState: Accessor<AnimationState>,
  setAnimationState: Setter<AnimationState>
) {
  const [correctionAmount, setCorrectionAmount] = createSignal(0);
  const [defaultStyles] = createSignal({left: "0px"});

  const getOverflow = ({
                         overflow,
                         coordVal,
                       }: typeof OVERFLOW_SIDES[number]) => {
    const oldLeft = parseFloat(getComputedStyle(card).left);
    const rect = card.getBoundingClientRect();
    return overflow(coordVal(rect.x - oldLeft, rect.width));
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

  revertibleAnimation({
    el: card,
    animationState,
    offStyles: defaultStyles,
    onStyles: createMemo(() => ({
      left: `${correctionAmount()}px`,
    })),
    setAnimationState,
  });

  const observer = new ResizeObserver(calculateCorrectionAmount);

  observer.observe(document.body);
}

function revertibleAnimation({
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
    }
  });
}
