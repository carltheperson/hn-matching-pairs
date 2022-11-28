import {Accessor, createEffect, createRoot, createSignal, onMount, Setter, Show} from "solid-js";
import {CardData} from ".";
import {
  AnimationState, registerComparisonAnimation,
  registerFlipAnimation, registerOutOfGameAnimation,
  registerOverflowPreventionAnimation,
} from "./animations";
import {CommentIcon, PostIcon} from "./icons";
import {TipPrompt} from "./prompts";

export function Card({
                       text,
                       type,
                       selected,
                       requestFlip,
                       flipped,
                       compared,
                       cardsContainerRef,
                       setCardRef,
                       outOfGame,
                       markAsFullyDone,
                       id,
                     }: CardData & {
  selected: Accessor<boolean>;
  requestFlip: () => void;
  flipped: Accessor<boolean | null>;
  compared: Accessor<"left" | "right" | false>;
  cardsContainerRef: HTMLDivElement;
  setCardRef: (ref: HTMLDivElement) => void;
  markAsFullyDone: () => void
  outOfGame: Accessor<boolean>
}) {
  let cardRef: HTMLDivElement;
  let cardChildRef: HTMLDivElement;
  let innerRef: HTMLDivElement;

  const [flipAnimationState, setFlipAnimationState] = createSignal<AnimationState>("ended");
  const [overflowAnimationState, setOverflowAnimationState] = createSignal<AnimationState>("ended");
  const [comparisonAnimationState, setComparisonAnimationState] = createSignal<AnimationState>("ended");
  const [outOfGameAnimationState, setOutOfGameAnimationState] = createSignal(false)

  onMount(() => {
    setCardRef(cardRef)

    registerFlipAnimation(innerRef, cardRef, flipAnimationState, setFlipAnimationState);
    registerOverflowPreventionAnimation(cardChildRef, overflowAnimationState, setOverflowAnimationState);
    registerComparisonAnimation(cardRef, cardsContainerRef, compared, comparisonAnimationState, setComparisonAnimationState);
    registerOutOfGameAnimation(cardChildRef, outOfGameAnimationState);


    createEffect((oldCompared) => {
      if (createRoot(() => outOfGame()) && compared() === false) {
        setOutOfGameAnimationState(true);
        markAsFullyDone();
        return;
      }

      if (compared() !== null && !flipped() && oldCompared !== compared()) {
        setComparisonAnimationState(compared() ? "to-start" : "to-end")
        setFlipAnimationState(compared() ? "to-start" : "to-end")
        setOverflowAnimationState("to-end")
      } else if (flipped() !== null) {
        setFlipAnimationState(flipped() ? "to-start" : "to-end")
        setOverflowAnimationState(flipped() ? "to-start" : "to-end")
      }
      return compared();
    })
  });

  return (
    <div class="card-outer" ref={cardRef} onClick={requestFlip}>
      <div
        class="card"
        ref={cardChildRef}
      >
        <div class="click-filler-card"></div>
        <div class="inner" ref={innerRef}>
          <TipPrompt flipped={flipped}/>
          <div
            class="front"
            classList={{
              selected:
                selected() &&
                (flipAnimationState() === "ended" ||
                  flipAnimationState() === "to-end"),
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
                createEffect(() => {
                  if (flipAnimationState() === "ended" && comparisonAnimationState() === "ended") {
                    ref.scroll({top: 0}); // User might have messed with the card scrolling which we should reset
                  }
                })
                ref.innerHTML = text; // Oh god I hope HN sanitized this HTML
                return textEl;
              }}
              <Show when={type === "post" && outOfGame()} keyed={true}>
                <div class="link-to-post"><a href={"https://news.ycombinator.com/item?id=" + id} target="_blank"
                                             onClick={e => e.stopImmediatePropagation()}>Link to
                  post</a></div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
