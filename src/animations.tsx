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
  onCleanup,
  Setter,
} from "solid-js";
import { CardData } from ".";

// Animations

// # Card
// - Flip
// - Flip back
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

const nonFlippedStyles = [{ transform: `rotateY(0) scale(${scale})` }];

type Frame = {
  property: string;
};

const flippedStyles = [
  { transform: "rotateY(180deg) scale(1)" },
  // { boxShadow: "0 0 25px rgba(0, 0, 0, 0.25)" },
];

function applyStyles(el: HTMLElement, styles: Record<string, string>[]) {
  styles.forEach((obj) => {
    const [[key, val]] = Object.entries(obj);
    el.style[key] = val;
  });
}

function clearStyles(el: HTMLElement, styles: Record<string, string>[]) {
  styles.forEach((obj) => {
    const [key] = Object.keys(obj);
    el.style[key] = "";
  });
}

function getCurrentVersionOfStyles(
  el: HTMLElement,
  styles: Record<string, string>[]
) {
  const keys = Object.keys(styles[0]);
  const style = getComputedStyle(el);
  const r = [
    Object.entries(style)
      .filter(([key]) => keys.includes(key))
      .reduce((acc, [key, value]) => {
        return {
          ...acc,
          [key]: value,
        };
      }, {}),
  ];
  console.log(JSON.stringify(r));
  return [{ r }];
}

export type FlipAnimation = "ended" | "started" | "to-end" | "to-start";

// Create a util called revartable animation
export function registerFlipAnimation(
  el: HTMLElement,
  flipped: Accessor<boolean>
) {
  const [flipAnimation, setFlipAnimation] =
    createSignal<FlipAnimation>("ended");

  createEffect(() => {
    const animationState = createRoot(() => flipAnimation());
    if (flipped() === undefined) {
      return;
    }
    if (flipped()) {
      setFlipAnimation("to-start");
    } else if (!flipped()) {
      setFlipAnimation("to-end");
    }
  });

  let animation: Animation & { towards?: FlipAnimation };
  createEffect(() => {
    // An animation should start
    if (flipAnimation() == "to-start") {
      if (animation && animation.towards == "ended") {
        animation.playbackRate = -1; // This will play back the animation aka "revert" it
        const scopeAnimation = animation;
        animation.onfinish = () => {
          if (animation == scopeAnimation) {
            animation = null;
            setFlipAnimation("started");
          }
        };
        return;
      }

      const scopeAnimation = el.animate([{}, ...flippedStyles], ANIMATIONS_OPS);
      animation = scopeAnimation;
      animation.towards = "started";
      animation.onfinish = () => {
        if (animation == scopeAnimation) {
          animation = null;
          setFlipAnimation("started");
        }
      };
      // An animation should end
    } else if (flipAnimation() == "to-end") {
      if (animation && animation.towards == "started") {
        animation.playbackRate = -1; // This will play back the animation aka "revert" it
        const scopeAnimation = animation;
        animation.onfinish = () => {
          if (animation == scopeAnimation) {
            animation = null;
            setFlipAnimation("ended");
          }
        };
        return;
      }

      const scopeAnimation = el.animate(
        [{}, ...nonFlippedStyles],
        ANIMATIONS_OPS
      );
      animation = scopeAnimation;
      animation.towards = "ended";
      animation.onfinish = () => {
        if (animation == scopeAnimation) {
          animation = null;
          setFlipAnimation("ended");
        }
      };
    } else if (flipAnimation() == "started") {
      applyStyles(el, flippedStyles);
    } else if (flipAnimation() == "ended") {
      applyStyles(el, nonFlippedStyles);
    }
  });
}
