import { motion } from 'framer-motion';

const steps = [
    {
        id: 1,
        title: 'Select Leagues',
        description: 'Choose which competitions you want to bet on. Mix and match across 14+ global leagues.',
    },
    {
        id: 2,
        title: 'Choose Risk Level',
        description: 'Select "Very Safe" for high-probability low-yield, or "Safe" for high-yield moonshots.',
    },
    {
        id: 3,
        title: 'Get Predictions',
        description: 'Our system generates match predictions instantly. Use them to build your own slip on your preferred bookie.',
    },
];

const HowItWorks = () => {
    return (
        <div id="how-it-works" className="py-24 bg-white dark:bg-black overflow-hidden lg:py-32">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative lg:grid lg:grid-cols-2 lg:gap-24 lg:items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            How SafeScore Works
                        </h2>
                        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                            Our process is transparent and instant. Complex data analysis happens in milliseconds to give you a clear edge.
                        </p>

                        <dl className="mt-10 space-y-10">
                            {steps.map((step, index) => (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ margin: "-50px" }}
                                    transition={{ duration: 0.5, delay: index * 0.2 }}
                                    className="relative"
                                >
                                    <dt>
                                        <div className="absolute flex h-12 w-12 items-center justify-center rounded-xl bg-blue-400 text-white font-bold text-xl ring-2 ring-white dark:ring-black">
                                            {step.id}
                                        </div>
                                        <p className="ml-16 text-lg font-medium leading-6 text-gray-900 dark:text-white">{step.title}</p>
                                    </dt>
                                    <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-400">{step.description}</dd>
                                </motion.div>
                            ))}
                        </dl>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 3 }}
                        viewport={{ margin: "-100px" }}
                        transition={{ duration: 1, type: "spring" }}
                        className="mt-10 -mx-4 relative lg:mt-0"
                        aria-hidden="true"
                    >
                        <motion.div
                            animate={{
                                y: [0, -10, 0],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative transform bg-gradient-to-br from-blue-400 to-indigo-800 rounded-xl shadow-2xl p-8 mx-auto max-w-md skew-y-3 hover:rotate-0 hover:skew-y-0 transition-all duration-300"
                        >
                            <div className="space-y-4">
                                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold">Manchester City vs Liverpool</span>
                                        <span className="bg-green-500 text-xs px-2 py-1 rounded">88% Confidence</span>
                                    </div>
                                    <div className="text-sm opacity-80">Prediction: Over 2.5 Goals</div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white opacity-80">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold">Real Madrid vs Barcelona</span>
                                        <span className="bg-yellow-500 text-xs px-2 py-1 rounded">65% Confidence</span>
                                    </div>
                                    <div className="text-sm opacity-80">Prediction: Home Win</div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white opacity-60">
                                    <div className="h-4 w-3/4 bg-white/20 rounded mb-2"></div>
                                    <div className="h-3 w-1/2 bg-white/20 rounded"></div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
