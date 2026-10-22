# PRODUCT SPECIFICATION
## BECE School Selection Guidance Application

**Document:** `PRODUCT_SPECIFICATION.md`  
**Product:** BECE School Selection Guidance Application  
**Initial ruleset:** 2025 school-selection guidelines  
**Primary market:** Ghana  
**Status:** Product requirements and implementation reference

---

# 1. Product Overview

## 1.1 Purpose

The application helps BECE candidates, parents or guardians, teachers, and headteachers understand and prepare their senior high school or technical institution selections.

It guides users through the school-selection process, explains the applicable guidelines, helps them choose eligible schools and programmes, validates their selections, and presents a final review resembling the official selection form.

The application should reduce confusion, prevent avoidable selection mistakes, and help users understand the choices they are making.

## 1.2 Product Goals

The application must:

1. Explain the school-selection guidelines in an understandable and engaging way.
2. Help users explore available schools and programmes.
3. Support the selection and ranking of five main schools.
4. Support the selection of two alternative schools.
5. Help users select appropriate programmes and residential preferences.
6. Prevent invalid selections wherever the applicable rules are known.
7. Explain why a selection is unavailable or invalid.
8. Allow users to review and edit their selections before completing the process.
9. Display a clear, form-like summary of all seven choices.
10. Use reliable school and programme data rather than invented information.

## 1.3 What the Application Is Not

The application is a guidance and preparation tool. Unless an official integration is introduced and verified, it must not claim to:

- Submit selections directly to CSSPS.
- Guarantee placement in a selected school.
- Guarantee that a candidate will receive a particular programme.
- Guarantee admission or placement.
- Replace official instructions, school-selection forms, or authorised guidance.
- Change a candidate's official placement.

The interface must clearly distinguish preparing a selection from officially submitting it.

---

# 2. Target Users

## 2.1 BECE Candidates

Candidates need to understand the rules, compare schools, select programmes, rank their preferences, and avoid mistakes.

The interface should use clear language and provide explanations without assuming that the user already understands school categories or residential arrangements.

## 2.2 Parents and Guardians

Parents and guardians need to understand the available options, review the candidate's choices, and support the decision-making process.

Important selection rules should be visible rather than hidden in technical descriptions.

## 2.3 Teachers and Headteachers

Teachers and headteachers may use the application to guide candidates, review choices, and identify possible selection errors.

The initial product should not assume that a formal teacher account, school administration dashboard, or multi-user workflow is required unless separately agreed.

---

# 3. Existing Project Resources

The existing GitHub repository is:

https://github.com/arthurone95-tech/School-Selection

Relevant existing resources include:

- `js/school-data.js`
- `js/shs-recommendation.js`
- The existing `css/` directory
- The 2025 second-cycle schools register PDF in the repository
- Existing screenshots and other project resources

## 3.1 School Data

The existing school dataset contains approximately 980 school records across Ghana's 16 regions.

The agent must inspect the actual dataset before implementation and identify:

- Available regions.
- School names and identifiers.
- School locations.
- School types and status fields.
- Available programme information.
- Any existing residential information.
- Any missing or inconsistent fields.

The existing dataset is the starting point for the application. Do not replace it with a newly invented list of schools.

Do not assume that every field in the existing dataset is sufficient to validate official selection eligibility. Identify any additional information needed and document the source required to obtain it.

## 3.2 Existing CSS

The existing `css/` directory belongs to another product.

Its colour palette and selected design ideas may be reused or adapted. The new application must have its own product identity, interface structure, component names, and application logic.

A separate prompt will provide additional instructions about reusing the existing CSS design elements.

Do not copy the previous product's identity or blindly reuse its layouts and functionality.

---

# 4. Main Application Structure

The application should provide the following main areas.

## 4.1 Home or Welcome Page

The welcome page should explain the application's purpose and provide clear ways to begin.

It should provide access to:

