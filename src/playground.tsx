import {
  createComputed,
  createEffect,
  createMemo,
  createRenderEffect,
  createSelector,
  createSignal,
  onCleanup,
} from "solid-js";

export function playground() {
  example6();
  // const [sig] = createSignal("hello", {});

  // createEffect(() => {
  //   console.log("We have effect", el?.toString());
  // });

  // const el = <div></div>;

  // return <div>Hello</div>;
}

function example1() {
  {
    createEffect(() => {
      console.log(el); // OK
    });

    const el = <div></div>;
  }

  {
    createRenderEffect(() => {
      console.log(el); // Error
    });

    const el = <div></div>;
  }
}

function example2() {
  {
    let myRef;

    createEffect(() => {
      console.log(myRef); // OK
    });

    const el = <div ref={myRef}></div>;
  }
  {
    let myRef;

    createRenderEffect(() => {
      console.log(myRef); // Error, undefined
    });

    const el = <div ref={myRef}></div>;
  }
}

function example3() {
  const [name, setName] = createSignal("Ole");

  createEffect(() => {
    console.log("Name is", name());
    onCleanup(() => {
      console.log("Cleaning up");
    });
  });

  setTimeout(() => {
    setName("Bole");
  }, 3000);

  setTimeout(() => {
    setName("Skole");
  }, 5000);
}

function example4() {
  const [name, setName] = createSignal("Ole");

  const cb = () => {
    console.log("Callback called");
    return name() + " is his name";
  };

  const addedName = createMemo(cb);
  // const addedName = cb;

  // Callback called once
  return (
    <div>
      <li>{addedName()}</li>
      <li>{addedName()}</li>
      <li>{addedName()}</li>
      <li>{addedName()}</li>
      <li>{addedName()}</li>
      <li>{addedName()}</li>
    </div>
  );
}

function example5() {
  const [thePersonUnwrapped, setThePerson] = createSignal("Ole");
  const isPersonSelected = createSelector(thePersonUnwrapped);

  const oleName = createMemo(() => {
    console.log("Running for Ole", isPersonSelected("Ole"));
    return "Ole " + (isPersonSelected("Ole") ? "(THE PERSON)" : "");
  });
  const bentName = createMemo(() => {
    console.log("Running for Bent", isPersonSelected("Bent"));
    return "Bent " + (isPersonSelected("Bent") ? "(THE PERSON)" : "");
  });
  const ibName = createMemo(() => {
    console.log("Running for Ib", isPersonSelected("Ib"));
    return "Ib " + (isPersonSelected("Ib") ? "(THE PERSON)" : "");
  });

  createEffect(() => {
    console.log("Names", oleName(), ",", bentName(), ",", ibName());
  });

  setTimeout(() => {
    setThePerson("Ib");
  }, 1000);
}

function example6() {
  const [name, setName] = createSignal("Ole");

  createComputed(() => {
    console.log("Name is", name());
  });

  setName("Bole");
  setName("Skole");

  /*
  Res:
    Name is Ole
    Name is Bole
    Name is Skole

  If using createRenderEffect
    Name is Ole
    Name is Skole
  */
}
