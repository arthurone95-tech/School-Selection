# DESIGN_REFERENCE.md

# School Selection App — Design Reference

## 1. Purpose

This document defines the design principles and reusable visual patterns for the School Selection application.

The project has an existing CSS reference from another product. That reference contains useful design tokens, layout patterns, components, responsive rules, and accessibility practices.

The goal is to **reuse appropriate design principles without copying the old product's identity, content, or unrelated interface designs**.

The final application should feel like a coherent, modern, trustworthy, and easy-to-use Ghanaian school-selection guidance platform.

This document is a design reference, not a requirement to reproduce every existing CSS class or page.

## 2. Design Direction

The interface should be:

- **Clear:** Users should understand what to do next without unnecessary explanations.
- **Trustworthy:** Official guidance and school information must be presented carefully.
- **Practical:** The selection process should be easy to complete on a phone or computer.
- **Consistent:** Buttons, forms, cards, headings, spacing, and feedback should behave consistently.
- **Accessible:** Text, controls, navigation, and feedback should be usable by people with different needs.
- **Responsive:** The interface must work on small mobile screens, tablets, laptops, and larger displays.
- **Lightweight:** Avoid unnecessary animation, visual clutter, and large dependencies.

The application should prioritize completing the school-selection task over decorative elements.

## 3. Existing CSS Reference

The existing CSS reference contains the following areas:

- `variables.css` — design tokens and shared variables.
- `reset.css` — browser normalization and foundational element styles.
- `layout.css` — containers, grids, flex layouts, and page sections.
- `components.css` — buttons, cards, forms, navigation, alerts, and badges.
- `utilities.css` — reusable utility classes.
- `pages.css` — page-specific layouts and responsive styles.

These filenames describe the supplied reference structure. They are not mandatory filenames for the new application.

Before implementation, inspect the actual repository and determine how its current CSS files are organized. Do not assume that every file exists or that its contents match this document.

The reference also contains product-specific layouts, such as career categories, testimonials, authentication screens, and dashboards. These are examples from the original product, not automatic requirements for the school-selection application.

## 4. Design Tokens

Use the supplied CSS variables as the starting point for the visual system.

The agent must inspect the actual CSS source to extract the exact existing values. Do not guess or recreate missing values from memory.

### 4.1 Colour Palette

The reference includes:

- Primary brand colours.
- Secondary and accent colours.
- Semantic text colours.
- Page and surface backgrounds.
- Border colours.
- Status colours for success, warning, error, and informational feedback.

Reuse appropriate colours where they suit the school-selection product.

Do not assume that every colour from the original product must be retained. Confirm that text and interactive elements have sufficient contrast against their backgrounds.

Use colour consistently to distinguish primary actions, secondary actions, neutral information, and validation feedback.

**Accessibility requirement:** Do not communicate errors, selection status, eligibility, or other important information through colour alone. Include clear text, labels, icons where appropriate, or other visual indicators.

### 4.2 Typography

The reference uses Inter and Poppins as font-family options, with fluid font sizes.

Inspect the actual font declarations before deciding which font to use.

The new interface should have a clear typographic hierarchy:

- Page titles.
- Section headings.
- Card headings.
- Body text.
- Supporting descriptions.
- Form labels.
- Helper text.
- Validation messages.

Use readable font sizes and line heights, especially on mobile screens. Avoid excessively small text for important school information, instructions, and selection requirements.

Do not introduce additional font families without a clear reason.

### 4.3 Spacing

The reference includes reusable spacing variables for margins, padding, gaps, and section spacing.

Reuse the underlying spacing approach to establish consistency across the application.

Apply spacing consistently to:

- Page margins.
- Content containers.
- Form fields.
- School cards or rows.
- Filter groups.
- Selection lists.
- Buttons.
- Sections and headings.
- Mobile layouts.

Do not add arbitrary spacing values throughout the application when an appropriate shared token already exists.

### 4.4 Containers and Breakpoints

The reference defines a maximum content width of approximately `1280px`, a header height of approximately `70px`, and breakpoints around `640px`, `768px`, `1024px`, and `1280px`.

These are reference values, not compulsory requirements.

Inspect the source and decide which values suit the application. Avoid introducing multiple competing breakpoint systems.

The layout should remain comfortable and readable on narrow screens. Wide screens should use available space without stretching text or forms excessively.

### 4.5 Borders, Shadows, and Transitions

The reference includes reusable border-radius, shadow, transition, and z-index tokens.

Use them consistently where appropriate.

- Use restrained shadows to establish hierarchy.
- Use borders to distinguish surfaces and form controls.
- Keep corner radii consistent.
- Use transitions only when they improve interaction feedback.
- Reserve higher z-index values for elements such as dialogs, overlays, dropdowns, and mobile navigation.

Avoid excessive shadows, gradients, animation, and decorative effects that distract from the selection process.

## 5. Layout Principles

### 5.1 Page Structure

Use a consistent page structure with clear separation between navigation, primary content, and supporting information.

Keep the main task visually prominent.

Avoid overcrowding pages with too many cards, statistics, badges, or unrelated information.

### 5.2 Containers

