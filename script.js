// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.reveal');

const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // Optional: observer.unobserve(entry.target) if you only want it to reveal once
        }
    });
};

const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

revealElements.forEach(el => revealObserver.observe(el));

// Navbar Scroll Effect
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.add('scrolled'); // keep it or remove it
        navbar.classList.remove('scrolled'); 
    }
    
    if (window.scrollY > 50) {
         navbar.classList.add('scrolled');
    } else {
         navbar.classList.remove('scrolled');
    }
});

// Smooth Scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop,
                behavior: 'smooth'
            });
            
            if (window.innerWidth <= 768) {
                navLinks.style.display = '';
            }
        }
    });
});


// Mobile menu toggle
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileBtn.addEventListener('click', () => {
    if (navLinks.style.display === 'flex') {
        navLinks.style.display = '';
    } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '120%';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'rgba(20, 25, 22, 0.95)';
        navLinks.style.padding = '1.5rem';
        navLinks.style.borderRadius = '24px';
        navLinks.style.backdropFilter = 'blur(16px)';
        navLinks.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        navLinks.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        navLinks.style.gap = '1.5rem';
    }
});

// Initialize Letter Glitch for Hero Section
const heroGlitchContainer = document.getElementById('hero-glitch-container');
if (heroGlitchContainer) {
    new LetterGlitch(heroGlitchContainer, {
        glitchSpeed: 50,
        centerVignette: true,
        outerVignette: false,
        smooth: true,
        glitchColors: ["#2b4539","#61dca3","#61b3dc"]
    });
}

