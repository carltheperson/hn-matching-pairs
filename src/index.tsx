import {
  createComputed,
  createEffect,
  createResource,
  createSignal,
  For,
  Index,
} from "solid-js";
import { render } from "solid-js/web";
import { fetchData } from "./fetch-data";

/*
 */

export const POST_COUNT = 10;

function getInnerElementFromEvent(e: MouseEvent) {
  const elements = document.elementsFromPoint(e.clientX, e.clientY);
  const inner = elements.find((el) => el.classList.contains("inner"));
  return inner;
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
  // const [data] = createResource(fetchData);

  // Todo:
  // Solid: Find a good data structure to store a map
  let cardsRef: HTMLDivElement;
  return (
    <div>
      <h1 class="title">
        <span>HN</span> Matching Pairs
      </h1>
      <div
        class="cards-outer"
        onmousemove={(e) =>
          cardsRef.classList[getInnerElementFromEvent(e) ? "add" : "remove"](
            "pointer"
          )
        }
      >
        <div class="cards" ref={cardsRef}>
          <Index each={cards()}>
            {(data) => {
              let cardRef: HTMLDivElement;

              createEffect(() => {
                if (data().flipped) {
                  cardRef.animate([{ left: "-210px" }], {
                    duration: 1000,
                    iterations: 1,
                  }).onfinish = () => (cardRef.style.left = "-210px");
                } else {
                  if (cardRef.style.left) {
                    const old = cardRef.style.left;
                    cardRef.style.left = "";
                    const left = getComputedStyle(cardRef).left;
                    cardRef.style.left = old;
                    cardRef.animate([{ left }], {
                      duration: 1000,
                      iterations: 1,
                    }).onfinish = () => (cardRef.style.left = "");
                  }
                }
              });

              return (
                <div
                  class="card-outer"
                  ref={cardRef}
                  onClick={(e) => {
                    const inner = getInnerElementFromEvent(e);
                    if (inner) {
                      const i = cards().findIndex(
                        (card) => card.elRef === inner
                      );
                      setCards((cards) => {
                        cards[i] = {
                          ...cards[i],
                          flipped: !cards[i].flipped,
                        };
                        return [...cards];
                      });
                    }
                  }}
                >
                  <div class="card" classList={{ flipped: data().flipped }}>
                    <div class="inner" ref={data().elRef}>
                      <div class="front"></div>
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

const root = document.querySelector("#root");
render(() => <Main />, root);
const children = Array.from(root.children);
if (children.length === 2) {
  children[0].remove();
}
