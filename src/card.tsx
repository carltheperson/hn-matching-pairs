import { createEffect, createSignal } from "solid-js";
import { CardData } from ".";
import { FlipAnimation, registerFlipAnimation } from "./animations";
import { CommentIcon, PostIcon } from "./icons";

export function Card({ text, type }: CardData, index: number) {
  let cardRef: HTMLDivElement;
  let innerRef: HTMLDivElement;
  const [flipped, setFlipped] = createSignal<boolean>();
  const [outOfGame, setOutOfGame] = createSignal(false);

  // // Overflow animation
  // createEffect(() => {
  // 	if (!matches()?.some((m) => m.cardIndex == i)) {
  // 		if (data().flipped) {
  // 			preventWindowOverflowAnimati®ons(cardRef);
  // 			onCleanup(() => clearWindowOverlfowAnimations(cardRef));
  // 		}
  // 	}
  // });

  // // Match animation
  // createEffect(() => {
  // 	const matchIndex = matches()?.findIndex(
  // 		(m) => m.cardIndex == i
  // 	);
  // 	if (matchIndex !== undefined && matchIndex !== -1) {
  // 		matchAnimation(cardRef, data().elRef, matchIndex);
  // 	}
  // });

  const card = (
    <div class="card-outer" ref={cardRef}>
      <div
        class="card"
        classList={{
          flipped: flipped() || outOfGame(),
          "block-flips": flipped() === undefined,
        }}
      >
        <div class="clickable-card" onClick={() => setFlipped((f) => !f)}></div>
        <div class="inner" ref={innerRef} onClick={() => setFlipped((f) => !f)}>
          {/* <TipPromt card={data} /> */}
          <div
            class="front"
            // classList={{ selected: selected() == i }}
          ></div>
          <div class="back">
            <div class={"sub " + type}>
              <div class="type">
                <div class="icon">
                  {type === "post" ? <PostIcon /> : <CommentIcon />}
                </div>
                {type}
              </div>
              {() => {
                let ref: HTMLDivElement;
                const back = <div class="text" ref={ref}></div>;
                ref.innerHTML = text;
                return back;
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  registerFlipAnimation(innerRef, flipped);

  return card;
}
