import confetti from "canvas-confetti";
import { Accessor, createComputed, createMemo, Resource, Show } from "solid-js";
import { CardData } from ".";

export function MatchPromt({
  matches,
  cards,
}: {
  matches: Accessor<
    [
      {
        cardIndex: number;
      },
      {
        cardIndex: number;
      }
    ]
  >;
  cards: Resource<CardData[]>;
}) {
  let lastIsMatch_ = false;
  const isMatch_ = createMemo(() => {
    // if (matches() === undefined) {
    //   return lastIsMatch_;
    // } else if (isMatch(matches(), cards())) {
    //   lastIsMatch_ = true;
    // } else {
    //   lastIsMatch_ = false;
    // }
    return lastIsMatch_;
  });

  createComputed(() => {
    if (matches() !== undefined && isMatch_()) {
      setTimeout(() => {
        confetti();
      }, 500);
    }
  });

  return (
    <div
      class="match-prompt"
      classList={{
        on: matches() !== undefined,
      }}
    >
      <h1
        classList={{
          ["is-match"]: isMatch_(),
        }}
      >
        {isMatch_() ? "It's a match!" : "Not a match"}
      </h1>
    </div>
  );
}

export function EndPromt({ cards }: { cards: Resource<CardData[]> }) {
  return (
    <div
      class="end-promt"
      classList={{
        on: cards().every((c) => c.outOfGame),
      }}
    >
      <div class="text">
        <div>Game Over</div>
        <div>Well Done!</div>
        <div class="small">(refresh to try again)</div>
      </div>
    </div>
  );
}

export function TipPromt({ flipped }: { flipped: Accessor<Boolean> }) {
  return (
    <Show when={flipped()}>
      {() => {
        if (localStorage["shown-tip"]) {
          return;
        }
        localStorage["shown-tip"] = "1";
        return <div class="tip-promt">Tip: Click anywhere to close card</div>;
      }}
    </Show>
  );
}

export function LoadingPromt() {
  return <div class="loading-promt">Loading ...</div>;
}