- Start school selection.
- Understand the guidelines.
- Explore schools, where appropriate.
- Continue an existing selection if persistence is implemented.
- Review important limitations and disclaimers.

The page should not overwhelm first-time users with every rule at once.

## 4.2 Guidelines Section

The guidelines section must teach users how school selection works.

Its content must come from `OFFICIAL_GUIDELINES.md` and the verified source documents.

It should be interactive and easy to navigate rather than displaying one long block of text.

Possible presentation methods include:

- Step-by-step explanations.
- Cards containing individual rules.
- Next and Back navigation.
- Expandable explanations.
- Questions and answers.
- Small examples illustrating valid and invalid selections.
- Progress indicators showing how much of the guide has been completed.

These are design possibilities, not a requirement to implement every interaction.

The final interface should make it easy for users to understand the rules before beginning their selections.

### Content accuracy

Keep the following separate:

1. **Official rule:** The wording taken from the official source.
2. **Plain-language explanation:** An explanation written to help users understand the rule.
3. **Application behaviour:** What the application does to help enforce the rule.

Never present an application-generated explanation as a direct quotation from an official document.

## 4.3 School Selection Section

This is the main workflow.

Users must be able to choose five main schools, rank them by preference, select eligible programmes and residential preferences, choose alternatives, and review their complete selection.

## 4.4 Final Review Section

The final review must display all selected schools and their relevant details in a clear, form-like layout.

Users must be able to return to an earlier choice and correct it before completing the preparation workflow.

The application must not imply that this review is an official submission receipt.

---

# 5. Five Main School Choices

## 5.1 Number of Choices

The user must select five main schools.

The choices must be ranked:

1. First choice: most preferred.
2. Second choice.
3. Third choice.
4. Fourth choice.
5. Fifth choice.

The ranking must be visible throughout the selection process and in the final review.

## 5.2 Selecting a School

When a user selects a school, the application should show the relevant details before the user proceeds.

Depending on the verified data available, these details may include:

- School name.
- School code or identifier.
- Region.
- Location.
- School category.
- School type.
- Eligible programmes.
- Available residential options.
- Relevant restrictions or warnings.

Do not display missing information as if it were verified.

## 5.3 Choosing a Programme

The user must select an eligible programme for each main school where the official process requires a programme selection.

The programme list must depend on the selected school and the applicable pathway.

The application must not offer every programme to every school simply because the programme exists in the dataset.

If programme eligibility cannot be established from verified data, the application must identify the missing information rather than invent eligibility.

## 5.4 Choosing Day or Boarding

The user must select a residential preference for each main choice.

The application must represent the residential options actually available and permitted for that school and selection pathway.

At a minimum:

- If only Day is permitted, Boarding must not be selectable.
- If only Boarding is permitted, Day must not be selectable.
- If both are permitted, the user may select an eligible option.
- If availability is unknown, the application must not silently assume that both options are available.

Unavailable options may remain visible in a disabled state if this improves understanding. If disabled options are displayed, explain why they cannot be selected when the reason is known.

The final review must display the chosen residential preference for every main school.

## 5.5 Editing Main Choices

Users must be able to revise their selections.

They should be able to:

- Replace a school.
- Change a programme.
- Change Day or Boarding where permitted.
- Change the order of preferences.
- Remove a selection and choose another school.
- Review the effect of a change on the other selections.

Whenever a change affects the validity of another choice, the application must revalidate the complete selection.

The application must not leave the user with an apparently valid selection after a change has made it invalid.

---

# 6. School Categories and Selection Limits

The 2025 guidelines describe public second-cycle schools using Categories A, B, and C.

The application must apply the verified rules for the selected pathway.

The general selection rules supplied for the 2025 process include:

- No more than one Category A school among the five main choices.
- No more than two Category B schools among the five main choices.
- Category C choices are subject to the applicable residential and pathway requirements.
- The overall Day and Boarding requirement must be respected where applicable.

