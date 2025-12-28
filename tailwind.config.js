/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                ochre: {
                    50: '#fdf8ec',
                    100: '#f8edd3',
                    200: '#f2daaa',
                    300: '#ebc076',
                    400: '#e3a145',
                    500: '#db871e', // Base Ochre
                    600: '#c06916',
                    700: '#9f4f14',
                    800: '#823e16',
                    900: '#6a3415',
                    950: '#3c1a0a',
                },
            },
        },
    },
    plugins: [],
}
