import clsx from "clsx";
import * as React from "react";
import { IoLogoVercel } from "react-icons/io5";
import { GiBeanstalk } from "react-icons/gi";
import {
  SiFirebase,
  SiGit,
  SiJavascript,
  SiMarkdown,
  SiNextdotjs,
  SiNodedotjs,
  SiPython,
  SiPrettier,
  SiReact,
  SiRedux,
  SiRedis,
  SiTailwindcss,
  SiTypescript,
  SiAmazonaws,
  SiSqlite,
  SiAmazondynamodb,
} from "react-icons/si";
import { ToolTip } from "components";

export type TechListType = keyof typeof techList;

export type TechIconsProps = {
  techs: Array<TechListType>;
} & React.ComponentPropsWithoutRef<"ul">;

export default function TagIcons({ className, techs }: TechIconsProps) {
  return (
    <ul className={clsx(className, "flex flex-wrap gap-1 bottom-0")}>
      {techs.map((tech) => {
        if (!techList[tech]) return;

        const current = techList[tech];

        return (
          <ToolTip key={current.name} content={current.name}>
            <li className="text-md text-gray-700 dark:text-gray-200">
              <div
                className={clsx(
                  current.className,
                  "text-md py-1 px-2 rounded-md"
                )}
              >
                <current.icon />
              </div>
            </li>
          </ToolTip>
        );
      })}
    </ul>
  );
}

const techList = {
  react: {
    icon: SiReact,
    name: "React",
    className: "react-btn",
  },
  nextjs: {
    icon: SiNextdotjs,
    name: "Next.js",
    className: "next-btn",
  },
  tailwindcss: {
    icon: SiTailwindcss,
    name: "Tailwind CSS",
    className: "",
  },
  javascript: {
    icon: SiJavascript,
    name: "JavaScript",
    className: "javascript-btn",
  },
  typescript: {
    icon: SiTypescript,
    name: "TypeScript",
    className: "typescript-btn",
  },
  nodejs: {
    icon: SiNodedotjs,
    name: "Node.js",
    className: "-btn",
  },
  firebase: {
    icon: SiFirebase,
    name: "Firebase",
    className: "firebase-btn",
  },
  swr: {
    icon: IoLogoVercel,
    name: "SWR",
    className: "next-btn",
  },
  redux: {
    icon: SiRedux,
    name: "Redux",
    className: "redux-btn",
  },
  mdx: {
    icon: SiMarkdown,
    name: "MDX",
    className: "-btn",
  },
  prettier: {
    icon: SiPrettier,
    name: "Prettier",
    className: "-btn",
  },
  git: {
    icon: SiGit,
    name: "Git",
    className: "-btn",
  },
  python: {
    icon: SiPython,
    name: "Python",
    className: "python-btn",
  },
  redis: {
    icon: SiRedis,
    name: "Redis",
    className: "redis-btn",
  },
  aws: {
    icon: SiAmazonaws,
    name: "AWS",
    className: "aws-btn",
  },
  dynamodb: {
    icon: SiAmazondynamodb,
    name: "DynamoDB",
    className: "aws-btn",
  },
  sqlite: {
    icon: SiSqlite,
    name: "SQLite",
    className: "sqlite-btn",
  },
  beanstalkd: {
    icon: GiBeanstalk,
    name: "Beanstalkd",
    className: "beanstalk-btn",
  },
};
