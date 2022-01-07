import { NextPage } from "next";
import Head from "next/head";

interface Props {
  description?: string;
  image?: string;
  type?: string;
  title?: string;
}

const Metatags: NextPage<Props> = (props) => {
  const {
    title = "Ismael Barajas",
    description = `Ismael's Personal Website/Portfolio`,
    image = "",
    type = "website",
  } = props;

  return (
    <Head>
      <title>{title}</title>
      <meta name="robots" content="follow, index" />
      <meta content={description} name="description" />
      {/* <meta property="og:url" content={`https://leerob.io${router.asPath}`} />
            <link rel="canonical" href={`https://leerob.io${router.asPath}`} /> */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Ismael Barajas" />
      <meta property="og:description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@InXanee" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  );
};

export default Metatags;
