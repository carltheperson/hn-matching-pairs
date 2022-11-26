import {Accessor, createEffect, createSignal} from "solid-js";
import {CardData} from ".";
import {
  AnimationState,
  registerFlipAnimation,
  registerOverflowPreventionAnimation,
} from "./animations";
import {CommentIcon, PostIcon} from "./icons";
import {TipPromt} from "./promts";

export function Card({
                       text,
                       type,
                       selected,
                       requestFlip,
                       flipped,
                       compared,
                     }: CardData & {
  selected: Accessor<boolean>;
  requestFlip: () => void;
  flipped: Accessor<boolean>;
  compared: Accessor<"left" | "right" | false>;
}) {
  let cardRef: HTMLDivElement;
  let cardChildRef: HTMLDivElement;
  let innerRef: HTMLDivElement;
  let flipAnimationState: Accessor<AnimationState>;
  const [outOfGame, setOutOfGame] = createSignal(false);

  setTimeout(() => {
    flipAnimationState = registerFlipAnimation(innerRef, cardRef, flipped);
    registerOverflowPreventionAnimation(cardChildRef, flipped);
  });

  return (
    <div class="card-outer" ref={cardRef} onClick={requestFlip}>
      <div
        class="card"
        ref={cardChildRef}
        classList={{
          flipped: flipped() || outOfGame(),
          "block-flips": flipped() === undefined,
          compared: compared() !== false,
        }}
      >
        <div class="click-filler-card"></div>
        <div class="inner" ref={innerRef}>
          <TipPromt flipped={flipped}/>
          <div
            class="front"
            classList={{
              selected:
                selected() &&
                (flipAnimationState?.() === "ended" ||
                  flipAnimationState?.() === "to-end"),
            }}
          ></div>
          <div class="back">
            <div class={"sub " + type}>
              <div class="type">
                <div class="icon">
                  {type === "post" ? <PostIcon/> : <CommentIcon/>}
                </div>
                {type}
              </div>
              {() => {
                let ref: HTMLDivElement;
                const textEl = <div class="text" ref={ref}></div>;
                ref.innerHTML = text;
                return textEl;
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
