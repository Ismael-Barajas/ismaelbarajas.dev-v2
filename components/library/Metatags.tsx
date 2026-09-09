import { NextPage } from "next";
import Head from "next/head";

interface Props {
  description?: string;
  /** Absolute URL or a path under public/. Paths are made absolute. */
  image?: string;
  type?: string;
  title?: string;
}

/**
 * Canonical origin for absolute URLs in social tags. Scrapers (Discord,
 * Twitter, Slack) need a full URL and fetch it themselves, so a relative
 * path or a dead third-party host shows as a broken preview.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ismaelbarajas.dev").replace(
  /\/$/,
  "",
);

export const absoluteUrl = (pathOrUrl: string): string =>
  /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;

const Metatags: NextPage<Props> = (props) => {
  const {
    title = "Ismael Barajas",
    description = `Ismael's Personal Website/Portfolio`,
    image = "/og.png",
    type = "website",
  } = props;
  const imageUrl = absoluteUrl(image);

  return (
    <Head>
      <title>{title}</title>
      <meta name="robots" content="follow, index" />
      <meta content={description} name="description" />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Ismael Barajas" />
      <meta property="og:description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@InXanee" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  );
};

export default Metatags;
