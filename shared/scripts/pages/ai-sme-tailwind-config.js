tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                'brand-primary': 'var(--ai-accent)',
                'brand-primary-hover': 'var(--ai-accent-hover)',
                'brand-dark': 'var(--ai-heading)',
                'brand-body': 'var(--ai-text)',
                'brand-muted': 'var(--ai-text)', // Using main text color for muted as well for simplicity
                'brand-bg': 'var(--ai-bg)',
                'brand-card-bg': 'var(--ai-card)',
            }
        }
    }
}
