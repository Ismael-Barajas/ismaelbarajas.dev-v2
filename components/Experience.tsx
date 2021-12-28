//TODO: create a constant json so we can map through content here or another method like that
const Experience = () => {
  return (
    <section id="experience">
      <div className="container mx-auto min-h-screen-without-nav items-center content-center px-3">
        <h2 className="text-center py-5">Experience</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="rounded-md p-6 shadow-sm hover:shadow-2xl  transition-shadow ease-in-out text-text bg-secondary">
            <div className="h-full">
              <a target="_blank" href="#" rel="noopener" className="h-full">
                <div className="h-24 max-h-24 text-center mb-3">
                  Image here probably
                </div>
                <div className="">
                  Main Body stuff here Lorem ipsum dolor sit amet, consectetur
                  adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo
                  consequat. Duis aute irure dolor in reprehenderit in voluptate
                  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
                  sint occaecat cupidatat non proident, sunt in culpa qui
                  officia deserunt mollit anim id est laborum.
                </div>
                <div className="flex flex-col mt-4 flex-grow justify-end">
                  <ul className="flex flex-wrap">
                    <li className="bg-primary text-white text-sm my-1 py-1 px-4 mr-2 rounded-md">
                      React
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
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
