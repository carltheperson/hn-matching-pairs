import { POST_COUNT } from "./index";

interface PostItem {
  url: string;
  kids?: number[];
  id: number;
  title: string;
  by: string;
}

interface CommentItem {
  id: number;
  parent: number;
  text: string;
  by: string;
}

async function fetchTop() {
  return (await fetch(
    "https://hacker-news.firebaseio.com/v0/topstories.json"
  ).then((r) => r.json())) as number[];
}

async function fetchItem<T>(id: number) {
  return (await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json?`
  ).then((r) => r.json())) as T;
}

export async function fetchData() {
  const top = await fetchTop();
  const limitedTop = top.slice(0, POST_COUNT);
  const items = await Promise.all(
    limitedTop.map((id) => fetchItem<PostItem>(id))
  );
  let replaceI = POST_COUNT;
  let itemsWithComments = items;
  while (itemsWithComments.some(({ kids }) => !kids || kids.length === 0)) {
    itemsWithComments = await Promise.all(
      items.map((item) => {
        if (!item.kids || item.kids.length === 0) {
          return fetchItem<PostItem>(top[replaceI++]);
        }
        return item;
      })
    );
  }
  const comments = await Promise.all(
    itemsWithComments.map(({ kids }) => fetchItem<CommentItem>(kids[0]))
  );
  return itemsWithComments.map((post, i) => {
    const comment = comments[i];
    return {
      post: {
        ...post,
        commentRef: comment,
      },
      comment: {
        ...comment,
        postRef: post,
      },
    };
  });
}
