import type { NextPage } from 'next';
import SEO from '../components/SEO';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { FiArrowLeft, FiTag, FiGitCommit, FiZap, FiBox } from 'react-icons/fi';
import Footer from '../components/landing/Footer';
import changelogData from '../data/changelog.json';

interface Change {
    type: string;
    title: string;
    description: string;
}

interface ChangelogEntry {
    version: string;
    date: string;
    title: string;
    description: string;
    changes: Change[];
}

const getIcon = (type: string) => {
    switch (type) {
        case 'feat': return <FiZap className="text-blue-400" />;
        case 'fix': return <FiBox className="text-amber-400" />;
        default: return <FiGitCommit className="text-gray-400" />;
    }
};

const fadeIn: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.8,
            ease: [0.21, 0.47, 0.32, 0.98] as const,
        },
    }),
};

const Changelog: NextPage = () => {
    const data = changelogData as ChangelogEntry[];

    return (
        <>
            <SEO
                title="Changelog | SafeScore"
                description="Stay updated with the latest features, improvements, and bug fixes in SafeScore."
            />
            <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#0a0a0a]/80 backdrop-blur-md px-4 py-4">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <Link href="/" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Home</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <img src="/logos.png" alt="SafeScore" className="h-8" />
                        </div>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="mb-16"
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                            Changelog
                        </h1>
                        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed">
                            We&apos;re constantly improving SafeScore to provide the most accurate football predictions.
                            Here&apos;s a log of everything we&apos;ve changed and improved.
                        </p>
                    </motion.div>

                    <div className="space-y-16 relative before:absolute before:left-[17px] before:top-2 before:bottom-0 before:w-px before:bg-zinc-800 md:before:left-1/2 md:before:-translate-x-px">
                        {data.map((entry, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ margin: "-100px" }}
                                transition={{ duration: 0.8 }}
                                className="relative pl-12 md:pl-0"
                            >
                                {/* Timeline Dot */}
                                <div className="absolute left-0 top-2 w-9 h-9 rounded-full bg-[#050505] border-2 border-blue-500 flex items-center justify-center z-10 md:left-1/2 md:-translate-x-1/2 md:top-4 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    <FiTag className="text-blue-500 text-sm" />
                                </div>

                                <div className={`flex flex-col md:w-1/2 ${index % 2 === 0 ? 'md:pr-16 md:text-right md:items-end' : 'md:pl-16 md:self-end md:ml-auto'}`}>
                                    <div className="flex flex-col gap-1 mb-4">
                                        <span className="text-blue-500 font-mono text-sm tracking-wider uppercase font-bold">
                                            Version {entry.version}
                                        </span>
                                        <span className="text-zinc-500 text-sm">{entry.date}</span>
                                    </div>

                                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-zinc-700 transition-colors shadow-xl backdrop-blur-sm">
                                        <h3 className="text-2xl font-bold mb-3">{entry.title}</h3>
                                        <p className="text-zinc-400 mb-8 leading-relaxed">
                                            {entry.description}
                                        </p>

                                        <div className="space-y-6">
                                            {entry.changes.map((change, cIdx) => (
                                                <div key={cIdx} className={`flex gap-4 ${index % 2 === 0 ? 'md:flex-row-reverse md:text-right' : ''}`}>
                                                    <div className="flex-shrink-0 mt-1">
                                                        {getIcon(change.type)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-zinc-200 mb-1 leading-tight">
                                                            {change.title}
                                                        </h4>
                                                        <p className="text-xs text-zinc-500 leading-normal">
                                                            {change.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="mt-32 p-12 rounded-3xl bg-gradient-to-b from-zinc-900/50 to-transparent border border-zinc-800 text-center"
                    >
                        <h2 className="text-2xl font-bold mb-4">Stay for the journey</h2>
                        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                            We have big plans for SafeScore. Follow founder on X to get real-time updates on new features.
                        </p>
                        <a
                            href="https://twitter.com/codebreak_er"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
                        >
                            Follow @codebreak_er
                        </a>
                    </motion.div>
                </main>

                <Footer />
            </div>
        </>
    );
};

export default Changelog;