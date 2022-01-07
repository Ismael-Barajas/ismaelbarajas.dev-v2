import Image from "next/image";

//TODO: create a constant json so we can map through content here or another method like that
const Experience = () => {
  return (
    <section id="experience">
      <div className="container mx-auto min-h-screen-without-nav items-center content-center px-3 pb-16">
        {/* TODO: Header text needs to stand out more think about it */}
        <h2 className="text-center py-5">Experience</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="rounded-md p-6 shadow-card hover:shadow-h-card  transition-all ease-in-out duration-300 text-text bg-secondary">
            <div className="h-full">
              <a target="_blank" href="#" rel="noopener" className="h-full">
                <div className="relative h-24 max-h-24 text-center mb-2 transition-shadow duration-500 ease-in-out hover:shadow-h-card rounded-sm">
                  <Image
                    src={"/PurposerLogo.png"}
                    layout="fill"
                    alt="test"
                    objectFit="contain"
                  />
                </div>
              </a>
              <div className="text-center text-sm py-3 text-gray-500 dark:text-gray-400">
                <p>UX/UI Developer - Internship</p>
                <p>Jul 2021 - Current</p>
              </div>
              <div className="text-lg leading-relaxed">
                {/* 
                  TODO: Use array of strings to create separate paragraphs :3
                  */}
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                  cupidatat non proident, sunt in culpa qui officia deserunt
                  mollit anim id est laborum.
                </p>
              </div>
              {/* 
                TODO: the list items will be different colors depending on 
                the tech being used  
                */}
              <div className="flex flex-col mt-4 flex-grow justify-end">
                <ul className="flex flex-wrap">
                  <li className="react-btn text-sm my-1 py-1 px-4 mr-2 rounded-md">
                    React.js
                  </li>
                  <li className="javascript-btn text-sm my-1 py-1 px-4 mr-2 rounded-md">
                    JavaScript
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