The general residential requirement supplied for the 2025 process is three Boarding choices and two Day choices.

However, special pathways may have different selection criteria. The application must apply only the rules confirmed to govern the user's pathway.

## 6.1 Validation Behaviour

The application must count the relevant selections and check the applicable limits.

For example, if the applicable rules prohibit more than one Category A school and the user attempts to select a second Category A school, the application should prevent the invalid selection or clearly require the user to correct it before proceeding.

It should explain the reason in plain language.

The application must not enforce a general rule against a special pathway unless the official instructions confirm that the general rule applies to that pathway.

## 6.2 Category-Specific Day and Boarding Rules

The supplied 2025 instructions describe specific Day and Boarding arrangements for Category B and Category C choices.

The implementation must model these requirements using verified rules rather than scattered assumptions in interface components.

Before enforcing a detailed combination rule, confirm its exact meaning from the official source documents.

If the exact rule is not yet verified, record it as an unresolved requirement instead of presenting a guess as an official rule.

---

# 7. Alternative School Choices

## 7.1 Number and Categories

The user must select two alternative schools:

- One Category B school.
- One Category C school.

The alternatives must come from the schools eligible for alternative selection under Appendix 3 of the applicable guidelines.

A school must not be offered as an alternative solely because it belongs to Category B or C. Its eligibility for alternative selection must also be verified.

## 7.2 No Duplicate Schools

An alternative school must not duplicate any of the five main schools.

The application must check this condition automatically.

If the user selects a school already present in the main choices, the application should explain that the same school cannot be used again as an alternative and ask the user to select another eligible school.

## 7.3 Alternative Placement Explanation

The interface should explain that alternatives may be relevant if the candidate is not placed in any of the five main choices, according to the applicable official process.

It must not promise that selecting an alternative guarantees placement.

## 7.4 Editing Alternatives

Users must be able to replace either alternative school while preserving valid main choices.

After any change, the application must recheck category eligibility, Appendix 3 eligibility, and duplicate-school restrictions.

---

# 8. Special Selection Pathways

The application must account for pathways that have different selection criteria from the general school-selection process.

These pathways must not be implemented merely as labels. Each must have a verified set of rules and eligible school or programme data.

## 8.1 Pure TVET Pathway

The supplied 2025 instructions state that candidates choosing pure TVET programmes should select five TVET institutes from the applicable Categories A, B, and C, using Day or Boarding as permitted under the relevant selection criteria.

The application must:

- Identify eligible TVET institutions.
- Display eligible technical programmes.
- Validate that the selected programmes qualify for the pure TVET pathway.
- Apply the confirmed residential and category rules for that pathway.
- Explain when a general selection rule does not apply, if the official source confirms an exception.

Do not assume that every technical institution or technical programme automatically qualifies as pure TVET.

## 8.2 STEM or Science Career Interest

The supplied 2025 instructions state that candidates interested in STEM or Science careers should select STEM or Science subjects across all five choices, using eligible schools and residential options under the applicable criteria.

The application must:

- Identify verified STEM schools and schools offering the relevant STEM subjects.
- Display eligible programmes or subjects for each school.
- Ensure all five choices satisfy the applicable pathway requirements.
- Explain when a selected school or programme does not satisfy those requirements.

The application must not infer that a school offers a STEM subject based only on its name or general school type.

## 8.3 Special Education Needs

The supplied guidelines identify Special Education Needs schools in Appendix 4.

The product should account for this information where relevant, but the precise user journey and eligibility rules must be confirmed before implementation.

Do not assume that SEN-related selection is governed by the same rules as every other pathway without checking the official instructions.

## 8.4 Pathway Selection and Rule Precedence

If the application supports pathway selection, the user should be told what the chosen pathway means and which rules apply.

The agent must verify the relationship between general rules and special-pathway rules before implementing them.

Where official documents do not resolve an ambiguity, the application must not silently invent a precedence rule.

