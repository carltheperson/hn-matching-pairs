import {CardData} from "./index";

const POST_COUNT = 8;
const ACCEPTABLE_COMMENT_AMOUNT = 1;

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
  deleted: true;
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
  while (postsWithComments.some(({kids}) => !kids || kids.length < ACCEPTABLE_COMMENT_AMOUNT)) {
    postsWithComments = await Promise.all(
      posts.map((item) => {
        if (!item.kids || item.kids.length < ACCEPTABLE_COMMENT_AMOUNT) {
          return fetchItem<PostItem>(top[replaceI++]);
        }
        return item;
      })
    );
  }
  const comments = await Promise.all(
    (await Promise.all(
        postsWithComments.map(({kids}) => fetchItem<CommentItem>(kids[0]))
      )
    ).map((comment, i) => {
      if (!comment.text) {
        // This can happen in super rare cases (hence, no complicated retry logic)
        // It happens because the comment was deleted. We pray that the next comment is not.
        return fetchItem<CommentItem>(postsWithComments[i].kids[1]);
      }
      return comment;
    })
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

export const getShuffledArray = (arr) => {
  const newArr = arr.slice();
  for (let i = newArr.length - 1; i > 0; i--) {
    const rand = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[rand]] = [newArr[rand], newArr[i]];
  }
  return newArr;
};

export function checkMatch(
  cards: CardData[],
  i1: number,
  i2: number,
) {
  return (
    cards[i1].matchingId === cards[i2].id
  );
}
