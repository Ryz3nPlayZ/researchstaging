export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-silver p-4">
            <div className="w-full max-w-lg">
                {children}
            </div>
        </div>
    );
}
