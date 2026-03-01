/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./index.html"
    ],
    theme: {
        extend: {
            keyframes: {
                cloud: {
                    '0%': { transform: 'translateX(2200px)' },
                    '100%': { transform: 'translateX(-400px)' },
                }
            },
            animation: {
                'cloud': 'cloud linear infinite',
            }
        },
    },
    plugins: [],
}
