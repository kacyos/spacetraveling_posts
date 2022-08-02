import { GetStaticPaths, GetStaticProps } from "next";

import { parseISO, format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";

import { FiClock, FiCalendar, FiUser } from "react-icons/fi";

import Image from "next/image";
import Head from "next/head";
import { useRouter } from "next/router";
import { RichText } from "prismic-dom";
import commonStyles from "../../styles/common.module.scss";
import styles from "./post.module.scss";
import { getPrismicClient } from "../../services/prismic";
import Header from "../../components/Header";

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <p>Carregando...</p>;
  }

  const totalPostWords = post.data.content.reduce((acc, item) => {
    const heading = item.heading.trim().split(" ").length;

    const body = item.body.reduce((accumulator, { text }) => {
      return (accumulator += text.trim().split(" ").length);
    }, 0);

    return (acc += heading + body);
  }, 0);

  const minutesToReadThePost = Math.ceil(totalPostWords / 200);

  return !post ? (
    <p>Carregando...</p>
  ) : (
    <>
      <Head>
        <title>{post.data.title} | Spacetravelling</title>
      </Head>

      <main className={commonStyles.container}>
        <Header />

        <section className={styles.banner}>
          <img src={post.data.banner.url} alt="banner do post" />
        </section>

        <article className={styles.postContainer}>
          <h1>{post.data.title}</h1>

          <div className={styles.info}>
            <div>
              <FiCalendar />
              <span>
                {format(parseISO(post.first_publication_date), "dd MMM yyyy", {
                  locale: ptBR,
                }).toString()}
              </span>
            </div>

            <div>
              <FiUser />
              <span>{post.data.author}</span>
            </div>

            <div>
              <FiClock />
              <span>{minutesToReadThePost} min</span>
            </div>
          </div>

          <div className={styles.content}>
            {post.data.content.map(({ heading, body }) => {
              return (
                <div key={Math.random()}>
                  <h3>{heading}</h3>
                  <div
                    className={styles.textContainer}
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(body),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType("posts", {
    lang: "pt-BR",
  });

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});

  const { slug } = params;

  const response = await prismic.getByUID("posts", String(slug), {});

  // console.log(JSON.stringify(response.data.content, null, 2))
  // console.log(response.data.content)

  const post = {
    uid: response.uid, // Adicionar o UID
    first_publication_date: response.first_publication_date, // Remover a formatação desse campo
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle, // Adicionar subtitle
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  // console.log(post)

  return {
    props: {
      post,
    },
    redirect: 60 * 30, // 30 minutos
  };
};
