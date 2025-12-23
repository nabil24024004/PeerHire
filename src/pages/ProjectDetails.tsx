import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Github, Layers, Code, Cpu, Palette } from "lucide-react";

const ProjectDetails = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    // Mock Data for "PeerHire" - In a real app, fetch from Supabase "projects" table
    const project = {
        id: "peerhire",
        category: "Web App",
        title: "PeerHire",
        subtitle: "A university-exclusive platform for outsourcing varsity work",
        description: "PeerHire is a specialized freelance marketplace designed exclusively for university students. It solves the problem of academic collaboration by connecting students who need help with assignments, lab reports, and projects with peers who have the skills to assist instantly. Unlike general freelancer platforms, PeerHire verifies student status via university email, ensuring a trusted and secure environment for academic outsourcing.",
        links: {
            demo: "https://peerhire.aaub.edu.bd",
            behance: "#",
            github: "https://github.com/nabil24024004/PeerHire"
        },
        techStack: {
            software: ["React.js", "TypeScript", "Vite", "Supabase", "Tailwind CSS", "Shadcn/UI"],
            hardware: ["Standard Dev Machines", "Cloud Serverless Infrastructure"],
            materials: ["Custom Flat Vector Illustrations", "Google Fonts (Inter)", "Lucide Icons"]
        },
        images: [
            "/hero-illustration-flat.png",
            "/auth-illustration-flat.png",
            "/auth-illustration.png" // The older 3D one as a variant
        ]
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-white/5 gap-2"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Projects
                    </Button>
                    <div className="font-bold text-xl tracking-tighter">Neura Labs</div>
                    <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6">
                        Book a Call
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-5xl">
                    <div className="space-y-6 animate-fade-in-up">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-sm font-medium text-purple-400 border border-purple-500/20">
                            {project.category}
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                            {project.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl leading-relaxed">
                            {project.subtitle}
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <Button size="lg" className="bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-full h-12 px-8">
                                View Live Site <ExternalLink className="ml-2 w-4 h-4" />
                            </Button>
                            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full h-12 px-8 bg-transparent">
                                Behance Case Study
                            </Button>
                        </div>
                    </div>

                    <div className="mt-16 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/20">
                        <img
                            src={project.images[0]}
                            alt="Project Hero"
                            className="w-full h-auto object-cover"
                        />
                    </div>
                </div>
            </section>

            {/* Project Details Grid */}
            <section className="py-20 bg-white/5 border-y border-white/5">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="grid md:grid-cols-3 gap-12">

                        {/* About */}
                        <div className="md:col-span-2 space-y-8">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <Layers className="w-6 h-6 text-purple-400" />
                                What this project is all about
                            </h3>
                            <p className="text-gray-400 leading-relaxed text-lg">
                                {project.description}
                            </p>

                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <h4 className="font-bold mb-2 text-purple-300">Role</h4>
                                    <p className="text-gray-400">Full Stack Development</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <h4 className="font-bold mb-2 text-purple-300">Timeline</h4>
                                    <p className="text-gray-400">4 Weeks</p>
                                </div>
                            </div>
                        </div>

                        {/* Tech Stack Sidebar */}
                        <div className="space-y-8">
                            <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Code className="w-5 h-5 text-blue-400" /> Software
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.techStack.software.map(tech => (
                                        <span key={tech} className="px-3 py-1 rounded-md bg-blue-500/10 text-blue-300 text-sm border border-blue-500/20">
                                            {tech}
                                        </span>
                                    ))}
                                </div>

                                <div className="w-full h-px bg-white/10" />

                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Cpu className="w-5 h-5 text-green-400" /> Hardware
                                </h3>
                                <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
                                    {project.techStack.hardware.map(item => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>

                                <div className="w-full h-px bg-white/10" />

                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-pink-400" /> Materials
                                </h3>
                                <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
                                    {project.techStack.materials.map(item => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Gallery / Previews */}
            <section className="py-20 px-6">
                <div className="container mx-auto max-w-6xl space-y-12">
                    <h2 className="text-4xl font-bold text-center">Some Key Previews</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {project.images.slice(1).map((img, idx) => (
                            <div key={idx} className="group relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 aspect-[4/3] hover:border-purple-500/50 transition-colors">
                                <img
                                    src={img}
                                    alt={`Preview ${idx + 1}`}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                                    <p className="text-white font-medium">Interface Preview {idx + 1}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Other Projects Footer */}
            <section className="py-20 border-t border-white/10 bg-[#050505]">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-8">Discover More Projects</h2>
                    <div className="flex justify-center gap-4">
                        <div className="w-64 h-40 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-gray-500">
                            Coming Soon
                        </div>
                        <div className="w-64 h-40 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-gray-500">
                            Coming Soon
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProjectDetails;
