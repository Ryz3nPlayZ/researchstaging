import { Button } from "@/components/ui/button";
import { Moon, Sun, Bell, Mail, MessageSquare } from "lucide-react";

export function PreferencesSection() {
    return (
        <section className="glass rounded-2xl p-8 backdrop-blur-md bg-white/70 border border-white/20 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 font-ui">Preferences</h2>
                    <p className="text-sm text-gray-500 mt-1">Customize your workspace experience.</p>
                </div>
            </div>

            <div className="max-w-2xl space-y-8">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg h-fit">
                            <Moon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">Appearance</h3>
                            <p className="text-sm text-gray-500">Select your preferred theme.</p>
                        </div>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button className="px-3 py-1.5 rounded-md bg-white shadow-sm text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Sun size={14} /> Light
                        </button>
                        <button className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-2">
                            <Moon size={14} /> Dark
                        </button>
                    </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Notifications */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Bell size={18} /> Notifications
                    </div>

                    <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                            <div className="mt-1">
                                <Mail className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                                <label htmlFor="email-digest" className="font-medium text-gray-700 cursor-pointer">Email Digest</label>
                                <p className="text-sm text-gray-500">Receive a daily summary of project activity.</p>
                            </div>
                        </div>
                        <input type="checkbox" id="email-digest" className="w-5 h-5 rounded border-gray-300 text-[#1C7C54] focus:ring-[#1C7C54]" defaultChecked />
                    </div>

                    <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                            <div className="mt-1">
                                <MessageSquare className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                                <label htmlFor="new-comments" className="font-medium text-gray-700 cursor-pointer">New Comments</label>
                                <p className="text-sm text-gray-500">Get notified when someone comments on your documents.</p>
                            </div>
                        </div>
                        <input type="checkbox" id="new-comments" className="w-5 h-5 rounded border-gray-300 text-[#1C7C54] focus:ring-[#1C7C54]" defaultChecked />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button className="bg-[#1C7C54] hover:bg-[#1B512D] text-white rounded-xl px-6">
                        Save Preferences
                    </Button>
                </div>
            </div>
        </section>
    );
}
