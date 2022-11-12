import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { fetchData } from "./fetch-data";

export const POST_COUNT = 10;

function MyComponent(props) {
  fetchData().then((data) => {
    console.log(data);
  });
  return <div>Hello {props.name}</div>;
}

render(() => <MyComponent name="Solid" />, document.documentElement);
