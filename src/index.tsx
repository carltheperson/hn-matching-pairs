import {createComputed, createMemo, createResource, createSelector, createSignal, onCleanup, Show,} from "solid-js";
import {Portal, render} from "solid-js/web";
import {Card} from "./card";
import {EndPromt, LoadingPromt, MatchPromt} from "./promts";

/*
Things left:
 [x] Nail Solid JS
 [x] Switch to webstorm
 [ ] Comparision animation
 [ ] Account for `deleted: true`
 */

// type CardData = Awaited<ReturnType<typeof fetchData>>[number] & {
//   flipped?: boolean;
//   outOfGame: boolean;
//   elRef?: HTMLDivElement;
// };

export interface CardData {
  type: "post" | "comment";
  id: number;
  matchingId: number;
  text: string;
  flipped?: boolean;
  outOfGame?: boolean;
  elRef?: HTMLDivElement;
}

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
let animationBlocking = false;

function animate(
  el: HTMLElement,
  keyframes: Parameters<typeof document.body.animate>[0],
  options: KeyframeAnimationOptions & { blocking: boolean }
) {
  registerAnimation(options);
  return el.animate(keyframes, options);
}

function registerAnimation(
  options: KeyframeAnimationOptions & { blocking: boolean }
) {
  animationBlocking = options.blocking;
  animationDone = +new Date() + (options.duration as number) || 0;
}

function isAnimationBlocking() {
  if (!animationBlocking) {
    return false;
  }
  return +new Date() < animationDone;
}

export const POST_COUNT = 8;

function getInnerElementFromEvent(e: MouseEvent) {
  const elements = document.elementsFromPoint(e.clientX, e.clientY);
  const inner = elements.find((el) => el.classList.contains("inner"));
  return inner;
}

export function getNonInlineStyle(el: HTMLElement, key: string) {
  const old = el.style[key];
  el.style[key] = "";
  const val = getComputedStyle(el)[key];
  el.style[key] = old;
  return val;
}

