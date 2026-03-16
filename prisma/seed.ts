import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.experience.deleteMany();
  await prisma.project.deleteMany();

  await prisma.experience.createMany({
    data: [
      {
        img: "https://vsgkt473qeluf9ed.public.blob.vercel-storage.com/images/GM-logo-2021.png",
        url: "https://www.gm.com/",
        position: "Software Engineer",
        timeCommitment: "Jul 2022 - Current",
        body: [
          "Full stack software engineer contributing across multiple teams, spanning risk management and cloud infrastructure.",
          "Designed and delivered risk management features using Angular and Java Spring Boot, writing optimized native queries and owning development end-to-end from UI to data layer.",
          "Provisioned and managed scalable cloud infrastructure on Azure using Terraform, Docker, and Kubernetes — automating deployments and driving infrastructure-as-code practices across the team.",
        ],
        tags: [
          "angular",
          "java",
          "spring",
          "terraform",
          "kubernetes",
          "docker",
          "azure",
          "git",
        ],
        order: 0,
      },
      {
        img: "https://vsgkt473qeluf9ed.public.blob.vercel-storage.com/images/PurposerLogo.png",
        url: "https://www.purposer.com/",
        position: "Full-Stack Developer - Internship",
        timeCommitment: "Jul 2021 - May 2022",
        body: [
          "Worked in an agile startup environment as part of a small, fast-moving dev team.",
          "Built and shipped over a hundred React components and layouts, crafting responsive interfaces and polished user experiences for web.",
          "Contributed to API design and database architecture, working across the stack from front end through to data layer.",
        ],
        tags: [
          "react",
          "dynamodb",
          "redux",
          "git",
          "aws",
          "prettier",
          "nodejs",
          "mui",
          "leaflet",
        ],
        order: 1,
      },
    ],
  });

  await prisma.project.createMany({
    data: [
      {
        img: "https://vsgkt473qeluf9ed.public.blob.vercel-storage.com/images/ismaelbarajasdev2.png",
        name: "ismaelbarajas.dev-v2",
        url: "/",
        githubUrl: "https://github.com/Ismael-Barajas/ismaelbarajas.dev-v2",
        body: [
          "This portfolio — built with Next.js and TypeScript, styled with Tailwind CSS, and deployed on Vercel.",
          "Features a Spotify now-playing widget with dynamic accent color extraction, smooth scroll navigation, and a custom cursor follower.",
        ],
        tags: ["react", "nextjs", "tailwindcss", "git", "typescript", "swr"],
        order: 0,
      },
      {
        img: "https://opengraph.githubassets.com/68e6433c7e0ca077f7860541cd143d43d18b4ae60a760c784091922d156bc5ce/Ismael-Barajas/Twitter-like-microblogging-service",
        name: "Twitter-like Micro-Blogging Service",
        url: "https://github.com/Ismael-Barajas/Twitter-like-microblogging-service",
        githubUrl:
          "https://github.com/Ismael-Barajas/Twitter-like-microblogging-service",
        body: [
          "A fully featured micro-blogging platform built with Python, supporting posts, re-posts, likes, polls, follows, and user timelines.",
          "Leverages asynchronous message queues via Beanstalkd for background processing, with Redis caching and SQLite for data persistence.",
        ],
        tags: ["python", "git", "redis", "dynamodb", "sqlite", "beanstalkd"],
        order: 1,
      },
      {
        img: "https://vsgkt473qeluf9ed.public.blob.vercel-storage.com/images/somliere.png",
        name: "soMLiere",
        url: "https://somliere.vercel.app/",
        githubUrl: "https://github.com/Ismael-Barajas/somliere",
        body: [
          "A machine learning web app that predicts a quality score for a bottle of wine based on its chemical properties.",
          "Built with a Python ML model on the backend and a Next.js frontend, deployed on AWS and Vercel.",
        ],
        tags: [
          "react",
          "nextjs",
          "javascript",
          "git",
          "aws",
          "mui",
          "python",
          "ai",
        ],
        order: 2,
      },
      {
        img: "https://vsgkt473qeluf9ed.public.blob.vercel-storage.com/images/nxt-fire-app.png",
        name: "Next Fire Application",
        url: "https://nxt-fire-app.vercel.app/",
        githubUrl: "https://github.com/Ismael-Barajas/nxt-fire-app",
        body: [
          "A full-stack social blogging platform where users can publish posts and follow other writers.",
          "Built with Next.js and Firebase, featuring real-time updates, authentication, and server-side rendering.",
        ],
        tags: ["react", "nextjs", "firebase", "javascript", "git"],
        order: 3,
      },
      {
        img: "https://vsgkt473qeluf9ed.public.blob.vercel-storage.com/images/TimeLines.png",
        name: "TimeLines",
        url: "https://timelines-ismael-barajas.vercel.app/",
        githubUrl: "https://github.com/Ismael-Barajas/Timelines",
        body: [
          "A web app for visualizing a GitHub repository's commit history in a clean, consolidated timeline view.",
          "Built with Next.js and the GitHub API — great for sharing project history at a glance.",
        ],
        tags: ["react", "nextjs", "javascript", "git", "mui"],
        order: 4,
      },
      {
        img: "https://vsgkt473qeluf9ed.public.blob.vercel-storage.com/images/Covid19.png",
        name: "COVID-19 Watch",
        url: "https://covid-19-watch-349.herokuapp.com/",
        githubUrl: "https://github.com/Ismael-Barajas/Covid19-Website",
        body: [
          "A COVID-19 tracking dashboard with live statistics, interactive charts, and a map visualizing case data by region.",
          "Built with React and Material UI, pulling from public health APIs to keep data up to date.",
        ],
        tags: ["react", "javascript", "mui", "leaflet", "git"],
        order: 5,
      },
      {
        img: "https://vsgkt473qeluf9ed.public.blob.vercel-storage.com/images/PersonalWebsite.png",
        name: "ismaelbarajas.dev-v1",
        url: "https://my-website-9655b.web.app/",
        githubUrl: "https://github.com/Ismael-Barajas/ismaelbarajas.dev",
        body: [
          "The first version of my personal portfolio, built with React and hosted on Firebase.",
          "Where it all started — the foundation that eventually led to the v2 you're looking at now.",
        ],
        tags: ["react", "git", "javascript", "mui", "firebase"],
        order: 6,
      },
      {
        img: "https://vsgkt473qeluf9ed.public.blob.vercel-storage.com/images/QuizzieBizzie.png",
        name: "QuizzieBizzie",
        url: "https://quizziebizzie.herokuapp.com/",
        githubUrl: "https://github.com/Ismael-Barajas/QuizzieBizzie",
        body: [
          "A quiz platform where users can create, share, and take quizzes.",
          "Built with Flask and Python on the backend with SQLite for storage.",
        ],
        tags: ["flask", "python", "sqlite", "git"],
        order: 7,
      },
    ],
  });

  console.log("Seeded experience and projects.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
