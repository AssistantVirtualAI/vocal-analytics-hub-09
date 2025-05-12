
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				eleven: {
					'purple': '#7E69AB',
					'deep-purple': '#6E59A5',
					'light-purple': '#E5DEFF',
					'gray': '#f5f5f7',
					'charcoal': '#221F26'
				},
				ai: {
				    'blue': '#4285F4',  // Google AI Blue
				    'green': '#0F9D58', // Google AI Green
				    'red': '#DB4437',   // Google AI Red
				    'yellow': '#F4B400', // Google AI Yellow
				    'cyan': '#00C9FF',   // Tech Cyan
				    'purple': '#9C27B0', // Tech Purple
				    'indigo': '#3F51B5', // Tech Indigo
				    'teal': '#009688',   // Tech Teal
					'violet': '#8A2BE2', // Vibrant Violet
					'magenta': '#FF00FF', // Bright Magenta
					'coral': '#FF7F50',   // Coral
					'mint': '#98FB98',    // Mint Green
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'glow': {
					'0%, 100%': {
						boxShadow: '0 0 5px rgba(124, 58, 237, 0.2)',
						borderColor: 'rgba(124, 58, 237, 0.2)'
					},
					'50%': {
						boxShadow: '0 0 20px rgba(124, 58, 237, 0.4)',
						borderColor: 'rgba(124, 58, 237, 0.4)'
					}
				},
				'shimmer': {
					'0%': { backgroundPosition: '-1000px 0' },
					'100%': { backgroundPosition: '1000px 0' }
				},
				'card-hover': {
					'0%': { transform: 'translateY(0)' },
					'100%': { transform: 'translateY(-8px)' }
				},
				'border-glow': {
					'0%, 100%': { borderColor: 'rgba(99, 102, 241, 0.3)' },
					'50%': { borderColor: 'rgba(99, 102, 241, 0.8)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'float': 'float 6s ease-in-out infinite',
				'glow': 'glow 3s ease-in-out infinite',
				'shimmer': 'shimmer 2s linear infinite',
				'card-hover': 'card-hover 0.3s ease-out forwards',
				'border-glow': 'border-glow 2s infinite'
			},
			backdropFilter: {
				'none': 'none',
				'blur': 'blur(20px)'
			},
			boxShadow: {
				'card-hover': '0 10px 25px -5px rgba(99, 102, 241, 0.1), 0 8px 10px -6px rgba(99, 102, 241, 0.1)',
				'card-glow': '0 0 15px rgba(99, 102, 241, 0.5)'
			},
			transitionProperty: {
				'height': 'height',
				'spacing': 'margin, padding',
				'glow': 'box-shadow, border-color'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
