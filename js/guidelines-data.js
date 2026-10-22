// ========================================
// BECE School Selection Guidelines - Structured Data
// Source: OFFICIAL_GUIDELINES.md (supplied 2025 guidelines)
// ========================================
//
// Content rules (see OFFICIAL_GUIDELINES.md "Important Content Rules"):
//   - `official`     is the wording taken from the supplied official document.
//   - `explanation`  is a plain-language explanation written to help users.
//   - `applicationBehavior` describes what this application does. It is a
//     design note, never a quotation from an official source.
//   - `uncertainty`  flags a rule whose meaning or supporting data is not yet
//     verified. It is rendered as "needs verification", never as a rule.

export const GUIDELINE_SOURCE = {
    title: "2025 BECE School Selection Guidelines",
    year: 2025,
    document: "OFFICIAL_GUIDELINES.md",
    note:
        "Official wording is quoted from the project's supplied 2025 guidelines document. " +
        "Some rules and their supporting data are still being confirmed, so they are shown as " +
        "needs verification rather than enforced."
};

// Section metadata for grouping and navigation. `id` maps to the `section`
// value used by each guideline.
export const GUIDELINE_SECTIONS = [
    {
        id: "Section 1: Understanding School Selection",
        label: "Understanding school selection",
        description: "What you must choose, and why a programme is part of each choice."
    },
    {
        id: "Section 2: School Categories",
        label: "School categories",
        description: "How many schools you may pick from Categories A, B and C."
    },
    {
        id: "Section 3: Day and Boarding Preferences",
        label: "Day and Boarding",
        description: "The residential preference attached to your five main choices."
    },
    {
        id: "Section 4: Alternative School Choices",
        label: "Alternative choices",
        description: "The two extra schools and how they may be used."
    },
    {
        id: "Section 5: Special Selection Pathways",
        label: "Special pathways",
        description: "Guidance for pure TVET and STEM/Science candidates."
    },
    {
        id: "Section 6: Official Appendices",
        label: "Official appendices",
        description: "The source lists the rules refer to (Appendices 1\u20135)."
    },
    {
        id: "Section 7: Information Required on the Selection Form",
        label: "The selection form",
        description: "The information the official form requires."
    }
];

