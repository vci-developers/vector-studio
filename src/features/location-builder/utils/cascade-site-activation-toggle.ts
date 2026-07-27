import type { Site } from '@/api/site/contracts/site-schema';

// ── Entry point ───────────────────────────────────────────────────────────────

/** Applies one activation toggle to the draft of active siteIds, cascading it up to ancestors or down the subtree. */
export function cascadeSiteActivationToggle(
    accessibleSites: Site[],
    activeSiteIds: Set<number>,
    toggledSiteId: number,
    nextIsActive: boolean,
): Set<number> {
    if (nextIsActive) {
        return new Set([
            ...activeSiteIds,
            ...collectSiteAndAncestorSiteIds(accessibleSites, toggledSiteId),
        ]);
    }

    const deactivatedSiteIds = collectSiteAndDescendantSiteIds(
        accessibleSites,
        toggledSiteId,
    );

    return new Set(
        [...activeSiteIds].filter(siteId => !deactivatedSiteIds.has(siteId)),
    );
}

// ── Tree walks ────────────────────────────────────────────────────────────────

/** Returns siteId plus every ancestor above it; stops at the topmost accessible Site, and on a parentId cycle. */
function collectSiteAndAncestorSiteIds(
    accessibleSites: Site[],
    siteId: number,
): Set<number> {
    const accessibleSitesById = new Map(
        accessibleSites.map(site => [site.siteId, site]),
    );
    const siteAndAncestorSiteIds = new Set<number>();
    let currentSite = accessibleSitesById.get(siteId);

    while (currentSite && !siteAndAncestorSiteIds.has(currentSite.siteId)) {
        siteAndAncestorSiteIds.add(currentSite.siteId);
        currentSite =
            currentSite.parentId == null
                ? undefined
                : accessibleSitesById.get(currentSite.parentId);
    }

    return siteAndAncestorSiteIds;
}

/** Returns siteId plus every accessible descendant beneath it, at any depth. */
function collectSiteAndDescendantSiteIds(
    accessibleSites: Site[],
    siteId: number,
): Set<number> {
    const childSiteIdsByParentId = new Map<number, number[]>();
    for (const site of accessibleSites) {
        if (site.parentId == null) continue;
        const siblingSiteIds = childSiteIdsByParentId.get(site.parentId);
        if (siblingSiteIds) {
            siblingSiteIds.push(site.siteId);
        } else {
            childSiteIdsByParentId.set(site.parentId, [site.siteId]);
        }
    }

    const siteAndDescendantSiteIds = new Set<number>();

    /** Adds currentSiteId and recurses into its children; already-visited ids are skipped. */
    function visitSiteAndDescendants(currentSiteId: number) {
        if (siteAndDescendantSiteIds.has(currentSiteId)) return;
        siteAndDescendantSiteIds.add(currentSiteId);
        const childSiteIds = childSiteIdsByParentId.get(currentSiteId) ?? [];
        for (const childSiteId of childSiteIds) {
            visitSiteAndDescendants(childSiteId);
        }
    }

    visitSiteAndDescendants(siteId);

    return siteAndDescendantSiteIds;
}
