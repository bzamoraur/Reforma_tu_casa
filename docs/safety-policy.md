# Safety policy

Reforma Quest Madrid is an **educational** game. It must never teach unsafe DIY, give legal/normative claims without sources, or encourage hiding work from authorities or neighbours.

## Allowed content

- How to ask better questions.
- How to compare quotes and read a budget.
- How to document work (photos, written scope, change orders).
- How to inspect _visible_ quality.
- How to understand risks and require tests/certificates.
- Simple, low-risk DIY only: basic painting, surface preparation, cleaning, measuring, documenting, checklisting.

## Forbidden content

- Step-by-step electrical installation.
- Gas work of any kind.
- Structural / load-bearing modifications.
- Complex plumbing instructions that could cause damage.
- Waterproofing presented as foolproof.
- Advice to avoid licences or to hide work from authorities/neighbours.
- "Tricks" that reduce safety.
- Legal claims without a source; price claims without date/source/context.
- Content that encourages confrontation without evidence.

## Workarounds must be legitimate

Every "workaround" is framed as: situation → why it may help → constraints → risks → when to reject it → when to call a professional → expert-review status. See the `legitimateWorkarounds` field in the content schema. Examples (pending expert validation) include surface-mounted solutions where appropriate, staged inspections before paying, itemized change orders, and temporary mockups before custom orders.

## Content status discipline

Every technical item carries `status` and `expertReview`. Until a human expert validates it, an item stays `draft` or `pending_expert_review`. Nothing is `expert_verified`/`source_verified` without complete metadata. This is enforced by `scripts/content-lint.ts`.

## Risk levels and safety notices

Items carry a `riskLevel` (`low|medium|high|critical`). Any `high`/`critical` item **must** include a `safetyNotice`. Level 4 (critical installations) is deliberately the strictest: no execution instructions, only how to require professionals, tests, and certificates.

## Enforcement

- `npm run content:lint` — schema, source integrity, safety notices, forbidden-DIY scan, status discipline.
- `bash scripts/check-secrets.sh` — secret scan.
- `safety-reviewer` subagent — judgement-level review with blocking authority.

## Disclaimers

The game shows a disclaimer on the menu and scorecard and in the README: the content is draft, pending expert validation, and is not professional, legal, or technical advice.
