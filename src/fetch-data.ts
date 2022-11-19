import { CardData, POST_COUNT } from "./index";

interface PostItem {
  url: string;
  kids?: number[];
  id: number;
  text: string;
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

export async function fetchData(): Promise<CardData[]> {
  const top = await fetchTop();
  const limitedTop = top.slice(0, POST_COUNT);
  const posts = await Promise.all(
    limitedTop.map((id) => fetchItem<PostItem>(id))
  );
  let replaceI = POST_COUNT;
  let postsWithComments = posts;
  while (postsWithComments.some(({ kids }) => !kids || kids.length === 0)) {
    postsWithComments = await Promise.all(
      posts.map((item) => {
        if (!item.kids || item.kids.length === 0) {
          return fetchItem<PostItem>(top[replaceI++]);
        }
        return item;
      })
    );
  }
  const comments = await Promise.all(
    postsWithComments.map(({ kids }) => fetchItem<CommentItem>(kids[0]))
  );
  const pairs = comments.map(
    (_, i) => [postsWithComments[i], comments[i]] as const
  );
  const commentsAndPosts = pairs
    .map<[CardData, CardData]>(([post, comment]) => {
      return [
        {
          type: "post",
          id: post.id,
          matchingId: comment.id,
          text: post.title,
        },
        {
          type: "comment",
          id: comment.id,
          matchingId: post.id,
          text: comment.text,
        },
      ];
    })
    .flat();
  return commentsAndPosts;
}
