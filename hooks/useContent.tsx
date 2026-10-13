import useSWR from "swr";
import { ADMIN_KEYS, PUBLIC_KEYS } from "lib/adminApi";
import fetcher from "lib/fetcher";
import type {
  ContactLinkItem,
  ExperienceItem,
  Profile,
  ProjectItem,
} from "lib/types/content";
import useAdmin from "./useAdmin";

/**
 * Homepage content reads. Visitors hit the public, CDN-cached endpoints
 * exactly as before; a signed-in admin reads the uncached /api/admin/*
 * endpoints instead (rows carry `id`), whether or not the admin view is on.
 * `key` is the SWR key in use, for mutate() and useReorder.
 */

interface ListResponse<T> {
  items: T[];
}

interface ListResult<T> {
  items: T[] | undefined;
  error: unknown;
  isLoading: boolean;
  isAdmin: boolean;
  key: string;
}

function useList<T>(adminKey: string, publicKey: string): ListResult<T> {
  const { isAdmin } = useAdmin();
  const key = isAdmin ? adminKey : publicKey;
  // keepPreviousData: when the session confirms and the key flips to the
  // admin endpoint, keep showing the public list instead of a blank section.
  const { data, error, isLoading } = useSWR<ListResponse<T>>(key, fetcher, {
    keepPreviousData: true,
  });
  return { items: data?.items, error, isLoading, isAdmin, key };
}

export const useProjects = (): ListResult<ProjectItem> =>
  useList<ProjectItem>(ADMIN_KEYS.projects, PUBLIC_KEYS.projects);

export const useExperiences = (): ListResult<ExperienceItem> =>
  useList<ExperienceItem>(ADMIN_KEYS.experiences, PUBLIC_KEYS.experiences);

/**
 * The About section's content. `initial` comes from getStaticProps and is
 * what visitors see; an admin sees it until the uncached copy arrives.
 * `isDefault` is true while no profile row has been saved yet.
 */
export function useProfile(initial: Profile): {
  profile: Profile;
  isDefault: boolean;
} {
  const { isAdmin } = useAdmin();
  const { data } = useSWR<{ profile: Profile; isDefault: boolean }>(
    isAdmin ? ADMIN_KEYS.profile : null,
    fetcher,
  );
  return {
    profile: (isAdmin && data?.profile) || initial,
    isDefault: isAdmin && data ? data.isDefault : false,
  };
}

/**
 * The Contact section's links. Same idea as useProfile; an admin whose table
 * is still empty sees `initial` (the defaults) with `isDefault` set, so the
 * section can give them stand-in ids and save them on the first change.
 */
export function useContactLinks(initial: ContactLinkItem[]): {
  links: ContactLinkItem[];
  isDefault: boolean;
  isAdmin: boolean;
} {
  const { isAdmin } = useAdmin();
  const { data } = useSWR<ListResponse<ContactLinkItem>>(
    isAdmin ? ADMIN_KEYS.contactLinks : null,
    fetcher,
  );
  const items = isAdmin ? data?.items : undefined;
  if (items === undefined) return { links: initial, isDefault: false, isAdmin };
  if (items.length === 0) return { links: initial, isDefault: true, isAdmin };
  return { links: items, isDefault: false, isAdmin };
}
