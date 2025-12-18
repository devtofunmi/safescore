import { useRouter } from 'next/router';
import { FaArrowRight } from 'react-icons/fa6';

const Hero = () => {
    const router = useRouter();

    return (
        <div className="relative h-screen overflow-hidden bg-white dark:bg-black pt-32 pb-16 sm:pb-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center">
                    <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-blue-800 dark:text-blue-300 mb-6">
                        <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                        v1.0 Now Live
                    </div>

                    <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-7xl mb-6">
                        <span className="block">Predict smarter, </span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                            not harder.
                        </span>
                    </h1>

                    <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400">
                        SafeScore analyzes match stats and form across 14+ leagues to generate high-probability football predictions.
                        Stop guessing. Filter by risk and make more informed picks.
                    </p>

                    <div className="mt-8 flex flex-col items-center md:flex-row text-center justify-center gap-4">
                        <button
                            onClick={() => router.push('/home')}
                            className="w-fit cursor-pointer flex justify-center items-center rounded-full bg-blue-400 px-10 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-500 hover:scale-105 transition-all duration-200"
                        >
                            Start Predicting Free
                            <FaArrowRight className="ml-2" />
                        </button>
                        <button
                            onClick={() => {
                                const element = document.getElementById('how-it-works');
                                element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-fit  cursor-pointer items-center rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-8 py-4 text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all duration-200"
                        >
                            How it Works
                        </button>
                    </div>

                    <div className="mt-12 flex flex-col md:flex-row justify-center items-center space-x-8 text-gray-400 text-sm">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Safe Mode (Low-Risk Picks)
                        </div>
                        <div className="flex mt-3 md:mt-0 items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                            </svg>
                            14+ Leagues Covered
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Gradient Blob */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob dark:mix-blend-normal dark:opacity-20"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 dark:mix-blend-normal dark:opacity-20"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 dark:mix-blend-normal dark:opacity-20"></div>
        </div>
    );
};

export default Hero;