---

# 9. School Discovery and Filtering

The application should help users find appropriate schools without making the discovery process unnecessarily complicated.

Where the verified dataset supports them, users should be able to filter schools by:

- Region.
- School category.
- School type.
- Programme.
- Residential option.
- Selection pathway.
- Alternative-school eligibility.

The available filters must reflect actual data and verified eligibility rules.

## 9.1 Search

If school search is provided, users should be able to search by school name and other useful verified identifiers.

Search results must clearly identify each school and avoid confusing schools with similar names.

## 9.2 Filtering Must Not Replace Validation

Filtering helps users discover possible options. It does not prove that a school is valid for a particular candidate or selection pathway.

The application must validate a school against the current selection, applicable rules, programme eligibility, residential options, and alternative-choice restrictions before accepting it.

---

# 10. Selection State and Consistency

The application must maintain one consistent representation of the user's selections.

The five main choices must retain their preference order.

The two alternatives must remain distinct from the main choices.

Each choice should retain the relevant information required for validation and review, such as:

- School identifier.
- School name.
- Category, where verified.
- Programme identifier or name, where applicable.
- Residential preference.
- Selection position.
- Applicable pathway.
- Validation status.

The implementation may choose the appropriate internal data structure, but the same selection must not have conflicting values in different parts of the interface.

## 10.1 Changes and Revalidation

When a school, programme, residential preference, pathway, or ranking changes, the application must revalidate all affected selections.

The application must handle cases where a previously valid selection becomes invalid after another choice is changed.

For example, replacing a school could create a duplicate between a main choice and an alternative. The application must detect that conflict and explain how to resolve it.

## 10.2 Persistence

The application should make a deliberate decision about whether users can leave and return without losing their selections.

If persistence is implemented, explain what is saved and where it is saved.

Do not store sensitive personal information unnecessarily.

Do not claim that selections are saved or recoverable unless that functionality has been implemented and tested.

---

# 11. Validation and Error Messages

Validation must be understandable and actionable.

The application should identify the specific issue and tell the user what needs to change.

Examples of useful messages include:

- "You have selected more Category A schools than the applicable rules allow."
- "Choose a programme offered by this school."
- "Boarding is not available for this selection."
- "This alternative school is already in your main choices."
- "Select one eligible Category B alternative school."
- "Select one eligible Category C alternative school."
- "This school has not been verified as eligible for the selected pathway."

These are illustrative application messages, not quotations from official guidelines.

## 11.1 Validation Timing

Validation should occur as users make selections, where practical, rather than waiting until the final review.

The final review must run a complete validation check before presenting the selection as ready.

## 11.2 Unknown or Incomplete Data

The application must distinguish between:

- A selection known to be valid.
- A selection known to be invalid.
- A selection that cannot yet be verified because required information is missing.

Missing information must not automatically be treated as proof of eligibility.

If necessary, block completion of the affected selection and explain what information is missing.

---

# 12. Final Review and Form-Like Preview

The final review is a major part of the product.

It should resemble the structure of the official school-selection form sufficiently for users to understand how their choices have been prepared.

## 12.1 Main Choices

Display all five main choices in preference order.

Where applicable, show:

- Preference number.
- School code.
- School name.
- Category.
- Programme code.
- Programme name.
- Residential preference.

Only display codes and classifications that are available and verified.

## 12.2 Alternative Choices

Display the two alternatives separately from the main choices.

Clearly identify the Category B alternative and Category C alternative, once their eligibility has been verified.

## 12.3 Review Controls

Users must be able to return to the relevant step and edit a choice.

The application must preserve the other valid choices when an edit does not affect them.

## 12.4 Completion Status

The application must communicate whether the selection:

- Passes all implemented and verified checks.
- Contains validation errors.
- Contains unresolved items that prevent reliable verification.

Do not use a success label if required checks have not been performed.

