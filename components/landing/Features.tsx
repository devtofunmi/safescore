import { FaChartLine, FaShieldHalved, FaEarthAmericas, FaBolt } from 'react-icons/fa6';

const features = [
    {
        name: 'Smart Risk Filtering',
        description:
            'Choose between Safe, Very Safe, or Medium Safe. The system adjusts confidence thresholds based on your selected risk level. Matches are filtered strictly to ensure only the highest probability outcomes make the cut.',
        icon: FaShieldHalved,
        visual: (
            <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Risk Setting</span>
                        <span className="bg-green-500 text-xs px-2 py-1 rounded">SAFE MODE</span>
                    </div>
                    <div className="text-sm opacity-80">Threshold: &gt; 85% Probability</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white opacity-80">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Arsenal vs Chelsea</span>
                        <span className="bg-green-500 text-xs px-2 py-1 rounded">PASSED</span>
                    </div>
                    <div className="text-sm opacity-80">Confidence: 89% (Safe)</div>
                </div>
            </div>
        )
    },
    {
        name: 'Global League Coverage',
        description:
            'Coverage across 14+ major leagues, from the Premier League to the Eredivisie. We analyze lesser-known leagues where value bets are often hidden, using consistent statistical analysis across the board.',
        icon: FaEarthAmericas,
        visual: (
            <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Premier League</span>
                        <span className="bg-blue-400 text-xs px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="text-sm opacity-80">6 Matches Analyzed</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white opacity-90">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">La Liga</span>
                        <span className="bg-blue-400 text-xs px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="text-sm opacity-80">4 Matches Analyzed</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white opacity-80">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Eredivisie</span>
                        <span className="bg-blue-400 text-xs px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="text-sm opacity-80">3 Matches Analyzed</div>
                </div>
            </div>
        )
    },
    {
        name: 'Data-Driven Insights',
        description:
            'Predictions are generated using match stats, team form, and historical data — not gut feeling. We accept that no system is perfect, but data beats guessing every time in the long run.',
        icon: FaChartLine,
        visual: (
            <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Team Form</span>
                        <span className="bg-purple-500 text-xs px-2 py-1 rounded">High</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2 mt-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <div className="text-xs mt-1 opacity-70">Last 5: W W D W W</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white opacity-90">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">H2H Record</span>
                        <span className="bg-purple-500 text-xs px-2 py-1 rounded">Advantage</span>
                    </div>
                    <div className="text-sm opacity-80">Home team won 4 of last 5</div>
                </div>
            </div>
        )
    },
    {
        name: 'Instant & Free',
        description:
            'No signup required. No paywalls. Access predictions instantly while the platform is in active testing. We believe in transparency and providing value first.',
        icon: FaBolt,
        visual: (
            <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Subscription</span>
                        <span className="bg-yellow-500 text-xs px-2 py-1 rounded text-black font-bold">FREE</span>
                    </div>
                    <div className="text-sm opacity-80">$0.00 / Month</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white opacity-80">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Access</span>
                        <span className="bg-green-500 text-xs px-2 py-1 rounded">Granted</span>
                    </div>
                    <div className="text-sm opacity-80">Instant Analysis Unlocked</div>
                </div>
            </div>
        )
    },
];

const Features = () => {
    return (
        <div className="py-24 bg-gray-50 dark:bg-zinc-950 overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-base font-semibold uppercase tracking-wide text-blue-400">Features</h2>
                    <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Why Bettors Trust SafeScore
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
                        We don’t promise <span className="font-bold text-blue-400">"guaranteed"</span> wins.
                        We provide statistical insights designed to help you make smarter decisions over time.
                    </p>
                </div>

                <div className="space-y-24">
                    {features.map((feature, index) => (
                        <div key={feature.name} className={`flex flex-col lg:flex-row gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                            {/* Text Section */}
                            <div className="flex-1 text-center lg:text-left">
                                <span className="inline-flex items-center justify-center rounded-xl bg-blue-400 p-3 shadow-lg mb-6">
                                    <feature.icon className="h-8 w-8 text-white" aria-hidden="true" />
                                </span>
                                <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                                    {feature.name}
                                </h3>
                                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>

                            {/* Visual Card Section */}
                            <div className="flex-1 w-full max-w-md lg:max-w-full">
                                <div className="relative transform bg-gradient-to-br from-blue-400 to-indigo-800 rounded-2xl shadow-2xl p-8 rotate-1 hover:rotate-0 transition-all duration-500">
                                    {/* Decorative Elements */}
                                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-white opacity-5 blur-2xl"></div>
                                    <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-24 h-24 rounded-full bg-blue-400 opacity-10 blur-2xl"></div>

                                    {/* Card Content */}
                                    <div className="relative z-10">
                                        {feature.visual}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Features;