export const GUIDELINES = [
    // SECTION 1: UNDERSTANDING SCHOOL SELECTION
    {
        section: "Section 1: Understanding School Selection",
        id: 1,
        title: "Select Five Main Schools",
        official: "Candidates are required to select five (5) schools and rank them according to their order of preference.\n\nThe first choice should be the candidate's most preferred school.",
        explanation: "Choose five schools and rank them from first to fifth preference. Choose carefully: once you are placed in one of your choices, the 2025 guidelines say that placement is not changed.",
        applicationBehavior: "The application displays five main choices clearly, numbered from Choice 1 to Choice 5. Candidates can edit their choices before completing the review process."
    },
    {
        section: "Section 1: Understanding School Selection",
        id: 2,
        title: "Choose a Programme for Each School",
        official: "Candidates must select a programme for each main school choice.\n\nThe selection form includes fields for the school code and name, category, programme code and name, and residential preference.",
        explanation: "Each main choice also needs a programme that the school offers. The app only lists programmes the school actually offers. Where programme data is missing, it is left blank instead of guessed.",
        applicationBehavior: "Once a school is selected, the application presents the relevant programme options supported by the verified data. If the programme information is missing or uncertain, the application does not invent an option.",
        uncertainty: {
            kind: "open-data",
            label: "Programme data needs verification",
            note: "The verified programme names and codes available at each school are not yet confirmed, so programme eligibility cannot be fully enforced.",
            questions: [5]
        }
    },

    // SECTION 2: SCHOOL CATEGORIES
    {
        section: "Section 2: School Categories",
        id: 3,
        title: "Category A Limit",
        official: "A candidate cannot select more than one school from Category A.",
        explanation: "Under the general rules, you may pick at most one Category A school among your five choices.",
        applicationBehavior: "The application counts Category A selections automatically and prevents an additional selection when the applicable limit has been reached."
    },
    {
        section: "Section 2: School Categories",
        id: 4,
        title: "Category B Limit",
        official: "A candidate cannot select more than two schools from Category B.",
        explanation: "You may pick up to two Category B schools. The guidelines also set a Day/Boarding arrangement for them.",
        applicationBehavior: "The application counts Category B schools among the main choices and enforces the applicable limit."
    },
    {
        section: "Section 2: School Categories",
        id: 5,
        title: "Category C Choices",
        official: "Candidates may select all five schools from Category C, subject to the residential preference requirements.",
        explanation: "You may choose all five schools from Category C, but the Day and Boarding requirement still applies.",
        applicationBehavior: "The application evaluates category limits and residential requirements together. It does not reject five Category C choices solely because all five belong to Category C."
    },

    // SECTION 3: DAY AND BOARDING PREFERENCES
    {
        section: "Section 3: Day and Boarding Preferences",
        id: 6,
        title: "Residential Preference for the Five Main Choices",
        official: "Candidates must select three (3) Boarding schools and two (2) Day schools among their five main choices.",
        explanation: "Your five choices must be three Boarding and two Day. A school may offer Day only, Boarding only, or both.",
        applicationBehavior: "The application tracks the number of Day and Boarding selections, shows candidates how many selections of each type remain, prevents choosing an unavailable residential option, identifies Day-only and Boarding-only schools, and validates the final arrangement before presenting the form as valid.",
        uncertainty: {
            kind: "open-interpretation",
            label: "Interaction with category rules needs verification",
            note: "How this overall three-Boarding / two-Day requirement combines with the category-specific residential instructions is not yet confirmed.",
            questions: [8]
        }
    },
    {
        section: "Section 3: Day and Boarding Preferences",
        id: 7,
        title: "Category B Residential Arrangement",
        official: "Candidates may select one Category B school as Boarding and another Category B school as Day.",
        explanation: "If you choose two Category B schools, they may be arranged as one Boarding and one Day.",
        applicationBehavior: "Where two Category B schools are selected under the applicable general rules, the application verifies the required residential arrangement and the actual options available at each school.",
        uncertainty: {
            kind: "open-interpretation",
            label: "Interaction with overall requirement needs verification",
            note: "How this Category B arrangement combines with the overall three-Boarding / two-Day requirement is not yet confirmed.",
            questions: [8]
        }
    },
    {
        section: "Section 3: Day and Boarding Preferences",
        id: 8,
        title: "Category C Residential Arrangement",
        official: "Candidates may select one Category C school as Boarding and another Category C school as Day.",
        explanation: "Category C schools may also be arranged as one Boarding and one Day. How this fits the overall three-Boarding, two-Day rule is still being confirmed.",
        applicationBehavior: "The application does not implement contradictory or assumed restrictions. It applies the confirmed official rules and flags any unresolved interpretation for review.",
        uncertainty: {
            kind: "open-interpretation",
            label: "Interpretation needs verification",
            note: "The guidelines explicitly state that the precise interaction between the Category C arrangement, the Category C permission, and the overall three-Boarding / two-Day requirement must be verified before it is enforced as a rigid rule.",
            questions: [8]
        }
    },

    // SECTION 4: ALTERNATIVE SCHOOL CHOICES
    {
        section: "Section 4: Alternative School Choices",
        id: 9,
        title: "Select Two Alternative Schools",
        official: "Candidates must select two (2) alternative schools:\n\n- One Category B school.\n- One Category C school.\n\nThe alternative schools must be selected from Appendix 3 of the supplied 2025 school-selection guidelines.",
        explanation: "Choose two alternatives in addition to your five main choices: one Category B and one Category C from Appendix 3.",
        applicationBehavior: "The application provides a clearly labelled Alternative Choices section with separate fields for the Category B and Category C alternatives. Only schools verified as eligible under Appendix 3 are offered in this section.",
        uncertainty: {
            kind: "open-list",
            label: "Appendix 3 list needs verification",
            note: "The rule requires alternatives to come from Appendix 3, but the authoritative and complete list of eligible schools has not yet been verified. A source conflict about the number of Category B alternatives is also unresolved.",
            questions: [4]
        }
    },
    {
        section: "Section 4: Alternative School Choices",
        id: 10,
        title: "Alternative Schools Must Not Repeat Main Choices",
        official: "Candidates cannot repeat a school from their five main choices among their two alternative choices.",
        explanation: "An alternative must be a different school from all five main choices.",
        applicationBehavior: "The application compares alternative choices with the five main choices and prevents duplicate school selections across those sections. This duplicate restriction is applied to the school identity, not merely the spelling of its name."
    },
    {
        section: "Section 4: Alternative School Choices",
        id: 11,
        title: "Purpose of Alternative Choices",
        official: "Alternative school placement may occur if a candidate is not placed in any of the five main choices.",
        explanation: "Alternatives are a fallback if you are not placed in any of your five main choices. They are not a guarantee.",
        applicationBehavior: "The application explains the purpose of alternative choices without promising that a candidate will be placed in either alternative school."
    },
    {
        section: "Section 4: Alternative School Choices",
        id: 12,
        title: "Placement Is Not Changed",
        official: "The supplied 2025 guidelines state that a candidate placed in any of the selected choices will not be changed.",
        explanation: "Check your choices before you finish. The app does not promise that a placement can be changed.",
        applicationBehavior: "The application does not claim that a candidate's placement can be changed."
    },

    // SECTION 5: SPECIAL SELECTION PATHWAYS
    {
        section: "Section 5: Special Selection Pathways",
        id: 13,
        title: "Pure TVET Candidates",
        official: "Candidates selecting pure TVET programmes are instructed to select all five TVET institutes from Categories A, B, and C as Day or Boarding, following the stated selection criteria.",
        explanation: "Pure TVET candidates choose five TVET institutes and a programme for each. Only TVET institutes are offered for this pathway.",
        applicationBehavior: "The application identifies eligible TVET institutions, displays verified programmes for each institution, displays the institution's permitted residential options, enforces the applicable selection requirements, and does not assume that every TVET institution offers both Day and Boarding.",
        uncertainty: {
            kind: "open-interpretation",
            label: "Pathway rules need verification",
            note: "How the general category and residential limits apply to the pure TVET pathway is not yet confirmed, so these rules are not enforced for this pathway.",
            questions: [1]
        }
    },
    {
        section: "Section 5: Special Selection Pathways",
        id: 14,
        title: "STEM/Science Career Interest",
        official: "Candidates interested in a STEM or Science career are instructed to select STEM/Science subjects in all five choices from Categories A, B, and C as Day or Boarding.",
        explanation: "STEM/Science candidates choose five schools from the STEM list (Appendix 5). A school is only offered if it is on that list, even if it teaches a Science subject.",
        applicationBehavior: "The application identifies verified STEM schools and schools offering relevant STEM subjects, presents eligible options for each main choice, verifies the relationship between the school, programme, and applicable STEM or Science requirement, and respects the available residential options.",
        uncertainty: {
            kind: "open-interpretation",
            label: "Pathway rules need verification",
            note: "How the general category and residential limits apply to the STEM/Science pathway is not yet confirmed, so these rules are not enforced for this pathway.",
            questions: [2]
        }
    },

    // SECTION 6: OFFICIAL APPENDICES
    {
        section: "Section 6: Official Appendices",
        id: 15,
        title: "Appendix 1",
        official: "Appendix 1 provides details of Technical Institution (TI) programmes.",
        explanation: "Appendix 1 lists the programmes offered by Technical Institutions.",
        applicationBehavior: "The application uses Appendix 1 data for TVET programme selection."
    },
    {
        section: "Section 6: Official Appendices",
        id: 16,
        title: "Appendix 2",
        official: "Appendix 2 provides details of the subjects of Technical Programmes offered in Senior High Technical Schools (SHTS).",
        explanation: "Appendix 2 lists the technical subjects offered in Senior High Technical Schools.",
        applicationBehavior: "The application uses Appendix 2 data for SHTS programme selection."
    },
    {
        section: "Section 6: Official Appendices",
        id: 17,
        title: "Appendix 3",
        official: "Appendix 3 contains the alternative school choices.\n\nCandidates must select one Category B alternative and one Category C alternative from the eligible schools listed there.",
        explanation: "Only schools listed in Appendix 3 can be used as alternatives.",
        applicationBehavior: "The application only offers schools from Appendix 3 as alternative choices.",
        uncertainty: {
            kind: "open-list",
            label: "Appendix 3 list needs verification",
            note: "The complete and authoritative Appendix 3 list of eligible alternative schools has not yet been verified, and a header conflict about the number of Category B alternatives is unresolved.",
            questions: [4]
        }
    },
    {
        section: "Section 6: Official Appendices",
        id: 18,
        title: "Appendix 4",
        official: "Appendix 4 contains Special Education Needs (SEN) schools.",
        explanation: "Appendix 4 lists Special Education Needs schools. Their selection rules are handled separately from the general rules.",
        applicationBehavior: "The application handles SEN information respectfully and follows official requirements.",
        uncertainty: {
            kind: "open-interpretation",
            label: "SEN rules need verification",
            note: "The specific selection rules for Special Education Needs schools are not yet confirmed, so no SEN-specific validation is implemented.",
            questions: [3]
        }
    },
    {
        section: "Section 6: Official Appendices",
        id: 19,
        title: "Appendix 5",
        official: "Appendix 5 contains STEM schools and Senior High Schools offering STEM subjects.",
        explanation: "Appendix 5 lists STEM schools and schools offering STEM subjects.",
        applicationBehavior: "The application uses Appendix 5 data for STEM pathway selection."
    },

    // SECTION 7: INFORMATION REQUIRED ON THE SELECTION FORM
    {
        section: "Section 7: Information Required on the Selection Form",
        id: 20,
        title: "Main Choice Information",
        official: "The supplied school-selection form contains the following fields for each main choice:\n\n1. Serial number.\n2. School code and name.\n3. School category.\n4. Programme code and name.\n5. Residential preference: Day or Boarding.",
        explanation: "Each main choice shows school code and name, category, programme code and name, and Day/Boarding.",
        applicationBehavior: "The application does not fabricate missing school codes, programme codes, categories, or programme names.",
        uncertainty: {
            kind: "open-data",
            label: "Form codes need verification",
            note: "Programme codes for each school are not yet verified. Where a value is missing, the application leaves it blank rather than guessing.",
            questions: [5]
        }
    },
    {
        section: "Section 7: Information Required on the Selection Form",
        id: 21,
        title: "Alternative Choice Information",
        official: "The form provides a separate section for the two alternative schools.",
        explanation: "The two alternatives are shown in their own section of the form.",
        applicationBehavior: "The application displays alternatives in a separate section."
    },
    {
        section: "Section 7: Information Required on the Selection Form",
        id: 22,
        title: "Parent or Guardian Details",
        official: "The supplied form includes fields for the parent or guardian's:\n\n- Name.\n- Contact information.\n- Signature.\n- Date.",
        explanation: "The form has fields for the parent or guardian's name, contact, signature and date. Signatures are added by hand.",
        applicationBehavior: "The application includes parent/guardian fields in the form preview."
    },
    {
        section: "Section 7: Information Required on the Selection Form",
        id: 23,
        title: "Headteacher Details and Validation",
        official: "The supplied form includes fields for the headteacher's:\n\n- Contact information.\n- School stamp.\n- Signature.",
        explanation: "The form has fields for the headteacher's contact, stamp and signature. They are completed by the school.",
        applicationBehavior: "The application includes headteacher fields but does not claim they have been completed."
    },
    {
        section: "Section 7: Information Required on the Selection Form",
        id: 24,
        title: "Parent or Guardian Consent",
        official: "The supplied materials require parent or guardian consent and headteacher validation.",
        explanation: "The form needs parent or guardian consent and headteacher validation. A preview does not mean they have been obtained.",
        applicationBehavior: "The application displays a disclaimer that consent and validation have not been obtained."
    }
];

