import CurrentVersionSection from './current-version-section';
import DraftVersionSection from './draft-version-section';
import PreviousVersionsSection from './previous-versions-section';

interface FormVersionsListProps {
    programId: number;
}

export default function FormVersionsList({ programId }: FormVersionsListProps) {
    return (
        <div className="space-y-8">
            <CurrentVersionSection programId={programId} />
            <DraftVersionSection />
            <PreviousVersionsSection programId={programId} />
        </div>
    );
}
