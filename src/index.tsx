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
                  SIDES.forEach(
                    ({
                      coordVal,
                      modifyWithCurrent,
                      name,
                      overflow,
                      prefix,
                    }) => {
                      const rec = cardRef.getBoundingClientRect();
                      const coordVal_ = coordVal(rec);
                      const overflow_ = overflow(coordVal_);
                      if (overflow_ > 0) {
                        const current = parseInt(
                          getNonInlineStyle(cardRef, name)
                        );
                        const final = modifyWithCurrent(current, overflow_) + 5;
                        const newVal = prefix + final + "px";
                        if (name === "right") {
                          console.log("", newVal);
                        }
                        cardRef.animate([{ [name]: newVal }], {
                          duration: 1000,
                          iterations: 1,
                        }).onfinish = () => (cardRef.style[name] = newVal);
                      }
                    }
                  );
                } else {
                  SIDES.forEach(({ name }) => {
                    if (cardRef.style[name]) {
                      const val = getNonInlineStyle(cardRef, name);
                      cardRef.animate([{ [name]: val }], {
                        duration: 1000,
                        iterations: 1,
                      }).onfinish = () => (cardRef.style[name] = "");
                    }
                  });
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