// ========================================
// VALIDATION RULES (for application logic)
// ========================================
// These describe rules the application may enforce. Anything marked
// UNRESOLVED must not be enforced as an official requirement.

export const VALIDATION_RULES = {
    general: {
        maxMainChoices: 5,
        maxCategoryA: 1,
        maxCategoryB: 2,
        requiredBoarding: 3,
        requiredDay: 2,
        requiredAlternatives: 2,
        alternativeCategories: ["B", "C"]
    },
    // Rules for special pathways (unresolved - pending verification)
    pathways: {
        tvet: {
            description: "Pure TVET pathway - select 5 TVET institutes from Categories A, B, C",
            generalRulesApply: "UNRESOLVED - needs verification",
            residentialRequirementApplies: "UNRESOLVED - needs verification"
        },
        stem: {
            description: "STEM/Science pathway - select STEM subjects in all 5 choices",
            generalRulesApply: "UNRESOLVED - needs verification",
            residentialRequirementApplies: "UNRESOLVED - needs verification"
        },
        sen: {
            description: "Special Education Needs pathway",
            rules: "UNRESOLVED - needs verification"
        }
    }
};

// ========================================
// UNRESOLVED QUESTIONS (flagged for review)
// ========================================
// `guidelines` links each question to the guideline ids it affects so the
// Guidelines page can surface the uncertainty in context.

