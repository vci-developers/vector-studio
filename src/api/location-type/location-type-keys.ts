export const locationTypeKeys = {
    root: ['location-types'] as const,
    locationTypesByProgramId: (programId: number) =>
        ['location-types', programId] as const,
};