Use a shared container system with consistent horizontal padding and a sensible maximum width.

Content should not touch the edges of the screen on mobile devices.

### 5.3 Grid and Flex Layouts

Reuse the reference's grid and flex layout principles where useful.

Possible applications include:

- Responsive school listings.
- Filter and search layouts.
- Selection summaries.
- Information panels.
- Form sections.
- Desktop sidebars, where justified.

Use a single-column layout when it provides the clearest experience on mobile. Do not force desktop-style multi-column layouts onto small screens.

### 5.4 Responsive Behaviour

Design for mobile first, then enhance the layout for larger screens.

At minimum, verify:

- Small mobile screens.
- Larger mobile screens.
- Tablets.
- Desktop screens.

Ensure that navigation, school information, buttons, filters, forms, and selection controls remain usable at each size.

Prevent horizontal overflow, clipped controls, overlapping text, and unnecessarily small touch targets.

## 6. Reusable Component Guidance

The following components from the reference may be adapted if they suit the product.

### 6.1 Buttons

The reference includes primary, secondary, outline, and light button styles.

Use a consistent button hierarchy:

- **Primary:** the main action on a screen.
- **Secondary:** an alternative action.
- **Outline or neutral:** a lower-emphasis action.
- **Destructive:** an action that removes or clears information, when required.

Button labels should describe their actual actions.

Provide visible hover, focus, active, and disabled states. Ensure that disabled buttons remain visually distinguishable from enabled buttons.

### 6.2 Cards

The reference includes reusable card styles.

Cards may be useful for school information, selection summaries, guidance, or other content that benefits from visual grouping.

Each card should have a clear purpose. Avoid placing every piece of information inside a separate card when a simpler list or section would be easier to scan.

School information should be structured consistently so users can compare relevant details.

### 6.3 Forms and Inputs

The reference includes form groups, inputs, selects, and text areas.

Adapt these patterns for search, filtering, school selection, and other required form interactions.

Requirements:

- Every input must have an understandable label.
- Use appropriate input types.
- Show validation errors near the relevant control.
- Explain how to correct invalid input.
- Preserve valid user input when displaying errors.
- Make keyboard navigation practical.
- Use clear focus indicators.
- Do not rely on placeholders as the only labels.

### 6.4 Navigation

The reference includes a sticky navigation bar, navigation links, a mobile slide-out menu, and an overlay.

Inspect the actual implementation before deciding whether these patterns are suitable.

Navigation should be predictable and should not consume unnecessary screen space. A mobile menu must open, close, and support keyboard interaction appropriately.

Do not copy the original product's logo, name, navigation labels, or product-specific links.

### 6.5 Alerts and Badges

The reference includes alerts and badges.

Use alerts for meaningful feedback, such as successful actions, validation problems, or important notices.

Use badges sparingly for short labels that help users understand information quickly.

Do not use badges as decoration or imply official approval, school eligibility, or guaranteed placement unless the relevant status is supported by verified data.

### 6.6 Overlays and Dialogs

If the application needs a mobile navigation overlay, confirmation dialog, or other layered interface, follow the existing reference's stacking approach where appropriate.

Ensure overlays do not obscure essential instructions or leave users trapped. Keyboard focus and dismissal behaviour must be considered.

## 7. School-Selection Interface Considerations

The following guidance applies specifically to this product.

### 7.1 School Information

Present school information in a consistent, scannable format.

Use clear labels for school attributes and distinguish confirmed information from explanatory guidance.

Do not invent school details, admission requirements, programme availability, eligibility rules, or official status indicators.

### 7.2 Search and Filters

Search and filter controls should be easy to locate and operate.

Group related filters logically. On mobile, ensure that filters do not overwhelm the main school-selection workflow.

When filters are applied, make the resulting state understandable and provide a clear way to change or reset them where appropriate.

### 7.3 Ranked Choices and Alternatives

The product specification defines the intended selection workflow and the number of choices.

The visual interface must make the distinction between ranked choices and alternatives clear.

Users should be able to understand:

- Which position each choice occupies.
- Which school and programme they selected.
- How to change a choice.
- Whether a required position is missing.
- Whether the selection has passed the application's validation checks.

Do not use styling alone to imply that a choice is officially approved or that placement is guaranteed.

### 7.4 Validation and Official Guidance

Present validation results in plain language.

Where a selection conflicts with a documented rule, explain the issue and the action the user can take.

If a rule or data point has not been verified, do not silently convert it into a definitive eligibility decision. Follow `OFFICIAL_GUIDELINES.md` and `PRODUCT_SPECIFICATION.md` for the treatment of uncertain information.

Visual emphasis must reflect the certainty and importance of the underlying information.

### 7.5 Review and Preview

If the workflow includes a review or preview step, make it easy to inspect all selected schools and their ranking before proceeding.

Use clear headings, readable lists, and consistent spacing.

Any print, export, or submission-related styling must follow the approved product specification. Do not invent a submission method or imply that the application submits choices to an official system unless that capability is explicitly implemented and verified.

## 8. Accessibility Requirements

Accessibility is part of the design, not an optional enhancement.

The implementation should:

