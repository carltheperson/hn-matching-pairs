import { createSignal } from "solid-js";

function MyComponent(props) {
  return <div>Hello {props.name}</div>;
}

console.log("Hello", <MyComponent name="Solid" />, createSignal);