export const UNRESOLVED_QUESTIONS = [
    {
        id: 1,
        question: "How do the general category and residential limits interact with the pure TVET pathway?",
        source_needed: "Official CSSPS guidelines or GES clarification",
        guidelines: [13]
    },
    {
        id: 2,
        question: "How do those general limits interact with the STEM/Science pathway?",
        source_needed: "Official CSSPS guidelines or GES clarification",
        guidelines: [14]
    },
    {
        id: 3,
        question: "What specific rules apply to Special Education Needs selections?",
        source_needed: "Official SEN selection guidelines",
        guidelines: [18]
    },
    {
        id: 4,
        question: "The PDF Appendix 3 header says 'At Most one (1) Category B school' but OFFICIAL_GUIDELINES.md says 'One Category B and one Category C'. Which is correct?",
        source_needed: "Authoritative CSSPS clarification",
        guidelines: [9, 17]
    },
    {
        id: 5,
        question: "Which programmes and programme codes are available at each relevant school?",
        source_needed: "Official programme code register",
        guidelines: [2, 20]
    },
    {
        id: 6,
        question: "What Day and Boarding options are officially permitted for each school and pathway?",
        source_needed: "Official school register (partially available in PDF)",
        guidelines: [6, 7, 8, 13, 14]
    },
    {
        id: 7,
        question: "How should schools appearing in more than one official list be treated?",
        source_needed: "Official CSSPS guidelines",
        guidelines: []
    },
    {
        id: 8,
        question: "How does the overall three-Boarding / two-Day requirement combine with the category-specific residential instructions?",
        source_needed: "Authoritative CSSPS clarification",
        guidelines: [6, 7, 8]
    }
];

export const GUIDELINES_YEAR = 2025;

export default { GUIDELINES, GUIDELINE_SECTIONS, GUIDELINE_SOURCE, VALIDATION_RULES, UNRESOLVED_QUESTIONS };
