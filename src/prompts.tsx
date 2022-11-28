import confetti from "canvas-confetti";
import {Accessor, createComputed, createMemo, Show} from "solid-js";

export function ComparisonPrompt({
                                   isMatch,
                                   onClick
                                 }: {
  isMatch: Accessor<boolean | null>
  onClick: () => void;
}) {
  createComputed(() => {
    if (isMatch()) {
      setTimeout(() => {
        confetti();
      }, 500);
    }
  });

  const nonNullIsMatch = createMemo<boolean>(prev => {
    if (isMatch() === null) {
      return prev;
    }
    return isMatch();
  }, false)

  return (
    <div
      class="match-prompt"
      classList={{
        on: isMatch() !== null,
      }}
      onClick={onClick}
    >
      <h1
        classList={{
          ["is-match"]: nonNullIsMatch(),
        }}
      >
        {nonNullIsMatch() ? "It's a match!" : "Not a match"}
      </h1>
    </div>
  );
}

export function EndPrompt({done, flips}: { done: Accessor<boolean>; flips: Accessor<number> }) {
  return (
    <div
      class="end-prompt"
      classList={{
        on: done(),
      }}
    >
      <div class="text">
        <div>Game Over. Well done!</div>
        <div>Completed in {flips()} flips</div>
        <div class="small">(refresh to try again)</div>
      </div>
    </div>
  );
}

export function TipPrompt({flipped}: { flipped: Accessor<boolean> }) {
  return (
    <Show keyed={true} when={flipped()}>
      {() => {
        if (localStorage["shown-tip"]) {
          return;
        }
        localStorage["shown-tip"] = "1";
        return <div class="tip-prompt">Tip: Click anywhere to close card</div>;
      }}
    </Show>
  );
}

export function LoadingPrompt() {
  return <div class="loading-prompt cards-outer">Loading ...</div>;
}

export function FlipsPrompt({flips}: { flips: Accessor<number> }) {
  return <div class="flips-prompt">Flips: {flips()}</div>;
}
