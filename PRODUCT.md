# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

static HTML/CSS (incumbent: hand-written `.html` files, one shared stylesheet, one shared script, GSAP loaded from CDN). No framework, no build step, no package manager. Confirmed by the existing codebase rather than asked.

## Users

Primary: French-speaking students, broadly — not tied to one school or one course of study. They arrive without prior knowledge of the outlet and have to work out within seconds what it is and whether it is for them. Reading and listening happen in the gaps of a student day: between classes, in transit, late at night.

Secondary (unconfirmed, do not design for until established): the editorial team itself, who publish into the site.

## Product Purpose

A student-run media outlet covering culture, arts, and society. It publishes written articles and a podcast. The site's job is twofold and was stated by the user in these terms: act as a **vitrine** for the latest articles and podcast episodes, and **make the outlet known** to people who have never encountered it.

Success is a first-time visitor who understands what the outlet is, finds something worth their attention, and comes back or subscribes.

## Positioning

Student-made editorial coverage of culture, arts, and society, written and recorded by students for students. The differentiator is the vantage point, not the topic: the same cultural subjects the established press covers, reported by people living the student condition rather than observing it.

Not a personal blog, not a school newsletter, not a single-show podcast. A media outlet with more than one format.

## Operating Context

- Two content formats of equal editorial standing: written articles and podcast episodes. The podcast is one format the outlet publishes, not the product itself.
- Discovery is cold. Most first visits come from a shared link or a social post, from someone who does not know the outlet's name.
- Consumption is fragmented and mobile-heavy: short reading windows, listening while doing something else.

## Capabilities and Constraints

- The site ships as static files opened directly or served statically. No server, no CMS, no database. Content is authored into the markup.
- External network is required at runtime for any CDN-hosted font or library; the pages must stay legible if a CDN fails.
- **Undecided:** the outlet's name. The incumbent "OndeÉtu" was invented during an earlier draft and carries no commitment. The user has confirmed the name is free to change.
- **Undecided:** publishing cadence, section taxonomy, and whether contributors get bylines pages.

## Brand Commitments

Two constraints the user pinned explicitly:

- **Language: French.** All interface copy and content in French.
- **Colour: pink.** The pink family is the directing colour and stays, whatever visual direction is chosen. Pinned as a family, not as a specific tint — the full material range of pink remains in play.

Nothing else is committed: name, structure, typography, and layout are all open.

## Evidence on Hand

**None. Every piece of content currently in the repository is fabricated.** The user has confirmed the project is a fictional demo, which permits authoring illustrative content at full fidelity, but the following must never be presented as real or carried forward as fact:

- Episode titles, article titles, publication dates, and durations.
- Audience figures (the incumbent "12 000 auditeurs", "18 pays", "47 épisodes" are invented).
- Team member names, roles, photographs, and quotations.
- The founding date and origin story.

Any figure or testimonial shipped on the site is demonstration material and must be labelled as such in the handoff, with a replacement list handed to the user.

## Product Principles

1. **The content is the argument.** A stranger is convinced by an article or an episode that looks worth their time, not by a claim about the outlet's quality.
2. **Two formats, one outlet.** Articles and podcast share a masthead and an editorial voice; neither is a sub-page of the other.
3. **Legible cold.** Every surface has to work for someone with no prior context and no patience.
4. **Student vantage, not student excuse.** The work is presented at professional standard; being student-made is the perspective, never a disclaimer.
5. **Invent nothing that claims to be true.** Demonstration content is authored fully and labelled; audience numbers, partnerships, and testimonials stay out until real.

## Accessibility & Inclusion

No product-specific standard was established. Baseline applies: legible contrast, keyboard operability, and motion that respects `prefers-reduced-motion`.
