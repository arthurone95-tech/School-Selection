// ========================================
// JOURNA - SHS Recommendation Module
// ========================================

import { getAllCareers, getCategoryName } from './config.js';
import { getSavedResults } from './assessment.js';

// ========================================
// 📋 PROGRAM DESCRIPTIONS (Static)
// ========================================

export const PROGRAM_LIST = {
    SHS: [
        { name: "General Science", type: "SHS", description: "Focus on Biology, Chemistry, Physics, and Mathematics. Prepares for university science programs.", subjects: ["Biology", "Chemistry", "Physics", "Mathematics"] },
        { name: "General Arts", type: "SHS", description: "Focus on Literature, History, French, and Social Studies. Prepares for humanities and social science programs.", subjects: ["Literature", "History", "French", "Social Studies"] },
        { name: "Business", type: "SHS", description: "Focus on Accounting, Economics, Business Management, and Mathematics. Prepares for business programs.", subjects: ["Accounting", "Economics", "Business Management", "Mathematics"] },
        { name: "Visual Arts", type: "SHS", description: "Focus on Graphic Design, Picture Making, and Textiles. Prepares for creative careers.", subjects: ["Graphic Design", "Picture Making", "Textiles", "Sculpture"] },
        { name: "Home Economics", type: "SHS", description: "Focus on Food and Nutrition, Management, Textiles, and Biology. Prepares for culinary, hospitality, and family-related careers.", subjects: ["Food & Nutrition", "Management", "Textiles", "Biology"] }
    ],
    TVET: [
        { name: "Electrical Installation", type: "TVET", description: "Training in electrical systems, wiring, and safety.", subjects: ["Electrical Principles", "Wiring", "Safety"] },
        { name: "Welding & Fabrication", type: "TVET", description: "Training in metal joining and fabrication techniques.", subjects: ["Welding", "Metal Fabrication", "Blueprint Reading"] },
        { name: "Automotive Mechanics", type: "TVET", description: "Training in vehicle repair and maintenance.", subjects: ["Engine Systems", "Electrical Systems", "Diagnostics"] },
        { name: "Carpentry & Joinery", type: "TVET", description: "Training in woodworking and furniture making.", subjects: ["Woodworking", "Joinery", "Design"] },
        { name: "Plumbing & Pipefitting", type: "TVET", description: "Training in water systems and pipe installation.", subjects: ["Pipe Systems", "Installation", "Maintenance"] },
        { name: "Catering & Hospitality", type: "TVET", description: "Training in food preparation, cooking, and hospitality services.", subjects: ["Food Preparation", "Kitchen Management", "Customer Service"] },
        { name: "Fashion & Textiles", type: "TVET", description: "Training in dressmaking, fashion design, and textile production.", subjects: ["Sewing", "Pattern Making", "Textile Design"] },
        { name: "Beauty Therapy", type: "TVET", description: "Training in hairdressing, cosmetology, and beauty treatments.", subjects: ["Hair Styling", "Skin Care", "Makeup Application"] }
    ],
    STEM: [
        { name: "STEM Program", type: "STEM", description: "Integrated science, technology, engineering, and mathematics program.", subjects: ["Science", "Technology", "Engineering", "Mathematics"] }
    ]
};

// ========================================
// 📋 PROGRAM CAREER LISTS (for static tabs)
// ========================================

export const PROGRAM_CAREER_LISTS = {
    "General Science": ["Doctor", "Nurse", "Pharmacist", "Engineer", "Scientist"],
    "STEM Program": ["Engineer", "Software Developer", "Data Analyst", "Scientist", "Researcher"],
    "General Arts": ["Lawyer", "Journalist", "Teacher", "Psychologist", "Sociologist"],
    "Business": ["Accountant", "Entrepreneur", "Marketing Manager", "Financial Advisor", "Business Consultant"],
    "Visual Arts": ["Graphic Designer", "Fashion Designer", "Animator", "Photographer", "Interior Designer"],
    "Home Economics": ["Chef", "Nutritionist", "Event Planner", "Fashion Designer", "Hotel Manager"],
    "Technical / TVET": ["Electrician", "Plumber", "Welder", "Carpenter", "Auto Mechanic"],
    "Automotive Mechanics": ["Auto Mechanic", "Technician", "Diagnostic Specialist", "Service Advisor", "Workshop Owner"],
    "Sports": ["Footballer", "Athlete", "Coach", "Fitness Trainer", "Sports Analyst"],
    "Catering & Hospitality": ["Chef", "Caterer", "Hotel Manager", "Food Service Manager", "Restaurant Owner"],
    "Fashion & Textiles": ["Fashion Designer", "Dressmaker", "Textile Designer", "Tailor", "Boutique Owner"],
    "Beauty Therapy": ["Hairdresser", "Beauty Therapist", "Cosmetologist", "Salon Owner", "Makeup Artist"]
};