function Main() {
  const [cards, {mutate: setCards}] = createResource(
    // () => fetchData().then(getShuffledArr) as Promise<CardData[]>
    () =>
      new Promise<Card[]>((r) =>
        setTimeout(
          () =>
            r(
              Array.from({length: 16}).map(
                () =>
                  ({outOfGame: false, text: "hi", type: "post"} as CardData)
              )
            ),
          500
        )
      )
  );

  const [matches, setMatches] =
    createSignal<[{ cardIndex: number }, { cardIndex: number }]>();

  const [selected, setSelected] = createSignal<number>();

  // createComputed(() => {
  //   if (matches()?.length) {
  //     setCards((cards) => {
  //       cards[matches()[0].cardIndex] = {
  //         ...cards[matches()[0].cardIndex],
  //         flipped: true,
  //       };
  //       cards[matches()[1].cardIndex] = {
  //         ...cards[matches()[1].cardIndex],
  //         flipped: true,
  //       };
  //       return [...cards];
  //     });
  //   }
  // });

  // Cleaning up matches
  createComputed(() => {
    const oldMatches = matches();
    onCleanup(() => {
      oldMatches?.forEach(({cardIndex}) => {
        if (isMatch(oldMatches, cards())) {
          animate(cards()[cardIndex].elRef.parentElement, [{opacity: "0"}], {
            duration: 500,
            blocking: false,
          }).onfinish = () => cards()[cardIndex].elRef.remove();
          setCards((cards) => {
            cards[cardIndex] = {
              ...cards[cardIndex],
              flipped: false,
              outOfGame: true,
            };
            return [...cards];
          });
        } else {
          const el = cards()[cardIndex].elRef.parentElement.parentElement;
          const top = getNonInlineStyle(el, "top");
          const left = getNonInlineStyle(el, "left");
          animate(el, [{top, left}], {
            duration: 750,
            blocking: false,
          }).onfinish = () => {
            el.style.top = "";
            el.style.left = "";
          };
          // Putting this in a timeout with no delay fixed a glitchy animation on Chrome \_(ツ)_/
          setTimeout(() => {
            setCards((cards) => {
              cards[cardIndex] = {
                ...cards[cardIndex],
                flipped: false,
              };
              return [...cards];
            });
          });
        }
      });
    });
  });

  // // Flip animation
  // createEffect(() => {
  //   if (cards()?.filter((c) => c.flipped).length === 1) {
  //     // The flip animations are kept in CSS, but they should still block the user from doing stuff while they run
  //     registerAnimation({ duration: 1000, blocking: true });
  //   }
  // });

  function setMatchesInCorrectOrder(i1: number, i2: number) {
    const card1 = cards()[i1];
    const card2 = cards()[i2];
    const {x: x1} = card1.elRef.getBoundingClientRect();
    const {x: x2} = card2.elRef.getBoundingClientRect();
    setMatches(
      x1 < x2
        ? [{cardIndex: i1}, {cardIndex: i2}]
        : [{cardIndex: i2}, {cardIndex: i1}]
    );
  }

  // const [data] = createResource(fetchData);

  function handleClick(e: MouseEvent) {
    return;
    if (isAnimationBlocking()) {
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

  const [rightComparedCard, setRightComparedCard] = createSignal<number | undefined>()
  const [leftComparedCard, setLeftComparedCard] = createSignal<number | undefined>()
  const isRightCompared = createSelector<number, number>(rightComparedCard)
  const isLeftCompared = createSelector<number, number>(leftComparedCard)

  const [selectedCard, setSelectedCard] = createSignal<number | null>(null);
  const isSelected = createSelector<number, number>(selectedCard);

  return (
    <div onClick={handleClick}>
      <h1 class="title">
        <span>HN</span> Matching Pairs
      </h1>
      <Show keyed={true} when={cards()?.length} fallback={LoadingPromt}>
        <Portal>
          <div
            class="overlay"
            classList={{on: cards().some(({flipped}) => flipped)}}
          ></div>
        </Portal>
        <div class="cards-outer">
          <div class="cards" ref={cardsRef}>
            <MatchPromt matches={matches} cards={cards}/>
            <EndPromt cards={cards}/>
            {cards().map((data, i) => {
              const [flipped, setFlipped] = createSignal<boolean>();

              const onFlipRequest = () => {
                if (flipped()) {
                  setSelectedCard(i);
                  setFlipped(false);
                  return;
                }
                if (selectedCard() === null) {
                  setFlipped(true);
                  return;
                }
                if (selectedCard() === i) {
                  return;
                }
                setRightComparedCard(i);
                setLeftComparedCard(selectedCard());
                setSelectedCard(null);
              };

              return (
                <Card
                  {...data}
                  selected={createMemo(() => isSelected(i))}
                  requestFlip={onFlipRequest}
                  flipped={flipped}
                  compared={createMemo(() => isRightCompared(i) ? "right" : isLeftCompared(i) ? "left" : false)}
                />
              );
            })}
          </div>
        </div>
      </Show>
    </div>
  );
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
    const {top: top_, left: left_} = getComputedStyle(cardRef);
    let top = parseFloat(top_);
    const left = parseFloat(left_);
    let {width: cardWidth, height: cardHeight} =
      cardRef.getBoundingClientRect();
    let {width: innerWidth} = innerRef.getBoundingClientRect();
    const {x: innerX} = innerRef.getBoundingClientRect();
    const {y: cardY} = cardRef.getBoundingClientRect();

    // After the animation has ran for the first time, the cards have been scaled up
    // This is to ensure consistency in the calculations
    if (!first) {
      cardWidth *= 0.5;
      innerWidth *= 0.5;
    }
    first = false;

    // Calculating top
    const {y: containerY, height: containerHeight} =
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

    return {top: `${newTop}px`, left: `${newLeft}px`};
  };

  animate(cardRef, [getTopAndLeft()], {
    duration: 1000,
    iterations: 1,
    blocking: true,
  }).onfinish = () => {
    const {top, left} = getTopAndLeft();
    cardRef.style.top = top;
    cardRef.style.left = left;
    observer = new ResizeObserver(() => {
      const {top, left} = getTopAndLeft();
      cardRef.style.top = top;
      cardRef.style.left = left;
    });
    observer.observe(document.body);
  };
}

// function blockFlipAnimationRightAfterLoad(e: Event) {
//   const el =
//   (e.target as HTMLElement).classList.add("block-flip")
//   setTimeout(() => {

//   }, 100)
// }

function isMatch(
  matches?: [{ cardIndex: number }, { cardIndex: number }],
  cards?: CardData[]
) {
  if (!matches || !cards) {
    return false;
  }
  return (
    cards[matches[0].cardIndex].matchingId === cards[matches[1].cardIndex].id
  );
}

const getShuffledArr = (arr) => {
  const newArr = arr.slice();
  for (let i = newArr.length - 1; i > 0; i--) {
    const rand = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[rand]] = [newArr[rand], newArr[i]];
  }
  return newArr;
};

const root = document.querySelector("#root");
render(() => <Main/>, root);
const children = Array.from(root.children);
if (children.length === 2) {
  children[0].remove();
}
