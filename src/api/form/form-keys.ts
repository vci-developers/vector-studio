export const formKeys = {
    root: ['forms'] as const,
    formsByProgramId: (programId: number) => ['forms', programId] as const,
    currentFormByProgramId: (programId: number) =>
        ['forms', programId, 'current'] as const,
    draftByProgramId: (programId: number) =>
        ['forms', programId, 'draft'] as const,
    programFormByVersion: (programId: number, version: string) =>
        ['forms', programId, 'version', version] as const,
};
