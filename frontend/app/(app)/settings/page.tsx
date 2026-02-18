import { ProfileSection } from './_components/profile-section';
import { PreferencesSection } from './_components/preferences-section';
import { TeamSection } from './_components/team-section';

export default function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 font-ui tracking-tight">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account, preferences, and team members.</p>
            </div>

            <div className="space-y-8 pb-12">
                <ProfileSection />
                <div className="border-b border-gray-100" />
                <PreferencesSection />
                <div className="border-b border-gray-100" />
                <TeamSection />
            </div>
        </div>
    );
}