## 12.5 Official Submission Disclaimer

The final preview must explain that it is a preparation preview and not an official CSSPS submission unless an authorised submission feature has actually been implemented.

---

# 13. Data and Source Requirements

The quality of the application depends on reliable school and programme data.

## 13.1 Existing School Records

Inspect and reuse the existing school dataset as the starting point.

Preserve useful existing identifiers and information.

Do not discard the dataset or replace it with invented sample records for the production workflow.

## 13.2 Additional Data

Determine whether the product needs verified data for:

- School categories.
- Appendix 3 alternative-school eligibility.
- School codes.
- Programme codes.
- School-to-programme relationships.
- Day and Boarding availability.
- Technical institution programmes.
- STEM schools and STEM subjects.
- Special Education Needs schools.
- Pathway-specific restrictions.

## 13.3 Source Verification

Use the official 2025 guidelines, the relevant appendices, and the official school register as appropriate.

If two sources disagree, record the discrepancy and identify which source needs authoritative confirmation.

Do not silently choose one interpretation.

## 13.4 Annual Updates

School categories, available programmes, residential options, and selection rules may change.

The data and rules should be organised so that a future annual update does not require rewriting the entire application.

The initial implementation must identify the ruleset year clearly.

Do not automatically apply 2025 rules to a later year's process without checking the relevant official documents.

---

# 14. Interface and Usability Requirements

The application should be usable by people with different levels of digital literacy.

## 14.1 Clarity

- Use plain language for explanations.
- Keep official wording accurate.
- Make the current step obvious.
- Make selected and unselected options visually distinct.
- Explain disabled choices when the reason is known.
- Use clear labels for Day, Boarding, main choices, and alternatives.
- Avoid unnecessary technical terminology in the candidate-facing interface.

## 14.2 Navigation

Users should be able to move forward and backward through the selection process.

Going backward must not unnecessarily erase completed choices.

The interface should indicate progress without making users feel that they cannot correct an earlier decision.

## 14.3 Responsive Design

The application must work on common mobile phone, tablet, and desktop screen sizes.

The selection workflow and final review must remain understandable on narrow screens.

## 14.4 Accessibility

Use readable text, sufficient colour contrast, clear focus states, descriptive labels, and controls that can be operated using a keyboard where applicable.

Do not rely on colour alone to communicate that a choice is invalid or unavailable.

## 14.5 Visual Identity

Create a coherent visual identity for this product.

Reuse only the colours and selected design ideas authorised for reuse from the existing CSS resources.

Do not carry over the identity, layouts, names, or functionality of the unrelated previous product.

---

# 15. Privacy and Security

The application should collect only the information required for its actual functionality.

If the application does not need a candidate's full name, BECE index number, contact information, or other personal details, do not collect them merely to make the interface look like an official form.

If personal information or accounts are introduced, document:

- What information is collected.
- Why it is collected.
- Where it is stored.
- Who can access it.
- How users can delete it, where applicable.

## 15.1 Candidate details on the review form

The review page reproduces the placement form so a candidate can check and print
their prepared choices. The school-related parts of the form are filled from the
saved selection; the candidate-specific parts are typed once in the review page's
"Your details" panel. This is a deliberate, documented exception to the "do not
collect personal details merely to make the interface look like an official form"
rule above: the details have a real function, because they complete a form the
candidate prints. They are documented as follows.

- **What is collected:** candidate name, BECE index number, JHS name, gender,
  district, region, residential location, parent/guardian name and contact, date,
  and headteacher's contact.
- **Why:** only to fill the printable placement form. Nothing else uses it.
- **Where it is stored:** this browser's `localStorage`, key
  `ssg.review.candidate.v1`. It is never transmitted; the application has no
  server and makes no network requests with it.
- **Who can access it:** only this browser profile on this device.
- **How to delete it:** clear the fields in the review page's "Your details"
  panel, or clear the site's data in the browser.

