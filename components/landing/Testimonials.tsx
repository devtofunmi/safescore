import React from 'react';
import { motion } from 'framer-motion';
import { FaTwitter } from 'react-icons/fa';

const testimonials = [
    {
        name: 'Mr Levy',
        handle: '@curlyhair_dev',
        text: 'I’m pumped!!!🔥🔥',
        image: '/levy.jpeg'
    },
    {
        name: 'Victor Tenold',
        handle: '@victortenold',
        text: 'Trust is built in layers. Nice progress, keep iterating',
        image: '/victor.jpeg'
    },
    {
        name: 'Zoey Zhang',
        handle: '@SaaSScout_',
        text: 'love a niche b2c play. a tough but rewarding space.',
        image: '/zoey.jpeg'
    },
    {
        name: 'MPI',
        handle: '@RealPasternak',
        text: "Ohhh all the gamblers betting on games will LOOVE this. It's like the Bloomberg for sports betting",
        image: '/mpi.jpeg'
    },
    {
        name: 'Subhan Malik',
        handle: '@subhanmalik911',
        text: "This UI is fire, what tool you using for design? Let’s connect bro",
        image: '/subhan.jpeg'
    },
    {
        name: 'Tight Studio',
        handle: '@tight_studio',
        text: 'Love the attention to detail, dynamic states feel polished.',
        image: '/tight_studio.jpeg'
    },
    {
        name: 'Vice Mayor',
        handle: '@real_vicemayor',
        text: "Let's go 🚀🚀🚀",
        image: '/vice.jpeg'
    },
    {
        name: 'Him',
        handle: '@YoungLad_Him',
        text: '🔥🔥🔥LFG !!',
        image: '/him.jpeg'
    },
    {
        name: 'Michael',
        handle: '@InsightCracker',
        text: '🚀',
        image: '/michael.jpeg'
    },
    {
        name: 'Blank',
        handle: '@Balde_Arc',
        text: 'Get in',
        image: '/blank.jpeg'
    }
];

const Row1 = [...testimonials.slice(0, 4), ...testimonials.slice(0, 4)];
const Row2 = [...testimonials.slice(4), ...testimonials.slice(4)];

const MarqueeRow = ({ items, reverse = false }: { items: any[], reverse?: boolean }) => {
    return (
        <div className="relative flex overflow-x-hidden py-4 w-full">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes marquee-reverse {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
                .animate-marquee-reverse {
                    animation: marquee-reverse 40s linear infinite;
                }
                .pause-on-interaction:hover, 
                .pause-on-interaction:active {
                    animation-play-state: paused !important;
                }
            `}} />
            <div
                className={`flex whitespace-nowrap gap-6 pause-on-interaction ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
            >
                {items.map((t, i) => (
                    <a
                        key={`${t.handle}-${i}`}
                        href={`https://x.com/${t.handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block md:w-[350px] w-[250px] whitespace-normal bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-white/5 relative group/card hover:border-blue-400/50 transition-all hover:scale-[1.02] shrink-0 cursor-pointer block no-underline"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={t.image}
                                    alt={t.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-400/20"
                                />
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{t.name}</h4>
                                    <span className="text-xs text-blue-400 group-hover/card:text-blue-300 transition-colors">
                                        {t.handle}
                                    </span>
                                </div>
                            </div>
                            <FaTwitter className="text-blue-400 opacity-20 group-hover/card:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">
                            &quot;{t.text}&quot;
                        </p>
                        <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-blue-400/5 blur-2xl rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                    </a>
                ))}
            </div>
        </div>
    );
};

const Testimonials: React.FC = () => {
    return (
        <section className="py-24 bg-white dark:bg-[#050505] overflow-hidden border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-base font-semibold uppercase tracking-wide text-blue-400">Wall of Love</h2>
                    <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                        What Early Users Are Saying
                    </p>
                    <p className="mt-4 max-w-2xl text-lg text-gray-500 dark:text-gray-400 mx-auto leading-relaxed">
                        Real feedback from people testing SafeScore predictions.
                    </p>
                </motion.div>

                {/* Marquee Rows with Fade-In animation (Repeatable) */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative"
                >
                    <MarqueeRow items={Row1} />
                    <MarqueeRow items={Row2} reverse />

                    {/* Global Gradient Fades for Smooth Edges */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white dark:from-black to-transparent z-10"></div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white dark:from-black to-transparent z-10"></div>
                </motion.div>
            </div>
        </section>
    );
};

export default Testimonials;