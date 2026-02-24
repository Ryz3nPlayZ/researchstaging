import { Button } from "@/components/ui/button";
import { UserPlus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const TEAM_MEMBERS = [
    { id: 1, name: "Dr. Alex Chen", email: "alex.chen@university.edu", role: "Owner", avatar: "AC" },
    { id: 2, name: "Sarah Miller", email: "sarah.m@university.edu", role: "Editor", avatar: "SM" },
    { id: 3, name: "David Kim", email: "david.kim@research.org", role: "Viewer", avatar: "DK" },
];

export function TeamSection() {
    return (
        <section className="glass rounded-2xl p-8 backdrop-blur-md bg-white/70 border border-white/20 shadow-sm transition-all hover:shadow-md">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-gray-900 font-ui">Team Members</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage access to your workspace.</p>
                </div>

                <div className="lg:col-span-2 space-y-4 max-w-2xl">
                    <div className="flex justify-end mb-4">
                        <Button className="bg-[#1C7C54] hover:bg-[#1B512D] text-white rounded-xl gap-2 shadow-sm">
                            <UserPlus size={16} /> Invite Member
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {TEAM_MEMBERS.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
                                            {member.avatar}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{member.name}</h3>
                                        <p className="text-xs text-gray-500">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                        {member.role}
                                    </div>
                                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm">
                        <p className="flex items-center gap-2">
                            <span className="font-semibold">Note:</span>
                            Team management features are currently in beta.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
