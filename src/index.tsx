import { createSignal } from "solid-js";
import { render } from "solid-js/web";

function MyComponent(props) {
  return <div>Hello {props.name}</div>;
}

render(() => <MyComponent name="Solid" />, document.documentElement);
