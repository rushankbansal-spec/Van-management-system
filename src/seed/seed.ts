// Seed script for Portfolio Backend
// Creates initial data for the portfolio CMS

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../config/environment';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { Project } from '../models/Project';
import { Skill } from '../models/Skill';
import { Experience } from '../models/Experience';
import { Achievement } from '../models/Achievement';
import { Certification } from '../models/Certification';
import { SocialLink } from '../models/SocialLink';
import { Github } from '../models/Github';
const seed = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.db.uri);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Project.deleteMany({});
    await Skill.deleteMany({});
    await Experience.deleteMany({});
    await Achievement.deleteMany({});
    await Certification.deleteMany({});
    await SocialLink.deleteMany({});
    await Github.deleteMany({});
    console.log('Existing data cleared');

    // ==================== ADMIN USER ====================
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash(config.admin.password || 'admin123', 12);
    const adminUser = await User.create({
      name: 'Rushank Bansal',
      email: config.admin.email || 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    });
    console.log(`Admin user created: ${adminUser.email}`);

    // ==================== PROFILE ====================
    console.log('Creating profile...');
    await Profile.create({
  name: 'Rushank Bansal',
  role: 'Developer | AI-ML | Software Development',
  tagline: 'Building intelligent solutions at the intersection of code and creativity',
  bio: 'Passionate Computer Science student and developer interested in Artificial Intelligence, Machine Learning, software development, and creative technology. Currently pursuing B.Tech in Computer Science and Engineering at VIT Chennai.',
  email: 'rushank.bansal2025@vitstudent.ac.in',
  phone: '8114491919',
  location: 'Chennai, Tamil Nadu, India',
  college: 'VIT Chennai',
  degree: 'B.Tech Computer Science and Engineering',
  year: '2nd Year',
  registrationNumber: '25BAI1450',
  cgpa: '7.5',
  tenthMarks: '85%',
  twelfthMarks: '78.98%',
  profileImage: '',
  resumeUrl: '',
  githubUrl: 'https://github.com/rushankbansal-spec',
  linkedinUrl: 'https://www.linkedin.com/in/rushank-bansal-306035374/',
  seoTitle: 'Rushank Bansal - AI/ML & Software Developer',
  seoDescription: 'Portfolio of Rushank Bansal, a Computer Science student and developer specializing in AI/ML and software development.',
  ogImage: '',
  availabilityStatus: true,
  availabilityText: 'Available for projects',
});
    console.log('Profile created');

    // ==================== SKILLS ====================
    console.log('Creating skills...');
    const skills = [
      // Programming
      { name: 'Python', category: 'Programming', level: 85, icon: 'python', description: 'Experienced in Python for data science, backend, and automation', order: 1, visible: true },
      { name: 'JavaScript', category: 'Programming', level: 80, icon: 'javascript', description: 'Proficient in modern JavaScript and ES6+', order: 2, visible: true },
      { name: 'TypeScript', category: 'Programming', level: 75, icon: 'typescript', description: 'Type-safe JavaScript development', order: 3, visible: true },
      { name: 'C++', category: 'Programming', level: 65, icon: 'cplusplus', description: 'Foundation in C++ programming', order: 4, visible: true },
      { name: 'Java', category: 'Programming', level: 70, icon: 'java', description: 'Object-oriented programming with Java', order: 5, visible: true },
      
      // Frontend
      { name: 'React', category: 'Frontend', level: 80, icon: 'react', description: 'Building modern UIs with React and ecosystem', order: 1, visible: true },
      { name: 'Next.js', category: 'Frontend', level: 70, icon: 'nextjs', description: 'Server-side rendering and static site generation', order: 2, visible: true },
      { name: 'Three.js', category: 'Frontend', level: 65, icon: 'threejs', description: '3D graphics and WebGL experiences', order: 3, visible: true },
      { name: 'GSAP', category: 'Frontend', level: 70, icon: 'gsap', description: 'Advanced animations and transitions', order: 4, visible: true },
      { name: 'HTML/CSS', category: 'Frontend', level: 85, icon: 'htmlcss', description: 'Semantic HTML and modern CSS', order: 5, visible: true },
      
      // Backend
      { name: 'Node.js', category: 'Backend', level: 75, icon: 'nodejs', description: 'Server-side JavaScript runtime', order: 1, visible: true },
      { name: 'Express.js', category: 'Backend', level: 75, icon: 'express', description: 'Fast and minimalist web framework', order: 2, visible: true },
      { name: 'FastAPI', category: 'Backend', level: 70, icon: 'fastapi', description: 'Modern Python web framework for APIs', order: 3, visible: true },
      { name: 'MongoDB', category: 'Backend', level: 75, icon: 'mongodb', description: 'NoSQL database and data modeling', order: 4, visible: true },
      
      // Database
      { name: 'MongoDB', category: 'Database', level: 75, icon: 'mongodb', description: 'Document-oriented NoSQL database', order: 1, visible: true },
      { name: 'MySQL', category: 'Database', level: 65, icon: 'mysql', description: 'Relational database management', order: 2, visible: true },
      { name: 'PostgreSQL', category: 'Database', level: 60, icon: 'postgresql', description: 'Advanced relational database', order: 3, visible: true },
      
      // AI/ML
      { name: 'Machine Learning', category: 'AI/ML', level: 75, icon: 'machinelearning', description: 'ML algorithms and model development', order: 1, visible: true },
      { name: 'TensorFlow', category: 'AI/ML', level: 65, icon: 'tensorflow', description: 'Deep learning framework', order: 2, visible: true },
      { name: 'PyTorch', category: 'AI/ML', level: 60, icon: 'pytorch', description: 'Flexible deep learning library', order: 3, visible: true },
      { name: 'Scikit-learn', category: 'AI/ML', level: 70, icon: 'scikit', description: 'Classical ML algorithms and tools', order: 4, visible: true },
      { name: 'NLP', category: 'AI/ML', level: 65, icon: 'nlp', description: 'Natural language processing', order: 5, visible: true },
      
      // Tools
      { name: 'Git', category: 'Tools', level: 80, icon: 'git', description: 'Version control and collaboration', order: 1, visible: true },
      { name: 'Docker', category: 'Tools', level: 60, icon: 'docker', description: 'Containerization and deployment', order: 2, visible: true },
      { name: 'VS Code', category: 'Tools', level: 85, icon: 'vscode', description: 'Primary development environment', order: 3, visible: true },
      { name: 'Linux', category: 'Tools', level: 70, icon: 'linux', description: 'Command-line and system administration', order: 4, visible: true },
    ];
    await Skill.insertMany(skills);
    console.log('Skills created');

        // ==================== SOCIAL LINKS ====================
    console.log('Creating social links...');
    await SocialLink.create([
      {
        platform: 'GitHub',
        username: 'rushankbansal-spec',
        url: 'https://github.com/rushankbansal-spec',
        icon: 'github',
        visible: true,
        order: 1
      },
      {
        platform: 'LinkedIn',
        username: 'rushank-bansal-306035374',
        url: 'https://www.linkedin.com/in/rushank-bansal-306035374/',
        icon: 'linkedin',
        visible: true,
        order: 2
      },
      {
        platform: 'Instagram',
        username: 'rushank.bansal',
        url: 'https://www.instagram.com/rushank.bansal/',
        icon: 'instagram',
        visible: true,
        order: 3
      },
      {
        platform: 'Email',
        username: 'rushankbansal@gmail.com',
        url: 'mailto:rushankbansal@gmail.com',
        icon: 'email',
        visible: true,
        order: 4
      }
    ]);
    console.log('Social links created');

    // ==================== GITHUB CONFIG ====================
    console.log('Creating GitHub config...');
    await Github.create({
      username: 'rushankbansal-spec',
      profileUrl: 'https://github.com/rushankbansal-spec',
      enabled: true,
      showRepositories: true,
      showContributions: true,
    });
    console.log('GitHub config created');

    // ==================== PROJECTS ====================
    console.log('Creating projects...');
    await Project.create([
      {
        title: 'PrecipyTech',
        slug: 'precipytech',
        shortDescription: 'Hardware-integrated rainfall prediction system using environmental sensors and machine learning.',
        description: 'An IoT-based rainfall prediction system that integrates environmental sensors with machine learning models to provide accurate weather predictions.',
        detailedDescription: 'PrecipyTech is a comprehensive weather monitoring and prediction system that combines hardware sensors with advanced machine learning algorithms. The system collects real-time environmental data including temperature, humidity, and atmospheric pressure, processes this data through trained ML models, and provides accurate rainfall predictions.',
        technologies: ['Arduino', 'DHT22', 'Rain Sensor', 'Python', 'Pandas', 'Scikit-learn', 'Logistic Regression', 'FastAPI'],
        category: 'AI/ML',
        githubUrl: '',
        liveUrl: '',
        imageUrl: '',
        videoUrl: '',
        year: '2024',
        featured: true,
        published: true,
        order: 1,
        challenges: 'Integrating hardware sensors with ML models and handling real-time data processing',
        features: 'Real-time sensor data collection, ML-based prediction, REST API, Dashboard',
        results: 'Achieved 85% prediction accuracy with 5-minute update intervals',
        seoTitle: 'PrecipyTech - Rainfall Prediction System',
        seoDescription: 'Hardware-integrated rainfall prediction using sensors and ML',
        ogImage: '',
      },
      {
        title: 'Fake News Detector',
        slug: 'fake-news-detector',
        shortDescription: 'Machine-learning based fake news classification platform.',
        description: 'A web-based platform that uses natural language processing and machine learning to classify news articles as real or fake.',
        detailedDescription: 'The Fake News Detector leverages NLP techniques and machine learning models to analyze news content and determine its authenticity. The system is trained on large datasets of verified news articles and uses advanced text processing to identify patterns indicative of misinformation.',
        technologies: ['Python', 'Machine Learning', 'NLP', 'FastAPI', 'React'],
        category: 'AI/ML',
        githubUrl: '',
        liveUrl: '',
        imageUrl: '',
        videoUrl: '',
        year: '2025',
        featured: true,
        published: true,
        order: 4,
        challenges: 'Achieving high accuracy on diverse news sources and handling edge cases',
        features: 'Real-time classification, Confidence scores, Source analysis, Batch processing',
        results: 'Achieved 92% accuracy on test dataset with F1 score of 0.91',
        seoTitle: 'Fake News Detector - ML-Powered Detection',
        seoDescription: 'Detect fake news using machine learning and NLP',
        ogImage: '',
      },
      {
        title: 'Doreya',
        slug: 'doreya',
        shortDescription: 'Modern e-commerce platform for selling crochet products.',
        description: 'A full-stack e-commerce platform designed specifically for artisans and crafters to sell their handmade crochet products.',
        detailedDescription: 'Doreya is a complete e-commerce solution that provides artisans with a platform to showcase and sell their handmade crochet products. The platform includes product management, shopping cart, secure payments, order tracking, and an admin dashboard for sellers.',
        technologies: ['React', 'Node.js', 'Express', 'MongoDB'],
        category: 'Full Stack',
        githubUrl: '',
        liveUrl: '',
        imageUrl: '',
        videoUrl: '',
        year: '2026',
        featured: true,
        published: true,
        order: 3,
        challenges: 'Creating a seamless shopping experience and handling payment integration',
        features: 'Product catalog, Shopping cart, Secure checkout, Order management, Seller dashboard',
        results: 'Successfully launched with multiple sellers and processed first orders',
        seoTitle: 'Doreya - Crochet E-Commerce Platform',
        seoDescription: 'E-commerce platform for handmade crochet products',
        ogImage: '',
      },
      {
        title: 'NOIR',
        slug: 'noir',
        shortDescription: 'Interactive fitness and workout tracking application concept.',
        description: 'A modern fitness tracking application with workout plans, progress tracking, and community features.',
        detailedDescription: 'NOIR is a fitness and workout tracking application designed to help users achieve their fitness goals. The app provides personalized workout plans, tracks progress over time, and offers community features to keep users motivated.',
        technologies: ['React', 'Node.js', 'MongoDB'],
        category: 'Full Stack',
        githubUrl: '',
        liveUrl: '',
        imageUrl: '',
        videoUrl: '',
        year: '2023',
        featured: false,
        published: true,
        order: 4,
        challenges: 'Designing an intuitive UI for workout tracking and progress visualization',
        features: 'Workout plans, Progress tracking, Exercise library, Community features, Reminders',
        results: 'Concept validated with positive user feedback on UX design',
        seoTitle: 'NOIR - Fitness Tracking App',
        seoDescription: 'Interactive fitness and workout tracking application',
        ogImage: '',
      },
    ]);
    console.log('Projects created');

    // ==================== EXPERIENCE ====================
    console.log('Creating experience...');
    await Experience.create([
      {
        company: 'VIT Chennai',
        organization: 'Vellore Institute of Technology, Chennai Campus',
        position: 'Student',
        description: 'Pursuing B.Tech in Computer Science and Engineering. Active participation in technical clubs and hackathons.',
        startDate: '2024',
        endDate: '2028',
        current: true,
        location: 'Chennai, Tamil Nadu',
        technologies: ['Computer Science', 'AI/ML', 'Web Development'],
        link: 'https://vitchennai.ac.in',
        order: 1,
        visible: true,
      },
    ]);
    console.log('Experience created');

    // ==================== ACHIEVEMENTS ====================
    console.log('Creating achievements...');
    await Achievement.create([
      {
        title: 'Technical Club Member',
        description: 'Active member of the technical club at VIT Chennai, participating in workshops and events.',
        organization: 'VIT Chennai Technical Club',
        date: '2024',
        link: '',
        imageUrl: '',
        order: 1,
        visible: true,
      },
    ]);
    console.log('Achievements created');

    // ==================== CERTIFICATIONS ====================
    console.log('Creating certifications...');
console.log('No certifications added yet');
    console.log('\n========================================');
    console.log('Seed completed successfully!');
    console.log('========================================');
    console.log('\nAdmin login credentials:');
    console.log(`  Email: ${config.admin.email || 'admin@example.com'}`);
    console.log(`  Password: ${config.admin.password || 'admin123'}`);
    console.log('\nNote: Update these in your .env file and re-run seed if needed.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
