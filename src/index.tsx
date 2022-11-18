import {
  createComputed,
  createEffect,
  createResource,
  createSignal,
  For,
  Index,
  onCleanup,
} from "solid-js";
import { Portal, render } from "solid-js/web";
import { fetchData } from "./fetch-data";

/*
 */

const SIDES = [
  {
    name: "left",
    coordVal: (rect: DOMRect) => rect.x + rect.width,
    overflow: (coordVal: number) => Math.round(coordVal - window.innerWidth),
    modifyWithCurrent: (current: number, overflow: number) =>
      overflow - current,
    prefix: "-",
  },
  {
    name: "left",
    coordVal: (rect: DOMRect) => rect.x,
    overflow: (coordVal: number) => coordVal * -1,
    modifyWithCurrent: (current: number, overflow: number) =>
      overflow + current,
    prefix: "",
  },
];

let animationDone = 0;

function animate(
  el: HTMLElement,
  ...args: Parameters<typeof document.body.animate>
) {
  animationDone =
    +new Date() + (args[1] as { duration?: number }).duration || 0;
  return el.animate(...args);
}

function isAnimationDone() {
  return +new Date() > animationDone;
}

export const POST_COUNT = 10;

function getInnerElementFromEvent(e: MouseEvent) {
  const elements = document.elementsFromPoint(e.clientX, e.clientY);
  const inner = elements.find((el) => el.classList.contains("inner"));
  return inner;
}

function getNonInlineStyle(el: HTMLElement, key: string) {
  const old = el.style[key];
  el.style[key] = "";
  const val = getComputedStyle(el)[key];
  el.style[key] = old;
  return val;
}

