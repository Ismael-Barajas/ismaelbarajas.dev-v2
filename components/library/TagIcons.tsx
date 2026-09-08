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
  SiSqlite,
  SiMui,
  SiLeaflet,
  SiFlask,
  SiAngular,
  SiSpring,
  SiTerraform,
  SiKubernetes,
  SiDocker,
  SiElectron,
  SiTauri,
  SiFfmpeg,
  SiRust,
  SiPalantir,
} from "react-icons/si";
import { VscAzure } from "react-icons/vsc";
import { FaAws, FaJava } from "react-icons/fa6";
import { GiArtificialIntelligence } from "react-icons/gi";
import { ToolTip } from "components";

export type TechListType = keyof typeof techList;

export type TechIconsProps = {
  techs: Array<TechListType>;
  /** "chips" shows icon + name; "icons" is the original icon-only row. */
  variant?: "chips" | "icons";
} & React.ComponentPropsWithoutRef<"ul">;

export default function TagIcons({
  className,
  techs,
  variant = "chips",
}: TechIconsProps) {
  if (variant === "chips") {
    return (
      <ul className={clsx(className, "flex flex-wrap gap-1.5")}>
        {techs.map((tech) => {
          const current = techList[tech];
          if (!current) return null;
          return (
            <li
              key={current.name}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.06] px-2.5 py-1 text-xs text-gray-700 dark:bg-white/10 dark:text-gray-200"
            >
              <span
                className={clsx(current.className, "text-sm leading-none")}
                style={current.style}
                aria-hidden="true"
              >
                <current.icon />
              </span>
              {current.name}
            </li>
          );
        })}
      </ul>
    );
  }

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
                  "text-md py-1 px-2 rounded-md",
                )}
                style={current.style}
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

type TechEntry = {
  icon: React.ComponentType;
  name: string;
  className: string;
  style?: React.CSSProperties;
};

const techList: Record<string, TechEntry> = {
  foundry: {
    icon: SiPalantir,
    name: "Foundry",
    className: "text-gray-800 dark:text-gray-100",
  },
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
    className: "tailwind-btn",
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
    className: "nodejs-btn",
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
    className: "prettier-btn",
  },
  git: {
    icon: SiGit,
    name: "Git",
    className: "git-btn",
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
    icon: FaAws,
    name: "AWS",
    className: "aws-btn",
  },
  dynamodb: {
    icon: FaAws,
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
  mui: {
    icon: SiMui,
    name: "Material-UI",
    className: "materialui-btn",
  },
  leaflet: {
    icon: SiLeaflet,
    name: "Leaflet.js",
    className: "leaflet-btn",
  },
  flask: {
    icon: SiFlask,
    name: "Flask",
    className: "flask-btn",
  },
  ai: {
    icon: GiArtificialIntelligence,
    name: "Machine Learning",
    className: "flask-btn",
  },
  angular: {
    icon: SiAngular,
    name: "Angular",
    className: "angular-btn",
  },
  java: {
    icon: FaJava,
    name: "Java",
    className: "java-btn",
  },
  spring: {
    icon: SiSpring,
    name: "Spring Boot",
    className: "spring-btn",
  },
  terraform: {
    icon: SiTerraform,
    name: "Terraform",
    className: "terraform-btn",
  },
  kubernetes: {
    icon: SiKubernetes,
    name: "Kubernetes",
    className: "kubernetes-btn",
    style: { backgroundColor: "#326ce5c9", color: "white" },
  },
  docker: {
    icon: SiDocker,
    name: "Docker",
    className: "docker-btn",
    style: { backgroundColor: "#2496edc9", color: "white" },
  },
  azure: {
    icon: VscAzure,
    name: "Azure",
    className: "azure-btn",
    style: { backgroundColor: "#0089d6c9", color: "white" },
  },
  electron: {
    icon: SiElectron,
    name: "Electron",
    className: "electron-btn",
  },
  tauri: {
    icon: SiTauri,
    name: "Tauri",
    className: "tauri-btn",
  },
  ffmpeg: {
    icon: SiFfmpeg,
    name: "FFmpeg",
    className: "ffmpeg-btn",
  },
  rust: {
    icon: SiRust,
    name: "Rust",
    className: "rust-btn",
  },
};
