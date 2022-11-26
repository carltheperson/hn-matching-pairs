import confetti from "canvas-confetti";
import {Accessor, createComputed, createMemo, Resource, Show} from "solid-js";
import {CardData} from ".";

export function ComparisonPrompt({
                                   isMatch
                                 }: {
  isMatch: Accessor<boolean | null>;
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

export function EndPrompt({done}: { done: Accessor<boolean> }) {
  return (
    <div
      class="end-prompt"
      classList={{
        on: done(),
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

export function TipPrompt({flipped}: { flipped: Accessor<Boolean> }) {
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

export function LoadingPrompt() {
  return <div class="loading-promt">Loading ...</div>;
}
