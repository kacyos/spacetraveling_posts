import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { AiOutlineCalendar, AiOutlineUser } from "react-icons/ai";
import Header from "../components/Header";

import { getPrismicClient } from "../services/prismic";
import commonStyles from "../styles/common.module.scss";
import styles from "./home.module.scss";

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination);

  async function loadMore(): Promise<void> {
    const response = await fetch(posts.next_page);
    const { next_page, results } = await response.json();

    const morePosts = results.map((post: Post) => {
      return {
        uid: post?.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          "dd MMM yyyy"
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts(prevState => ({
      next_page,
      results: [...prevState.results, ...morePosts],
    }));
  }

  return (
    <>
      <Head>
        <title>Posts | spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <Header />
        <div className={styles.postList}>
          {posts?.results.map(post => (
            <Link key={post.uid} href={`post/${post.uid}`}>
              <a className={styles.post}>
                <h3>{post.data.title}</h3>
                <p>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <span>
                    <AiOutlineCalendar />
                    <time>
                      {format(
                        new Date(post.first_publication_date),
                        "dd MMM yyyy",
                        {
                          locale: ptBR,
                        }
                      )}
                    </time>
                  </span>
                  <span>
                    <AiOutlineUser />
                    <span>{post.data.author}</span>
                  </span>
                </div>
              </a>
            </Link>
          ))}
        </div>
        <div className={styles.loadMoreContainer}>
          {!!posts.next_page && (
            <button onClick={loadMore} type="submit">
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

interface IProps {
  props: HomeProps;
}

export const getStaticProps = async (): Promise<IProps> => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType("posts", { pageSize: 2 });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post?.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
