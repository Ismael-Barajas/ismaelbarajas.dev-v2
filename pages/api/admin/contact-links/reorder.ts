import { createReorderHandler } from "lib/reorderRoute";

/** Contact links are baked into the statically generated homepage. */
export default createReorderHandler("contactLink", { revalidate: ["/"] });
