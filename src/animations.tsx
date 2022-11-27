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

const ANIMATION_REVERSIAL_SPEED = 1.5

const FLIP_DURATION = 750;
const ANIMATIONS_OPS = {
  duration: FLIP_DURATION,
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
  const nonFlippedStyles = {transform: `rotateY(0) scale(${scale})`};
  const flippedStyles = {transform: "rotateY(180deg) scale(1)"};
  const nonFlippedZIndexStyles = {zIndex: "1"};
  const flippedZIndexStyles = {zIndex: "100"};

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

export function registerOverflowPreventionAnimation(
  card: HTMLElement,
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

const COMPARISON_GAB = () => window.innerWidth < 1000 ? window.innerWidth * 0.0225 : 10

export function registerComparisonAnimation(
  card: HTMLElement,
  cardsContainer: HTMLElement,
  side: Accessor<"left" | "right" | false>,
  animationState: Accessor<AnimationState>,
  setAnimationState: Setter<AnimationState>
) {
  const [offStyles] = createSignal({transform: "translate(0px, 0px)"});
  const [centerStyles, setCenterStyles] = createSignal({transform: ""});

  const nonNullSide = createMemo(old => side() || old)

  const calculateCenterStyles = () => {
    const old = card.style.transform;
    card.style.transform = "";
    const {width, height, x, y} = card.getBoundingClientRect();
    card.style.transform = old;
    const {
      width: containerWidth,
      height: containerHeight,
      x: containerX,
      y: containerY
    } = cardsContainer.getBoundingClientRect()
    const targetY = (containerHeight / 2 + containerY) - height / 2;
    const newY = y - targetY;
    const targetX = (containerWidth / 2 + containerX) - (nonNullSide() === "left" ? width : 0) + ((nonNullSide() === "left" ? -1 : 1) * COMPARISON_GAB());
    const newX = x - targetX;
    setCenterStyles({transform: `translate(${newX * -1}px, ${newY * -1}px)`});
  }

  createComputed(() => {
    calculateCenterStyles();
  })

  revertibleAnimation({
    el: card,
    animationState,
    setAnimationState,
    onStyles: centerStyles,
    offStyles,
  })

  const observer = new ResizeObserver(calculateCenterStyles);
  observer.observe(document.body, {});
}

export function registerOutOfGameAnimation(el: HTMLElement, outOfGameAnimationState: Accessor<boolean>) {
  createEffect(() => {
    if (outOfGameAnimationState()) {
      // This animation is one-way. Once you're out, you're out
      el.animate([{opacity: "1"}, {opacity: "0"}], {duration: FLIP_DURATION}).onfinish = () => {
        el.remove()
      }
    }
  })
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
        animation.playbackRate = -ANIMATION_REVERSIAL_SPEED; // This will play back the animation aka "revert" it
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
        animation.playbackRate = -ANIMATION_REVERSIAL_SPEED; // This will play back the animation aka "revert" it
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
