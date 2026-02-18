import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Camera } from "lucide-react";

export function ProfileSection() {
    return (
        <section className="glass rounded-2xl p-8 backdrop-blur-md bg-white/70 border border-white/20 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 font-ui">Profile</h2>
                    <p className="text-sm text-gray-500 mt-1">Update your personal information and public profile.</p>
                </div>
            </div>

            <div className="max-w-2xl space-y-8">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                            <User className="w-10 h-10 text-gray-400" />
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">Profile Picture</h3>
                        <p className="text-sm text-gray-500 mb-2">JPG, GIF or PNG. Max size of 800K</p>
                        <Button variant="outline" size="sm" className="h-8 text-xs">Upload new</Button>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <Input defaultValue="Dr. Alex Chen" className="bg-white/50" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <Input defaultValue="alex.chen@university.edu" className="bg-white/50" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                            className="w-full min-h-[100px] rounded-md border border-input bg-white/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            defaultValue="Research lead focusing on room-temperature superconductivity and materials science."
                        />
                        <p className="text-xs text-gray-500">Brief description for your profile. URLs are hyperlinked.</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button className="bg-[#1C7C54] hover:bg-[#1B512D] text-white rounded-xl px-6">
                        Save Changes
                    </Button>
                </div>
            </div>
        </section>
    );
}
