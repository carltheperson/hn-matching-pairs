import {
  createComputed,
  createEffect,
  createMemo,
  createResource,
  createSelector,
  createSignal,
  onCleanup,
  Show,
} from "solid-js";
import {Portal, render} from "solid-js/web";
import {Card} from "./card";
import {EndPromt, LoadingPromt, MatchPromt} from "./promts";

/*
Things left:
 [x] Nail Solid JS
 [x] Switch to webstorm
 [x] Comparision animation
 [ ] Account for `deleted: true`
 */

export interface CardData {
  type: "post" | "comment";
  id: number;
  matchingId: number;
  text: string;
  outOfGame?: boolean;
  elRef?: HTMLDivElement;
}

function Main() {
  const [cards, {mutate: setCards}] = createResource(
    // () => fetchData().then(getShuffledArr) as Promise<CardData[]>
    () =>
      new Promise<CardData[]>((r) =>
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

  const cardsRefs: HTMLDivElement[] = []

  const [rightComparedCard, setRightComparedCard] = createSignal<number | null>(null)
  const [leftComparedCard, setLeftComparedCard] = createSignal<number | null>(null)
  const isRightCompared = createSelector<number, number>(rightComparedCard)
  const isLeftCompared = createSelector<number, number>(leftComparedCard)

  const updateCompared = (i1: number, i2: number) => {
    const card1 = cardsRefs[i1];
    const card2 = cardsRefs[i2];
    const {x: x1} = card1.getBoundingClientRect();
    const {x: x2} = card2.getBoundingClientRect();
    if (x1 < x2) {
      setRightComparedCard(i2);
      setLeftComparedCard(i1);
    } else {
      setRightComparedCard(i1);
      setLeftComparedCard(i2);
    }
  }

  const clearCompared = () => {
    setRightComparedCard(null);
    setLeftComparedCard(null);
  }

  const [selectedCard, setSelectedCard] = createSignal<number | null>(null);
  const isSelected = createSelector<number, number>(selectedCard);

  const [flippedToSelect, setFlippedToSelect] = createSignal<number | null>(null);
  const isFlippedToSelect = createSelector<number, number>(flippedToSelect);

  const handleClick = (i: number) => {
    if (rightComparedCard() !== null && leftComparedCard() !== null) {
      // We are being compared to another card. User clicking to flip indicates that they want to end the comparison
      clearCompared() // This un-flips both compared cards
      setFlippedToSelect(null);
      setSelectedCard(null);
    } else if (flippedToSelect() !== null) {
      // We can assume that this card is the only one currently flipped
      // When the user un-flips it, we want this to be selected
      setSelectedCard(flippedToSelect());
      setFlippedToSelect(null);
    } else {
      if (selectedCard() === null) {
        // Nothing is selected or flipped. User wants to flip this card
        setFlippedToSelect(i);
      } else if (selectedCard() === i) {
        // User is not allowed to flip selected card
        return;
      } else {
        // User has a card selected and is clicking another one
        // This means they want to compare the cards
        updateCompared(i, selectedCard())
        setSelectedCard(null);
        setFlippedToSelect(null);
      }
    }
  };

  let cardsContainerRef: HTMLDivElement;

  return (
    <div>
      <Portal>
        <div
          class="overlay"
          classList={{on: flippedToSelect() !== null || (rightComparedCard() !== null && leftComparedCard() !== null)}}
          onClick={() => handleClick(-1)}
        ></div>
      </Portal>
      <h1 class="title">
        <span>HN</span> Matching Pairs
      </h1>
      <Show keyed={true} when={cards()?.length} fallback={LoadingPromt}>
        <div class="cards-outer">
          <div class="cards" ref={cardsContainerRef}>
            {/*<MatchPromt matches={matches} cards={cards}/>*/}
            {/*<EndPromt cards={cards}/>*/}
            {cards().map((data, i) => {
              const compared = createMemo((prev) => isRightCompared(i) ? "right" : isLeftCompared(i) ? "left" : prev === undefined ? null : false);
              return (
                <Card
                  {...data}
                  selected={createMemo(() => isSelected(i))}
                  requestFlip={() => handleClick(i)}
                  flipped={createMemo(() => isFlippedToSelect(i))}
                  compared={compared}
                  cardsContainerRef={cardsContainerRef}
                  setCardRef={(ref) => cardsRefs[i] = ref}
                />
              );
            })}
          </div>
        </div>
      </Show>
    </div>
  );
}

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

const root = document.querySelector("#root");
render(() => <Main/>, root);
const children = Array.from(root.children);
if (children.length === 2) {
  children[0].remove();
}
