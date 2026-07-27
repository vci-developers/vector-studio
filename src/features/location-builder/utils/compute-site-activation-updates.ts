import type { Site } from '@/api/site/contracts/site-schema';

// ── Entry point ───────────────────────────────────────────────────────────────

/** Returns the Sites whose isActive differs from the draft; deactivations deepest-first, activations shallowest-first. */
export function computeSiteActivationUpdates(
    accessibleSites: Site[],
    activeSiteIds: Set<number>,
): Site[] {
    const accessibleSitesById = new Map(
        accessibleSites.map(site => [site.siteId, site]),
    );
    const changedSitesShallowestFirst = accessibleSites
        .filter(site => site.isActive !== activeSiteIds.has(site.siteId))
        .sort(
            (firstSite, secondSite) =>
                countAccessibleAncestors(accessibleSitesById, firstSite) -
                countAccessibleAncestors(accessibleSitesById, secondSite),
        );
    const sitesToDeactivateDeepestFirst = changedSitesShallowestFirst
        .filter(site => site.isActive)
        .reverse();
    const sitesToActivateShallowestFirst = changedSitesShallowestFirst.filter(
        site => !site.isActive,
    );

    return [
        ...sitesToDeactivateDeepestFirst,
        ...sitesToActivateShallowestFirst,
    ];
}

// ── Accessible depth ──────────────────────────────────────────────────────────

/** Counts the ancestors above site within canAccessSites; 0 for an accessible root, and bounded on a parentId cycle. */
function countAccessibleAncestors(
    accessibleSitesById: Map<number, Site>,
    site: Site,
): number {
    let ancestorCount = 0;
    let currentSite = site;

    while (
        currentSite.parentId != null &&
        ancestorCount <= accessibleSitesById.size
    ) {
        const parentSite = accessibleSitesById.get(currentSite.parentId);
        if (!parentSite) break;
        currentSite = parentSite;
        ancestorCount += 1;
    }

    return ancestorCount;
}
