import LocationBuilderPageClient from '@/features/location-builder/components/location-builder-page-client';
import LocationBuilderPageShell from '@/features/location-builder/components/layout/location-builder-page-shell';

export default function LocationsPage() {
    return (
        <LocationBuilderPageShell>
            <LocationBuilderPageClient />
        </LocationBuilderPageShell>
    );
}
