import { createResource, For } from "solid-js";
import { render } from "solid-js/web";
import { fetchData } from "./fetch-data";

export const POST_COUNT = 10;

function MyComponent(props) {
  const [data, { mutate, refetch }] = createResource(fetchData);
  return (
    <div>
      hi 3
      <For each={data()} fallback={<div>Loading...</div>}>
        {(item) => (
          <div>
            <b>{item.post.title}</b> | {item.comment.text}
          </div>
        )}
      </For>
    </div>
  );
}

const root = document.querySelector("#root");
render(() => <MyComponent name="Solid" />, root);
const children = Array.from(root.children);
if (children.length === 2) {
  children[0].remove();
}
