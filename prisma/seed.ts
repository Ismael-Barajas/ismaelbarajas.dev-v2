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
          "Full stack engineer at GM, working across two teams: risk management and cloud infrastructure.",
          "Built out risk features in Angular and Java Spring Boot, a lot of it was complex query work and owning things end-to-end from the UI down to the database.",
          "Also spent time on the infra side, provisioning Azure resources with Terraform and managing Docker and Kubernetes deployments, pushing IaC practices the team hadn't fully adopted yet.",
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
          "Startup internship on a small team moving fast, the kind of place where you're shipping real things from day one.",
          "Built a lot of React components and layouts, mostly focused on getting responsive UIs feeling polished across the site.",
          "Touched the backend too, helped with API design and database work so it was genuinely full stack.",
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
          "The site you're on right now. Built with Next.js, TypeScript, and Tailwind, deployed to Vercel.",
          "Has a Spotify widget that pulls accent colors from the album art, a cursor follower, and smooth scroll nav.",
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
          "A Twitter clone built in Python, posts, re-posts, likes, polls, follows, timelines, the whole thing.",
          "Used Beanstalkd for async job queues, Redis for caching, and SQLite for storage. Good project for learning how these pieces fit together.",
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
          "Give it a wine's chemical properties and it'll spit out a quality score. The name is terrible and I love it.",
          "Python ML model on the backend, Next.js frontend, model runs on AWS and the site on Vercel.",
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
          "A blogging platform where you can publish posts and follow other writers.",
          "Built with Next.js and Firebase, mostly a project to get comfortable with real-time updates and Firebase auth.",
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
          "Turns a GitHub repo's commit history into a readable timeline. Useful when you want to see how a project actually evolved.",
          "Built with Next.js and the GitHub API, mostly made this for myself to visualize project history quickly.",
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
          "A COVID tracking dashboard with live stats, charts, and an interactive map broken down by region.",
          "Built with React and Material UI during peak pandemic when everyone was obsessing over the numbers.",
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
          "The original version of this site, built with React and hosted on Firebase.",
          "It's rough around the edges but it got me my first internship, so it stays.",
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
          "A quiz app, make a quiz, share it, take other people's. Nothing fancy.",
          "Python and Flask on the backend with SQLite. One of the first things I built that felt like a real web app.",
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