- Use semantic HTML elements.
- Associate labels with form controls.
- Provide visible keyboard focus.
- Support keyboard navigation for interactive components.
- Maintain sufficient text and control contrast.
- Avoid using colour as the sole indicator of meaning.
- Give interactive controls understandable names.
- Use appropriate accessible names and states for menus, dialogs, and expandable sections.
- Respect reduced-motion preferences.
- Ensure validation messages are clear and accessible.
- Avoid tiny text and controls that are difficult to operate.
- Preserve logical heading order.

Where appropriate, follow established WCAG accessibility practices.

## 9. Motion and Interaction

Use subtle interaction feedback only when it helps users understand what has happened.

Examples include button state changes, menu transitions, and restrained hover effects.

Respect the user's reduced-motion preference.

Do not use animation to communicate essential information that would otherwise be inaccessible.

Interactions must be functional. A button, link, menu, filter, or selection control must not appear operational if it has no working behaviour.

## 10. CSS Architecture and Implementation

The agent must inspect the existing repository before changing the styling architecture.

### Required approach

1. Identify the existing CSS files and their responsibilities.
2. Inspect the provided CSS reference and extract exact design tokens.
3. Identify reusable patterns that genuinely fit the school-selection application.
4. Determine whether the current project already has a reset, container system, or shared component styles.
5. Reuse or adapt suitable patterns without creating duplicate or conflicting styles.
6. Keep school-selection-specific styling separate from unrelated styles where practical.
7. Use consistent naming conventions.
8. Avoid unnecessary global selectors and excessive specificity.
9. Avoid repeated overrides that make styles difficult to maintain.
10. Test responsive layouts and interactive states after implementation.

The agent may propose a different CSS file structure if it is better suited to the existing project. Any proposed restructuring should be explained before implementation.

### Avoid

- Copying the original product's entire `pages.css`.
- Importing styles solely because they already exist.
- Reproducing unrelated career, testimonial, or dashboard sections.
- Copying old product names, branding, content, or navigation.
- Defining the same design token in multiple conflicting places.
- Adding a second CSS reset without checking the current one.
- Using broad global styles that unintentionally break existing elements.
- Rewriting unrelated application code to achieve a visual change.
- Adding unnecessary libraries for effects that CSS can handle adequately.

## 11. Design Reference Versus Product Requirements

This document guides visual design and implementation. It does not replace the other project documents.

Use the documents according to their responsibilities:

- `OFFICIAL_GUIDELINES.md` defines the source guidance and how uncertainty must be handled.
- `PRODUCT_SPECIFICATION.md` defines the intended user experience, features, workflow, and validation requirements.
- `AGENT_BUILD_RULES.md` defines the agent's working process, repository inspection, implementation discipline, and testing expectations.
- `DESIGN_REFERENCE.md` defines the visual principles and reusable design patterns.

If a design decision conflicts with an approved product requirement, the product requirement takes precedence.

If a visual treatment could misrepresent official information or eligibility, accuracy and clarity take precedence over appearance.

## 12. Design Verification Checklist

Before considering the interface complete, verify the following.

### Visual consistency

- [ ] Colours and typography are consistent.
- [ ] Spacing, borders, radii, and shadows follow the chosen design system.
- [ ] Buttons, cards, inputs, alerts, and navigation use consistent styles.
- [ ] The interface does not retain unrelated branding from the original product.

### Responsive behaviour

- [ ] The application works on small mobile screens.
- [ ] The application works on tablets and desktops.
- [ ] No important content is clipped or overlapped.
- [ ] Forms, filters, menus, and selection controls remain usable.
- [ ] No unintended horizontal scrolling occurs.

### Accessibility

- [ ] Inputs have associated labels.
- [ ] Keyboard focus is visible.
- [ ] Interactive controls can be operated using the keyboard where applicable.
- [ ] Text and controls have adequate contrast.
- [ ] Important states are not communicated through colour alone.
- [ ] Reduced-motion preferences are respected.

### Product-specific clarity

- [ ] School information is easy to scan.
- [ ] Ranked choices and alternatives are clearly distinguished.
- [ ] Validation feedback explains problems and next steps.
- [ ] Unverified rules are not presented as confirmed facts.
- [ ] No design element implies guaranteed placement or official approval without evidence.

### Implementation quality

- [ ] Existing styles were inspected before changes were made.
- [ ] Duplicate resets, conflicting tokens, and unnecessary overrides were avoided.
- [ ] Interactive elements have working behaviour.
- [ ] Relevant responsive and functional checks were completed.
- [ ] Remaining design uncertainties are documented.

## 13. Final Instruction to the Coding Agent

Treat the supplied CSS as a **reference system to study and adapt**, not a template to copy blindly.

First inspect the actual repository and the supplied CSS. Identify the exact tokens and reusable patterns that are suitable for the school-selection application. Then explain the proposed design approach and any important trade-offs before implementation.

Keep the design coherent, responsive, accessible, and focused on the school-selection task.

Do not invent official rules, school information, or eligibility decisions to make the interface appear complete. Do not begin implementation until the repository inspection and proposed implementation phases have been presented and approved, as required by `AGENT_BUILD_RULES.md`.