function Main() {
  // const [cards, { mutate: setCards }] = createResource(() =>
  //   Array.from({ length: 16 }).map(
  //     () => ({ flipped: false } as { flipped: boolean; elRef?: HTMLDivElement })
  //   )
  // );
  const [cards, setCards] = createSignal(
    Array.from({ length: 16 }).map(
      () => ({ flipped: false } as { flipped: boolean; elRef?: HTMLDivElement })
    )
  );
  const [matches, setMatches] =
    createSignal<[{ cardIndex: number }, { cardIndex: number }]>();

  const [selected, setSelected] = createSignal<number>();

  createComputed(() => {
    if (matches()?.length) {
      setCards((cards) => {
        cards[matches()[0].cardIndex] = {
          ...cards[matches()[0].cardIndex],
          flipped: true,
        };
        cards[matches()[1].cardIndex] = {
          ...cards[matches()[1].cardIndex],
          flipped: true,
        };
        return [...cards];
      });
    }
  });

  // Cleaning up matches
  createComputed(() => {
    const oldMatches = matches();
    onCleanup(() => {
      const isMatch = Math.random() > 0.5;
      oldMatches?.forEach(({ cardIndex }) => {
        if (isMatch) {
          animate(cards()[cardIndex].elRef.parentElement, [{ opacity: "0" }], {
            duration: 500,
            fill: "forwards",
          }).onfinish = () => {
            setCards((cards) => {
              cards[cardIndex] = {
                ...cards[cardIndex],
                flipped: false,
              };
              cards[cardIndex].elRef.remove();
              return [...cards];
            });
          };
        } else {
          const el = cards()[cardIndex].elRef.parentElement.parentElement;
          const top = getNonInlineStyle(el, "top");
          const left = getNonInlineStyle(el, "left");
          animate(el, [{ top, left }], { duration: 750 }).onfinish = () => {
            el.style.top = "";
            el.style.left = "";
          };
          setCards((cards) => {
            cards[cardIndex] = {
              ...cards[cardIndex],
              flipped: false,
            };
            return [...cards];
          });
        }
      });
    });
  });

  function setMatchesInCorrectOrder(i1: number, i2: number) {
    const card1 = cards()[i1];
    const card2 = cards()[i2];
    const { x: x1 } = card1.elRef.getBoundingClientRect();
    const { x: x2 } = card2.elRef.getBoundingClientRect();
    setMatches(
      x1 < x2
        ? [{ cardIndex: i1 }, { cardIndex: i2 }]
        : [{ cardIndex: i2 }, { cardIndex: i1 }]
    );
  }

  // const [data] = createResource(fetchData);

  function handleClick(e: MouseEvent) {
    if (!isAnimationDone()) {
      return;
    }

    // A match is displayed
    if (matches()?.length) {
      setMatches(undefined);
      return;
    }

    // One card is flipped
    const flippedCardI = cards().findIndex((c) => c.flipped);
    if (flippedCardI !== -1) {
      setCards((cards) => {
        cards[flippedCardI] = {
          ...cards[flippedCardI],
          flipped: false,
        };
        return [...cards];
      });
      setSelected(flippedCardI);
      return;
    }

    // The user clicked a non-flipped card
    const inner = getInnerElementFromEvent(e);
    if (inner) {
      const i = cards().findIndex((card) => card.elRef === inner);

      if (selected() === undefined) {
        setCards((cards) => {
          cards[i] = {
            ...cards[i],
            flipped: !cards[i].flipped,
          };
          return [...cards];
        });
      } else if (i !== selected()) {
        setMatchesInCorrectOrder(i, selected());
        setSelected(undefined);
      }
    }
  }

  let cardsRef: HTMLDivElement;

  return (
    <div>
      <Portal>
        <div
          class="overlay"
          classList={{ on: cards().some(({ flipped }) => flipped) }}
          onClick={handleClick}
        ></div>
      </Portal>
      <h1 class="title">
        <span>HN</span> Matching Pairs
      </h1>
      <div
        class="cards-outer"
        onmousemove={(
          e: MouseEvent & {
            sourceCapabilities?: { firesTouchEvents?: boolean };
          }
        ) => {
          if (
            !e?.sourceCapabilities?.firesTouchEvents &&
            getInnerElementFromEvent(e)
          ) {
            document.body.style.cursor = "pointer";
          } else {
            document.body.style.cursor = "";
          }
        }}
      >
        <div class="cards" ref={cardsRef}>
          <Index each={cards()}>
            {(data, i) => {
              let cardRef: HTMLDivElement;

              createEffect(() => {
                if (!matches()?.some((m) => m.cardIndex == i)) {
                  if (data().flipped) {
                    preventWindowOverflowAnimations(cardRef);
                    onCleanup(() => clearWindowOverlfowAnimations(cardRef));
                  }
                }
              });

              createEffect(() => {
                const matchIndex = matches()?.findIndex(
                  (m) => m.cardIndex == i
                );
                if (matchIndex !== undefined && matchIndex !== -1) {
                  matchAnimation(cardRef, data().elRef, matchIndex);
                }
              });

              return (
                <div class="card-outer" ref={cardRef} onClick={handleClick}>
                  <div
                    class="card"
                    classList={{
                      flipped: data().flipped,
                    }}
                  >
                    <div class="inner" ref={data().elRef}>
                      <div
                        class="front"
                        classList={{ selected: selected() == i }}
                      ></div>
                      <div class="back">
                        A whole buuunch of text here Lorem ipsum dolor sit amet
                        consectetur adipisicing elit. Lorem ipsum dolor sit
                        amet, consectetur adipisicing elit. Est dolorem earum
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          </Index>
        </div>
      </div>
    </div>
  );
}

function preventWindowOverflowAnimations(cardRef: HTMLElement) {
  SIDES.forEach(({ coordVal, modifyWithCurrent, name, overflow, prefix }) => {
    const rec = cardRef.getBoundingClientRect();
    const coordVal_ = coordVal(rec);
    const overflow_ = overflow(coordVal_);
    if (overflow_ > 0) {
      const current = parseInt(getNonInlineStyle(cardRef, name));
      const final = modifyWithCurrent(current, overflow_) + 5;
      const newVal = prefix + final + "px";
      animate(cardRef, [{ [name]: newVal }], {
        duration: 1000,
        iterations: 1,
      }).onfinish = () => (cardRef.style[name] = newVal);
    }
  });
}

function clearWindowOverlfowAnimations(cardRef: HTMLElement) {
  SIDES.forEach(({ name }) => {
    if (cardRef.style[name]) {
      const val = getNonInlineStyle(cardRef, name);
      animate(cardRef, [{ [name]: val }], {
        duration: 1000,
        iterations: 1,
      }).onfinish = () => (cardRef.style[name] = "");
    }
  });
}

function matchAnimation(
  cardRef: HTMLElement,
  innerRef: HTMLElement,
  matchI: number
) {
  let observer: ResizeObserver;
  onCleanup(() => observer?.disconnect());

  let first = true;
  const getTopAndLeft = () => {
    const { top: top_, left: left_ } = getComputedStyle(cardRef);
    let top = parseFloat(top_);
    const left = parseFloat(left_);
    let { width: cardWidth, height: cardHeight } =
      cardRef.getBoundingClientRect();
    let { width: innerWidth } = innerRef.getBoundingClientRect();
    const { x: innerX } = innerRef.getBoundingClientRect();
    const { y: cardY } = cardRef.getBoundingClientRect();

    // After the animation has ran for the first time, the cards have been scaled up
    // This is to ensure consistency in the calculations
    if (!first) {
      cardWidth *= 0.5;
      innerWidth *= 0.5;
    }
    first = false;

    // Calculating top
    const { y: containerY, height: containerHeight } =
      cardRef.parentElement.getBoundingClientRect();
    const targetY = containerHeight / 2 - cardHeight / 2 + containerY;
    const yDiff = cardY - targetY;
    const newTop = top - yDiff;

    const center_distance =
      window.innerWidth < 1600 ? window.innerWidth * 0.0225 : 10;

    // Calculating left
    const center = window.innerWidth / 2;
    let xDiff = innerX - (cardWidth - innerWidth) / 2 - center;
    if (matchI == 0) {
      xDiff += +innerWidth * 2 + center_distance;
    } else if (matchI == 1) {
      xDiff -= center_distance;
    }
    const newLeft = left - xDiff;

    return { top: `${newTop}px`, left: `${newLeft}px` };
  };

  animate(cardRef, [getTopAndLeft()], {
    duration: 1000,
    iterations: 1,
  }).onfinish = () => {
    const { top, left } = getTopAndLeft();
    cardRef.style.top = top;
    cardRef.style.left = left;
    observer = new ResizeObserver((entries) => {
      const { top, left } = getTopAndLeft();
      cardRef.style.top = top;
      cardRef.style.left = left;
    });
    observer.observe(document.body);
  };
}

const root = document.querySelector("#root");
render(() => <Main />, root);
const children = Array.from(root.children);
if (children.length === 2) {
  children[0].remove();
}

// Current top -98.9997
// Current Y 154.7109375
// Want to reach 400
// Y-reach-differ -245.2890625
// New top 146.28936249999998px

// Current top -98.9997
// Current Y 53.939353942871094
// Want to reach 400
// Y-reach-differ-346.0606460571289
// New top 247.0609460571289px
