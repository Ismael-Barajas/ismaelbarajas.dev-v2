import Image from "next/image";
import { CodeIcon, ExternalLinkIcon } from "@heroicons/react/outline";

const Projects = () => {
  return (
    <div className="container mx-auto min-h-screen-without-nav px-3 pb-16">
      <h2 className="text-center py-5">Projects</h2>
      <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 justify-items-center">
        <div className="rounded-md shadow-card hover:shadow-h-card  transition-all ease-in-out duration-300 text-text bg-background max-w-lg">
          <div className="h-full">
            <div className="relative h-52 max-h-52 text-center mb-2">
              <Image
                src={"/PurposerLogo.png"}
                layout="fill"
                alt="test"
                objectFit="cover"
              />
            </div>
            <div className="flex justify-center py-3">
              <a
                href="#"
                className="flex transition-all ease-in-out hover:shadow-card items-center bg-primary text-white text-sm my-1 py-1 px-3 mr-2 rounded-md duration-500 hover:bg-[#ce4f35dc]"
              >
                <ExternalLinkIcon className="h-5 w-5 mr-1" />
                Visit
              </a>
              <a
                href="#"
                className="flex transition-all ease-in-out hover:shadow-card items-center bg-primary text-white text-sm my-1 py-1 px-3 mr-2 rounded-md duration-500 hover:bg-[#ce4f35dc]"
              >
                <CodeIcon className="h-5 w-5 mr-1" />
                GitHub
              </a>
            </div>
            <div className="text-lg leading-relaxed px-3">
              {/* 
                  TODO: can do array of strings to have separate paragraphs :o
                  */}
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
            {/* 
                TODO: the list items will be different colors depending on 
                the tech being used  
                */}
            <div className="flex flex-col mt-4 flex-grow justify-end px-3 pb-3">
              <ul className="flex flex-wrap">
                <li className="bg-primary text-white text-sm my-1 py-1 px-4 mr-2 rounded-md">
                  react.js
                </li>
                <li className="bg-primary text-white text-sm my-1 py-1 px-4 mr-2 rounded-md">
                  JavaScript
                </li>
                <li className="bg-primary text-white text-sm my-1 py-1 px-4 mr-2 rounded-md">
                  React
                </li>
                <li className="bg-primary text-white text-sm my-1 py-1 px-4 mr-2 rounded-md">
                  React
                </li>
                <li className="bg-primary text-white text-sm my-1 py-1 px-4 mr-2 rounded-md">
                  React
                </li>
                <li className="bg-primary text-white text-sm my-1 py-1 px-4 mr-2 rounded-md">
                  React
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
