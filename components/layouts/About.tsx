import { TypedText } from "components";
import { Fragment, useMemo } from "react";
import Image from "next/image";
import { FiEdit2, FiMail } from "react-icons/fi";
import { HiOutlineArrowDown } from "react-icons/hi";
import { Button } from "components/library/Button";
import ContentIcon from "components/library/ContentIcon";
import { AnimatedBars } from "components/library/NowPlaying";
import SteamStatusDot from "components/library/steam/SteamStatusDot";
import { SortableList } from "components/admin/lazy";
import { useAdmin, useProfile, useReorderFacts } from "hooks";
import useNowPlaying from "hooks/useNowPlaying";
import useSteamPresence from "hooks/useSteamPresence";
import { ageInYears } from "lib/age";
import { openDrawer, useAdminView } from "lib/adminStore";
import { splitAge } from "lib/content/bio";
import type { Profile } from "lib/types/content";

const CHIP =
  "inline-flex items-center gap-1.5 rounded-full bg-black/[0.06] px-3 py-1.5 text-sm text-gray-700 dark:bg-white/10 dark:text-gray-200";

const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 64;
  window.scrollTo({ top, behavior: "smooth" });
  window.history.pushState(null, "", `#${id}`);
};

const About = ({ initialProfile }: { initialProfile: Profile }) => {
  const { profile, isDefault } = useProfile(initialProfile);
  const { isAdmin } = useAdmin();
  const adminView = useAdminView();
  const reorderFacts = useReorderFacts();
  // Computed on every render: ISR HTML can be a day old, so the span below
  // suppresses the hydration warning when the client's age differs.
  const age = ageInYears();
  // Facts have no ids; the index + label is stable enough for one drag.
  const sortableFacts = useMemo(
    () => profile.facts.map((fact, i) => ({ id: `${i}-${fact.label}`, ...fact })),
    [profile.facts],
  );
  const editing = isAdmin && adminView;
  const { data: song } = useNowPlaying();
  // Only an actively playing track earns the line; paused and last-played
  // states show nothing here.
  const listening = song?.isPlaying && song.songUrl ? song : null;
  const { data: steam } = useSteamPresence();
  // Likewise, only an active game earns a line; online, offline,
  // unavailable, disabled and loading all show nothing.
  const playing = steam?.state === "playing" ? steam.game : undefined;

  return (
    <div className="container min-h-screen-without-nav flex items-center">
      <div className="grid w-full items-center gap-12 py-16 md:grid-cols-[1.25fr_1fr] md:gap-16">
        <div className="order-2 space-y-6 md:order-1">
          <h2 className="font-display font-black text-text text-5xl">
            <TypedText
              className="animated-underline"
              strings={["About Me."]}
              loop={false}
              whiteSpace={"normal"}
            />
          </h2>
          {editing && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button
                variant="frosted"
                onClick={() => openDrawer({ kind: "profile", mode: "edit" })}
              >
                <FiEdit2 className="h-4 w-4" aria-hidden="true" />
                Edit About
              </Button>
              {isDefault && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Showing built-in content — save once to start editing.
                </p>
              )}
            </div>
          )}
          <div className="space-y-4 text-lg text-text">
            {profile.bio.map((paragraph, index) => (
              <p key={index}>
                {splitAge(paragraph).map((text, part) => (
                  <Fragment key={part}>
                    {part > 0 && <span suppressHydrationWarning>{age}</span>}
                    {text}
                  </Fragment>
                ))}
              </p>
            ))}
          </div>

          {editing ? (
            <div role="group" aria-label="Quick facts">
              <SortableList
                items={sortableFacts}
                strategy="grid"
                as="ul"
                itemAs="li"
                className="flex flex-wrap gap-2"
                getLabel={(fact) => fact.label}
                onReorder={(next) =>
                  reorderFacts(
                    next.map(({ label, icon }) => ({ label, icon })),
                  )
                }
                renderItem={(fact, handle) => (
                  <span
                    {...handle}
                    className={`${CHIP} touch-none cursor-grab outline-dashed outline-1 outline-offset-2 outline-black/25 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-text active:cursor-grabbing dark:outline-white/30`}
                  >
                    <ContentIcon icon={fact.icon} className="h-3.5 w-3.5" />
                    {fact.label}
                  </span>
                )}
              />
            </div>
          ) : (
            <ul className="flex flex-wrap gap-2" aria-label="Quick facts">
              {profile.facts.map((fact) => (
                <li key={fact.label} className={CHIP}>
                  <ContentIcon icon={fact.icon} className="h-3.5 w-3.5" />
                  {fact.label}
                </li>
              ))}
            </ul>
          )}

          {/* div, not p: AnimatedBars renders block elements, which are
              invalid inside a paragraph and break hydration. */}
          {listening && (
            <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="inline-flex [&>div]:w-auto">
                <AnimatedBars
                  color={listening.palette?.vibrant}
                  align="justify-start"
                />
              </span>
              <span>
                Right now I&apos;m listening to{" "}
                <a
                  href={listening.songUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="animated-underline font-medium text-text"
                >
                  {listening.title}
                </a>{" "}
                by {listening.artist}
              </span>
            </div>
          )}

          {playing && (
            <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-600 dark:text-gray-400">
              <SteamStatusDot status="playing" />
              <span>
                Right now I&apos;m playing{" "}
                {playing.storeUrl ? (
                  <a
                    href={playing.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="animated-underline font-medium text-text"
                  >
                    {playing.name}
                  </a>
                ) : (
                  <span className="font-medium text-text">{playing.name}</span>
                )}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("contact");
              }}
            >
              <FiMail className="h-4 w-4" aria-hidden="true" />
              Get in touch
            </Button>
            <Button
              variant="ghost"
              href="#projects"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("projects");
              }}
            >
              See projects
              <HiOutlineArrowDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="order-1 flex justify-center md:order-2">
          <div className="relative h-80 w-72 overflow-hidden rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition-transform duration-500 ease-out hover:-translate-y-1">
            <Image
              src={profile.photoUrl}
              alt="Ismael Barajas"
              fill
              sizes="288px"
              loading="eager"
              className="object-cover"
              quality={100}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
