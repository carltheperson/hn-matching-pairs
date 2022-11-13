import { createResource, For } from "solid-js";
import { render } from "solid-js/web";
import { fetchData } from "./fetch-data";

/*
[x] Units for text that scales
[ ] Simple card
[ ] CSS grid
*/

export const POST_COUNT = 10;

function Main() {
  const [data] = createResource(() => []);
  // const [data] = createResource(fetchData);
  return (
    <div>
      <h1 class="title">
        <span>HN</span> Matching Pairs
      </h1>
      <div class="cards">
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
        <div class="card"></div>
      </div>
      {/* <For each={data()} fallback={<div>Loading...</div>}>
        {(item) => (
          <div>
            <b>{item.post.title}</b> | {item.comment.text}
          </div>
        )}
      </For> */}
    </div>
  );
}

const root = document.querySelector("#root");
render(() => <Main />, root);
const children = Array.from(root.children);
if (children.length === 2) {
  children[0].remove();
}