// ========================================
// 🛠️ FUNCTIONS
// ========================================

export const getAllPrograms = () => {
    return [...PROGRAM_LIST.SHS, ...PROGRAM_LIST.TVET, ...PROGRAM_LIST.STEM];
};

export const getProgramsByType = (type) => {
    return PROGRAM_LIST[type] || [];
};

/**
 * Get personalized program recommendations based on assessment results.
 * Aggregates programs from the user's top career matches.
 */
export const getRecommendedPrograms = (results) => {
    if (!results || !results.topCategories) {
        return [];
    }

    // Get all careers from the user's primary and alternative matches
    const allMatchedCareers = [...(results.primary || []), ...(results.alternative || [])];
    if (allMatchedCareers.length === 0) {
        return [];
    }

    // Collect all programs from these careers
    const programCounts = {};
    const programDetails = {};

    allMatchedCareers.forEach(career => {
        if (career.programs) {
            const allPrograms = [...(career.programs.primary || []), ...(career.programs.secondary || [])];
            allPrograms.forEach(programName => {
                // Find program details from static list
                const allStatic = getAllPrograms();
                const prog = allStatic.find(p => p.name === programName);
                if (prog) {
                    programCounts[programName] = (programCounts[programName] || 0) + 1;
                    programDetails[programName] = prog;
                }
            });
        }
    });

    // Sort programs by frequency (most mentioned first)
    const sortedPrograms = Object.keys(programCounts).sort((a, b) => programCounts[b] - programCounts[a]);

    // Build recommendation objects
    const recommendations = sortedPrograms.slice(0, 5).map(programName => {
        const prog = programDetails[programName];
        const matchScore = Math.min(100, Math.round(programCounts[programName] / allMatchedCareers.length * 100));
        return {
            name: programName,
            type: prog ? prog.type : 'SHS',
            description: prog ? prog.description : 'Program recommended based on your career interests.',
            subjects: prog ? prog.subjects : [],
            matchScore: matchScore,
            career_paths: getCareerPathsForProgram(programName)
        };
    });

    return recommendations;
};

const getCareerPathsForProgram = (programName) => {
    for (const [program, careers] of Object.entries(PROGRAM_CAREER_LISTS)) {
        if (programName.includes(program) || programName === program) {
            return careers;
        }
    }
    return ["Career 1", "Career 2", "Career 3", "Career 4", "Career 5"];
};

export const getCareerPaths = () => {
    return [
        { program: "General Science / STEM", icon: "flask", careers: PROGRAM_CAREER_LISTS["General Science"] },
        { program: "General Arts", icon: "book", careers: PROGRAM_CAREER_LISTS["General Arts"] },
        { program: "Business", icon: "chart-line", careers: PROGRAM_CAREER_LISTS["Business"] },
        { program: "Visual Arts", icon: "paintbrush", careers: PROGRAM_CAREER_LISTS["Visual Arts"] },
        { program: "Home Economics", icon: "utensils", careers: PROGRAM_CAREER_LISTS["Home Economics"] },
        { program: "Technical / TVET", icon: "tools", careers: PROGRAM_CAREER_LISTS["Technical / TVET"] },
        { program: "Sports", icon: "futbol", careers: PROGRAM_CAREER_LISTS["Sports"] }
    ];
};

export const getProgramById = (programId) => {
    const allPrograms = getAllPrograms();
    return allPrograms[programId] || null;
};

export const searchPrograms = (searchTerm) => {
    const allPrograms = getAllPrograms();
    return allPrograms.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
};

export default {
    getAllPrograms,
    getProgramsByType,
    getRecommendedPrograms,
    getCareerPaths,
    getProgramById,
    searchPrograms
};