Signatures, the school stamp and headteacher validation are **not** collected and
cannot be entered: those fields stay blank and are completed by hand on the
printed form, so a typed value can never stand in for a real signature
(Official Guidelines 22-24).


Do not present a locally prepared selection as officially registered with CSSPS.

---

# 16. Testing Requirements

Testing must cover the complete selection workflow, not only whether individual buttons work.

## 16.1 Main Choice Tests

Test that:

- Five main choices can be selected.
- The choices are ranked correctly.
- School details appear correctly.
- Programme selections are restricted to verified eligible programmes.
- Residential preferences follow the applicable rules.
- Editing a choice triggers the necessary revalidation.
- Reordering choices updates the displayed preference order.

## 16.2 Category and Residential Tests

Test the confirmed category limits and residential rules.

Include both valid and invalid combinations.

Do not write tests that assume an unresolved official rule is settled. Mark those tests as pending until the rule is verified.

## 16.3 Alternative Choice Tests

Test that:

- Both alternatives are required when the workflow requires them.
- One eligible Category B alternative can be selected.
- One eligible Category C alternative can be selected.
- Alternatives come from the verified Appendix 3 list.
- A main choice cannot be repeated as an alternative.
- Changing a main choice triggers duplicate checking.

## 16.4 Special Pathway Tests

Test each supported special pathway independently.

Verify that the correct schools, programmes, residential options, and selection rules are applied.

## 16.5 Final Review Tests

Test that:

- All five main choices appear in the correct order.
- Both alternatives appear in the correct section.
- Programme and residential information is correct.
- Invalid selections are clearly identified.
- Editing and returning to the review works correctly.
- The preview does not falsely claim official submission.

## 16.6 Responsive Tests

Check the main workflow and final review on mobile and desktop layouts.

---

# 17. Acceptance Criteria

The product is ready for review when the following conditions are satisfied:

1. Users can understand the purpose of the application from the welcome page.
2. Users can access an interactive guidelines section.
3. Users can select and rank five main schools.
4. Users can select eligible programmes and residential preferences.
5. Verified category and pathway rules are enforced correctly.
6. Users can select two eligible alternatives without duplicating a main choice.
7. Users can edit their selections and see the resulting validation state.
8. The final review clearly presents all seven choices.
9. The interface distinguishes invalid selections from selections that cannot yet be verified.
10. The application uses the existing school dataset appropriately.
11. No unverified school, programme, category, or residential eligibility is invented.
12. The application works on mobile and desktop screen sizes.
13. The interface does not claim to submit selections officially unless that capability exists.
14. Important workflows have been tested and their results documented.
15. Any unresolved official-rule questions are documented instead of silently guessed.

---

# 18. Unresolved Questions Requiring Verification

The following questions must be resolved against official documentation before the corresponding rules are enforced.

1. How do the general category and residential limits interact with the pure TVET pathway?
2. How do those general limits interact with the STEM/Science pathway?
3. What specific rules apply to Special Education Needs selections?
4. What is the authoritative and complete list of schools eligible for alternative selection under Appendix 3?
5. Which programmes and programme codes are available at each relevant school?
6. What Day and Boarding options are officially permitted for each school and pathway?
7. How should schools appearing in more than one official list be treated?
8. Which official rules apply when the general instructions and a special-pathway instruction appear to differ?
9. Are any additional requirements imposed by the current official form or instructions that are not captured in this document?

Record the source used to resolve each question.

Do not mark a question resolved merely because an implementation decision has been made.

---

# 19. Implementation Principle

The application must be a reliable school-selection guidance tool, not merely a school search interface.

Its core responsibility is to help users make informed choices while preserving the distinction between official rules, verified data, explanatory guidance, and application behaviour.

Where the official requirements are known, implement and test them accurately.

Where information is incomplete, expose the uncertainty and seek verification.

Do not invent rules to make the workflow appear complete.