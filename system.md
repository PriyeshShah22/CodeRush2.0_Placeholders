# Community Redressal Planner — System Specification

## 1. Document Purpose

This document defines the product, system behavior, architecture, features, workflows, safety constraints, data model, evaluation plan, and implementation expectations for the **Community Redressal Planner**.

The application is a multilingual, privacy-aware civic grievance and service-resolution platform that helps residents report local issues and helps authorized public-service teams convert those reports into deduplicated, prioritized, accountable workflows.

The system is not intended to replace human civic authorities. It is an **AI-assisted planning and routing system**. AI may classify, summarize, detect duplicates, recommend routes, estimate urgency, predict SLA risk, and suggest escalation paths, but authorized humans remain responsible for final routing overrides, eligibility, enforcement, emergency decisions, and complaint resolution.

The most important system outcome is not simply better complaint summaries. The product must improve **accountable handoff from resident report to responsible service team**, reduce incorrect routing, make delays visible, protect complainant privacy, and provide measurable evidence of service performance.

---

# 2. Product Vision

Residents often do not know:

- which department is responsible for an issue,
- which ward or jurisdiction owns the problem,
- whether their complaint is already reported,
- whether an urgent issue is being handled,
- why their complaint was assigned to a department,
- when they should expect an update,
- how to correct or appeal an incorrect classification,
- or what happens when an SLA is missed.

At the same time, civic teams face:

- duplicate complaints,
- incomplete or multilingual reports,
- ambiguous locations,
- misrouted tickets,
- overloaded departments,
- poor coordination across departments,
- weak SLA visibility,
- limited auditability,
- and little evidence about recurring community problems.

The Community Redressal Planner connects both sides through a single workflow:

**Report → Understand → Protect → Deduplicate → Route → Review → Assign → Track → Escalate → Resolve → Measure**

---

# 3. Primary Users

## 3.1 Residents

Residents use the system to:

- submit complaints,
- submit complaints in supported languages,
- upload optional image/audio evidence,
- provide or correct location,
- receive a complaint reference number,
- track progress,
- see the responsible department,
- understand the expected next step,
- receive notifications,
- correct inaccurate details,
- appeal or request review,
- manage consent,
- and understand evidence retention.

## 3.2 Community Organizations

Authorized community organizations may:

- submit or assist with community complaints,
- view aggregated neighborhood issues,
- follow public/non-sensitive issue trends,
- and support residents who have accessibility or connectivity constraints.

They must not receive access to private complainant identity unless explicitly authorized.

## 3.3 Civic Reviewers / Triage Officers

Reviewers use the system to:

- inspect incoming complaints,
- review AI-extracted information,
- review confidence scores,
- confirm or change category,
- confirm or change priority,
- confirm or change department,
- review duplicate clusters,
- request clarification,
- assign complaints,
- coordinate multiple departments,
- and provide reasons for overrides.

## 3.4 Department Officers

Department officers use the system to:

- view assigned work,
- filter by priority, ward, age, and SLA risk,
- acknowledge complaints,
- update status,
- add notes,
- upload resolution evidence,
- request cross-department support,
- and mark work as resolved.

## 3.5 Supervisors / Administrators

Supervisors use the system to:

- view SLA risks,
- manage escalations,
- inspect bottlenecks,
- inspect department workload,
- review recurring hotspots,
- review human override patterns,
- manage routing/service rules,
- manage jurisdiction mappings,
- review fairness metrics,
- and inspect audit trails.

## 3.6 Evaluators / Hackathon Judges

A demonstration mode should allow evaluators to:

- submit a complaint,
- inject incomplete information,
- submit in at least two languages,
- create duplicates,
- simulate an SLA breach,
- observe human override,
- observe escalation,
- inspect audit logs,
- inspect privacy controls,
- and view evaluation metrics.

---

# 4. Core Product Principles

## 4.1 Human-in-the-Loop

The system recommends; humans remain accountable.

AI must not silently:

- reject a civic complaint,
- deny eligibility,
- make enforcement decisions,
- make emergency decisions,
- expose complainants,
- or permanently suppress ambiguous reports.

Low-confidence decisions must be surfaced for human review.

## 4.2 Explainability

Any AI-supported recommendation should show:

- what was detected,
- confidence,
- major factors,
- applicable routing/service rules,
- and why the recommendation was produced.

## 4.3 Privacy by Default

Only information necessary for service delivery should be visible to operational teams.

Personal identity information should be separated from the operational complaint wherever practical.

## 4.4 Low-Bandwidth Accessibility

The resident experience must remain usable under poor connectivity.

The system should support a lightweight interface, local draft persistence, compressed evidence, retry behavior, and an SMS-style simulation.

## 4.5 Accountable Handoff

The platform must measure whether reports reach the correct service faster and with fewer routing errors.

---

# 5. Application Surfaces

The project contains multiple user-facing surfaces backed by a common API and data model.

## 5.1 Resident Full Web Application

A modern resident-facing interface supporting:

- complaint creation,
- multilingual text,
- location selection,
- optional maps,
- image/audio evidence,
- complaint history,
- status timeline,
- correction/appeal,
- consent settings,
- and notifications.

## 5.2 Resident Lite Mode

A low-bandwidth version available through a route such as:

`/lite`

Lite Mode should:

- minimize JavaScript,
- avoid heavy maps,
- avoid large images,
- avoid analytics libraries,
- use text-first screens,
- use compressed assets,
- work on slow mobile networks,
- save drafts locally,
- queue failed submissions,
- retry when connectivity returns,
- allow textual location input,
- optionally use device location,
- and allow evidence upload later.

Recommended complaint flow:

**Issue → Location → Urgency → Optional Evidence → Submit**

Lite Mode must use the same backend APIs and produce the same complaint records as the full application.

## 5.3 SMS Simulator

A text-only demonstration interface that simulates low-connectivity SMS intake.

Example:

`REPORT pothole near ABC School`

Possible response:

`Complaint C-1042 created. Location detected: ABC School, Ward 5. Reply 1 to confirm or 2 to correct.`

The simulator should support:

- report creation,
- location confirmation,
- clarification,
- status lookup,
- and basic multilingual text.

Real telecom integration is optional for the hackathon.

## 5.4 Voice Intake

Voice intake may be implemented through browser recording or uploaded audio.

Pipeline:

**Voice → Speech-to-Text → Language Detection → Complaint Processing**

The system should preserve:

- original audio as optional evidence,
- transcription,
- transcription confidence where available,
- and provenance.

Noisy transcription should be included in evaluation/hard-mode testing.

## 5.5 Reviewer / Operations Dashboard

The internal operations application should provide:

- queue management,
- filters,
- complaint detail view,
- routing recommendation,
- confidence indicators,
- duplicate clusters,
- map,
- SLA risk,
- workload,
- bottlenecks,
- escalation,
- cross-department tasks,
- override controls,
- audit trail,
- and resolution workflow.

## 5.6 Supervisor Analytics Dashboard

The supervisor view should include:

- total open complaints,
- complaints by department,
- complaints by ward/neighborhood,
- median response time,
- median resolution time,
- SLA compliance,
- SLA breach risk,
- recurring issue hotspots,
- duplicate cluster volume,
- override rate,
- route accuracy,
- category accuracy,
- multilingual performance,
- fairness indicators,
- and complaint-resolution trends.

---

# 6. Resident Complaint Intake

## 6.1 Core Fields

A complaint may contain:

- title,
- description,
- preferred language,
- location text,
- coordinates,
- ward if known,
- category if selected by user,
- optional image,
- optional audio,
- optional video if supported,
- urgency indication,
- accessibility needs,
- consent choices,
- reporter contact information,
- and preferred notification channel.

The user is not required to know the correct category or department.

## 6.2 Incomplete Information

The system must accept incomplete complaints.

If information is missing, the system may ask targeted clarification such as:

- exact/approximate location,
- whether there is immediate danger,
- whether the issue is still active,
- or which visible symptom best matches the problem.

Clarification must not block urgent escalation.

For example, if a complaint contains a strong safety signal such as fire, exposed electrical infrastructure, major flooding, collapsed infrastructure, or another configured emergency trigger, the system should surface it to a human immediately while clarification continues.

## 6.3 Multilingual and Code-Switched Complaints

The system should support at least two languages in the MVP.

Recommended hackathon target:

- English,
- Hindi,
- and optionally Marathi.

It should also be tested on mixed/code-switched input.

Example:

`पानी का पाइप फट गया है near City Mall and road is flooding.`

The internal representation may be normalized into a common language, but:

- original text must be preserved,
- translated/normalized text must be marked as generated,
- and the resident-facing output should be shown in the resident's selected/preferred language when possible.

---

# 7. Complaint Processing Pipeline

High-level flow:

**Intake → Privacy Preprocessing → Language Processing → Extraction → Safety/Urgency Detection → Duplicate Detection → Routing → SLA Planning → Human Review**

## 7.1 Language Detection

Detect:

- primary language,
- code switching,
- and low-confidence language detection.

## 7.2 Translation / Normalization

When necessary:

- translate to the system working language,
- normalize obvious formatting variation,
- preserve original text,
- and store translation provenance.

## 7.3 Entity Extraction

Extract structured fields such as:

- issue category,
- affected service,
- location,
- landmark,
- urgency,
- safety indicators,
- dates/time references,
- infrastructure type,
- and optional accessibility impact.

Example:

```json
{
  "category": "water_pipeline_leak",
  "affected_services": ["water_supply", "roads"],
  "location_text": "City Mall",
  "urgency": "high",
  "language": "hi-en",
  "confidence": 0.89
}
```

## 7.4 Confidence

Confidence must be shown to reviewers.

Confidence should not be used as a hidden rejection mechanism.

Example states:

- High confidence — recommended route may enter normal review queue.
- Medium confidence — reviewer attention suggested.
- Low confidence — human review required.

---

# 8. Priority and Urgency

Priority may be determined using a combination of:

- explicit danger indicators,
- issue category,
- scale of impact,
- vulnerable-location context,
- recurrence,
- number of duplicate reports,
- active incident status,
- and configured civic rules.

Suggested priority levels:

- Critical,
- High,
- Medium,
- Low.

The priority model must be explainable.

Example:

**Priority: Critical**

Reasons:

- electrical hazard detected,
- public road blocked,
- school nearby,
- active incident.

Priority recommendations may be changed by a human reviewer.

Human changes must include an override reason.

---

# 9. Duplicate Detection and Incident Clustering

Duplicate detection is a core feature.

The system should compare:

- text semantic similarity,
- normalized category,
- geographic distance,
- report time,
- landmarks,
- and optionally image similarity.

A duplicate is not deleted.

Each resident retains an individual complaint/reference number.

Operationally, multiple complaint records may be linked to one **Incident Cluster**.

Example:

**Incident Cluster #42**

- 12 resident reports
- 3 images
- radius: 120 m
- first report: 09:13
- latest report: 11:24
- same-incident confidence: 93%

This allows civic teams to work on one incident while preserving each resident's reporting history and status.

Duplicate detection must be evaluated with:

- precision,
- recall,
- and/or F1.

---

# 10. Civic Routing and Planning Engine

This is the core intelligence of the platform.

The routing engine must do more than:

`Pothole → Roads`

It must consider:

- category,
- affected services,
- geography,
- jurisdiction,
- department/service ownership,
- urgency,
- workload,
- team specialization,
- SLA,
- escalation path,
- and cross-department dependencies.

## 10.1 Routing Inputs

The engine may use:

- extracted category,
- coordinates/location,
- ward,
- municipality,
- service zone,
- road/infrastructure ownership,
- issue severity,
- department rules,
- team capacity,
- open queue size,
- active SLA load,
- and previously approved routing patterns.

## 10.2 Jurisdiction Resolution

Location should map to:

**Coordinates / Landmark → Ward → Municipality → Service Zone → Responsible Authority**

Example:

- pothole on a municipal road → municipal roads team,
- pothole on a highway → highway authority.

Jurisdiction rules should be versioned so rule changes can be audited.

## 10.3 Routing Score

A transparent scoring approach is preferred over an opaque fully automated model.

Illustrative formula:

```text
Route Score =
0.35 × issue/service match
+ 0.25 × jurisdiction match
+ 0.15 × proximity
+ 0.15 × capacity/workload fit
+ 0.10 × SLA feasibility
```

Exact weights may be tuned during evaluation.

## 10.4 Multiple Department Routing

A complaint may create multiple coordinated tasks.

Example:

`A tree has fallen onto an electrical line and blocked a road near a school.`

Possible plan:

- Primary: Electrical Emergency Team
- Secondary: Parks / Tree Removal
- Coordination: Roads Department
- Priority: Critical
- Escalation: Ward Control Room if unacknowledged within configured threshold

## 10.5 Dependency Planning

Complex incidents may produce dependent tasks.

Example:

**Parent Incident: Flooding caused by pipeline break**

1. Water Department — repair pipeline
2. Drainage Team — clear water
3. Roads Department — repair road after water repair

Dependencies:

`Water Repair → Drainage Clearance → Road Repair`

## 10.6 Workload Awareness

Team assignment can consider:

- active case count,
- high-priority workload,
- area coverage,
- specialization,
- travel/proximity,
- and SLA feasibility.

The system should recommend reassignment when workload makes SLA failure likely.

## 10.7 Uncertainty Fallback

If the system cannot confidently determine a route:

- do not reject,
- do not silently select a destination,
- flag human review,
- show top candidate routes,
- show confidence,
- and request clarification where useful.

Example:

```text
Route confidence: 42%

Candidates:
- Public Safety
- Electrical
- Roads / Infrastructure

Action: Human review required
```

---

# 11. Human Review and Override

A human reviewer must be able to change:

- category,
- urgency,
- priority,
- location,
- jurisdiction,
- route,
- assigned team,
- duplicate link,
- escalation path.

Every significant override should record:

- previous value,
- new value,
- reviewer,
- timestamp,
- reason,
- and optional note.

Suggested route override reasons:

- incorrect category,
- incorrect jurisdiction,
- multiple departments involved,
- workload/capacity,
- missing context,
- emergency handling,
- policy/service-rule exception,
- other.

Override data should become part of future system evaluation.

It may later be used to improve routing models, but retraining is not required for the MVP.

---

# 12. SLA Management

Each service/category should have configurable SLA rules.

Example:

- critical electrical hazard — configured emergency acknowledgement target,
- water leak — configurable high-priority target,
- pothole — configurable maintenance target,
- sanitation issue — configurable collection/removal target.

SLA values must come from the system's configured service directory and should not be hardcoded into AI prompts.

## 12.1 SLA Status

Each complaint/task may show:

- SLA start time,
- acknowledgement deadline,
- resolution deadline,
- remaining time,
- breach state,
- and escalation state.

## 12.2 SLA Risk Prediction

The system should predict risk before a breach where possible.

Possible features:

- category,
- department,
- current queue,
- active high-priority load,
- historical resolution duration,
- time already elapsed,
- ward,
- dependencies,
- and reassignment history.

Example:

```text
SLA: 48 hours
Predicted completion: 61 hours
Breach risk: 78%
Suggested action: reassign or escalate
```

A simple statistical/rule-based estimator is acceptable for the MVP if it is measurable and transparent.

## 12.3 Escalation

When an SLA threshold is crossed, the system should:

- update escalation state,
- notify the responsible officer,
- notify the supervisor,
- notify the resident in plain language,
- add an audit event,
- and show the issue on the SLA risk dashboard.

Example escalation chain:

`Officer → Team Lead → Department Supervisor → Municipal Control`

Exact chains must be configurable.

---

# 13. Resident Status Experience

Residents should receive a stable reference number.

Example:

`C-1042`

The resident status page should show:

- current status,
- responsible service/department,
- expected next step,
- expected update window,
- recent timeline,
- any clarification request,
- resolution evidence if appropriate,
- correction option,
- appeal/review option,
- and privacy/retention settings.

Statuses should be written in plain language.

Good:

`Your complaint has reached the Water Department. A field worker is expected to inspect the location within the current service window.`

Avoid internal labels such as:

`L2-Triage Pending`

unless accompanied by plain-language explanation.

---

# 14. Suggested Complaint Status Model

Suggested statuses:

- Draft
- Submitted
- Processing
- Clarification Needed
- Under Human Review
- Routed
- Assigned
- Acknowledged
- In Progress
- Waiting on Dependency
- Escalated
- Resolution Proposed
- Resolved
- Reopened
- Closed

Not every complaint needs every state.

---

# 15. Privacy Architecture

Privacy is a first-class subsystem.

## 15.1 PII Detection and Redaction

The system should detect unnecessary personal information such as:

- names,
- phone numbers,
- email addresses,
- exact private residential details,
- identity numbers if accidentally submitted,
- and third-party identifying information.

Processing flow:

**Original Complaint → PII Detector → Redaction Layer → Operational Complaint View**

Example:

Original:

`I'm Rahul Sharma, 98XXXXXXXX. My neighbor Rajesh in Flat 203 dumps garbage outside.`

Operational form:

`Resident reports repeated garbage dumping near [REDACTED PRIVATE LOCATION].`

## 15.2 Separate Identity and Operational Data

Recommended logical separation:

```text
Complaint
├── Operational Data
└── Restricted Reporter Identity
```

Operational staff should not automatically receive all identity information.

## 15.3 Role-Based Access

Suggested roles:

- Resident
- Community Assistant
- Reviewer
- Officer
- Supervisor
- Privacy/Admin

Each role should have explicit permissions.

## 15.4 Evidence Redaction

Where practical, uploaded media may undergo:

- face redaction,
- license-plate redaction,
- metadata stripping,
- and sensitive text redaction.

This can be implemented at a simplified level for the MVP.

---

# 16. Consent and Retention

Residents should be able to understand and control appropriate uses of their information.

Possible consent settings:

- share precise location with assigned department,
- allow anonymized use in neighborhood analytics,
- retain uploaded evidence after resolution,
- preferred notification channel.

The system should record:

- consent version,
- consent timestamp,
- retention policy applied,
- and deletion/expiration date where applicable.

Example:

```text
Complaint resolved: 22 May
Evidence retention until: 22 August
Identity access: authorized case workers only
```

Exact retention periods are implementation/configuration decisions.

---

# 17. Provenance

The system should record the origin and processing history of important data.

## 17.1 Evidence Provenance

For uploaded evidence:

```json
{
  "source": "resident_upload",
  "type": "image",
  "timestamp": "...",
  "location_consent": true,
  "processing": ["metadata_stripping", "face_redaction"]
}
```

## 17.2 AI Decision Provenance

For classification/routing:

- model/provider/version if applicable,
- routing engine version,
- service-rule version,
- confidence,
- extracted fields,
- timestamp,
- human override state.

Example:

```text
Routing Engine: v1.3
Service Rules: Municipality Rules v4
Category Confidence: 91%
Route Recommendation: Drainage
Human Override: No
```

---

# 18. Audit Trail

The audit system must preserve significant complaint events.

Example:

```text
10:02 Complaint submitted
10:03 PII redacted
10:03 Category predicted: Roads
10:04 Duplicate cluster #24 suggested
10:05 Reviewer changed route: Roads → Drainage
10:05 Override reason: flooding caused by blocked drain
10:07 Assigned to Drainage Team B
11:43 SLA warning generated
12:05 Supervisor escalation triggered
13:14 Field officer uploaded resolution evidence
13:20 Resident notified
```

Suggested audit event fields:

- event ID,
- complaint ID,
- incident ID,
- actor,
- actor role,
- action,
- old value,
- new value,
- reason,
- timestamp,
- source component,
- metadata.

The audit timeline should be visible to authorized staff.

---

# 19. Cross-Department Coordination

The system should support parent incidents and departmental sub-tasks.

A parent incident may contain:

- primary department,
- secondary departments,
- dependent tasks,
- shared status,
- task-level SLA,
- overall incident SLA,
- coordination notes.

Departments should be able to see dependencies without automatically receiving unnecessary resident PII.

---

# 20. Abuse and Malicious Submission Handling

The system should detect or flag:

- spam,
- repeated malicious submissions,
- threatening content,
- abusive language,
- irrelevant content,
- deliberate PII exposure,
- and suspicious automation.

Abusive language must not automatically invalidate a genuine civic issue.

Example:

- operational issue remains active,
- abusive language may be hidden/redacted from unnecessary views,
- threat/safety content may be escalated to authorized humans,
- complaint is not silently rejected.

---

# 21. Accessibility

The resident experience should support:

- keyboard navigation,
- screen reader-friendly labels,
- semantic HTML,
- high-contrast compatibility,
- readable font sizes,
- plain-language status,
- voice input,
- low-bandwidth mode,
- and minimal required fields.

Accessibility should be evaluated through task completion, not only visual inspection.

Suggested test:

Can a user successfully:

1. submit a complaint,
2. obtain a reference number,
3. find the current status,
4. correct a location,
5. understand the next step?

---

# 22. Low-Bandwidth and Offline Behavior

## 22.1 Lite Mode Requirements

Lite Mode should avoid:

- map libraries until explicitly requested,
- unnecessary fonts,
- large JS bundles,
- high-resolution images,
- autoplay media,
- heavy animation,
- and admin analytics assets.

## 22.2 Local Drafts

Complaint drafts should be stored locally using:

- IndexedDB preferred,
- localStorage acceptable for a simplified MVP.

## 22.3 Submission Retry

When submission fails due to connectivity:

- keep the complaint locally,
- mark it as pending sync,
- retry when network returns,
- prevent accidental duplicate submissions,
- and inform the user clearly.

## 22.4 Evidence Upload

On weak connectivity:

- complaint text should be submitted first,
- evidence may be compressed,
- evidence may upload after complaint creation,
- and the resident should still receive a complaint reference number where technically possible.

## 22.5 Image Optimization

Before upload:

- resize large images,
- compress them,
- show upload progress,
- and enforce reasonable size limits.

---

# 23. Operations Dashboard

The operations dashboard should include:

## 23.1 Queue

Columns/fields may include:

- complaint/incident ID,
- category,
- ward,
- priority,
- department,
- created time,
- current status,
- SLA remaining,
- SLA risk,
- duplicate count,
- confidence,
- assigned officer/team.

## 23.2 Filters

- department,
- ward,
- category,
- priority,
- status,
- date,
- SLA risk,
- language,
- route confidence,
- assignment state.

## 23.3 Complaint Detail

The detail view should display:

- original complaint,
- translated/normalized text,
- privacy-safe operational text,
- attachments,
- extracted entities,
- category recommendation,
- priority recommendation,
- routing recommendation,
- confidence,
- jurisdiction,
- service rules,
- duplicate candidates,
- related incident,
- SLA,
- activity timeline,
- reviewer actions,
- and resident-visible status.

---

# 24. Analytics

Analytics must be aggregated so individual reporters are not publicly exposed.

Suggested analytics:

- complaints per neighborhood,
- complaints per category,
- recurring hotspots,
- average acknowledgement time,
- average resolution time,
- SLA compliance rate,
- active SLA risk,
- department workload,
- queue age,
- duplicate cluster counts,
- top recurring infrastructure problems,
- route override rate,
- route accuracy,
- and language performance.

Maps should operate primarily at neighborhood/ward level for public or broad operational views.

Exact complainant locations should not become a public doxxing surface.

---

# 25. Fairness Evaluation

The system must evaluate whether performance differs across relevant groups.

Suggested comparisons:

- English vs Hindi vs Marathi,
- text vs voice vs SMS,
- neighborhood/ward,
- accessibility-assisted vs normal flow where test data permits.

Metrics may include:

- category accuracy,
- route accuracy,
- duplicate precision/recall,
- clarification rate,
- override rate,
- task completion rate,
- and average routing latency.

Example:

```text
English route accuracy: 92.1%
Hindi route accuracy: 90.8%
Voice route accuracy: 86.0%
```

If a channel or language performs materially worse, the dashboard should flag the gap for review.

The system must not use language, neighborhood, or accessibility requirements to intentionally lower service priority.

---

# 26. Evaluation Dataset

A synthetic or properly licensed evaluation dataset must be produced.

Recommended hackathon dataset size:

**300–500 synthetic complaints**

The dataset should include:

- English,
- Hindi,
- optionally Marathi,
- code switching,
- slang,
- typos,
- noisy transcripts,
- incomplete location,
- ambiguous complaint descriptions,
- duplicate complaints,
- duplicate images if available,
- urgent complaints,
- low-priority complaints,
- multi-department complaints,
- conflicting reports,
- and malicious/abusive submissions.

Each labeled evaluation item should contain relevant ground truth.

Example:

```json
{
  "complaint": "...",
  "expected_category": "drainage",
  "expected_route": "Drainage Department",
  "expected_priority": "high",
  "duplicate_cluster": 3
}
```

---

# 27. Quality Metrics

The system should report at least:

- category accuracy,
- routing accuracy,
- duplicate precision,
- duplicate recall,
- multilingual performance,
- human override rate,
- accessibility task success,
- SLA prediction quality,
- average triage time,
- average routing time,
- and complaint resolution/closure time in simulation.

Where a predictive SLA model is used, suitable metrics may include:

- precision/recall,
- F1,
- ROC-AUC,
- calibration,
- or MAE depending on prediction type.

---

# 28. Baseline Comparison

The project should compare AI-assisted handoff against a simple baseline.

Example baseline:

- manual reviewer reads complaint,
- manually selects category,
- manually determines department.

AI-assisted condition:

- system extracts issue,
- recommends category,
- identifies duplicates,
- recommends route,
- human confirms/changes.

Metrics should compare:

- time to route,
- incorrect route rate,
- reviewer actions,
- and potentially clarification frequency.

Claims such as "87% faster triage" must only be shown if produced by actual evaluation results.

---

# 29. Suggested Technical Architecture

A practical hackathon architecture:

```text
Resident Full Web ─┐
Resident Lite Web ─┼──── API / Backend ───── PostgreSQL
SMS Simulator ─────┤          │
Voice Intake ──────┘          │
                              ├── Complaint Processing
                              ├── Privacy / Redaction
                              ├── Classification / Extraction
                              ├── Duplicate Detection
                              ├── Routing Engine
                              ├── SLA Engine
                              ├── Notification Service
                              ├── Audit Service
                              └── Analytics / Evaluation
```

Suggested technologies:

### Frontend
- React / Next.js
- Tailwind CSS
- accessible component library
- Recharts or Chart.js for operations analytics

### Backend
- FastAPI (Python) or Node.js
- REST APIs
- WebSockets or polling for live status if needed

### Database
- PostgreSQL

### Vector / Duplicate Search
- pgvector or a lightweight embedding index

### Object Storage
- S3-compatible storage, Cloudinary, or equivalent

### Maps
- OpenStreetMap / Leaflet or Google Maps

### AI
- LLM for structured extraction, clarification, translation, and explanations
- sentence embeddings for duplicate detection
- optional conventional ML for SLA risk
- rule engine for safety, jurisdiction, and routing constraints

The core routing system should not rely solely on an LLM.

---

# 30. Service Directory and Rule Configuration

The system requires structured civic reference data.

Suggested entities:

## Department

- ID
- name
- service types
- service area
- escalation contacts
- active status

## Team

- ID
- department ID
- specialization
- coverage area
- current capacity
- active status

## Service Rule

- category
- responsible department
- jurisdiction
- priority rules
- SLA
- escalation path
- rule version
- effective dates

## Jurisdiction

- municipality
- ward
- zone
- geographic boundary
- authority/service ownership

This reference data should drive routing instead of hardcoding everything inside prompts.

---

# 31. Suggested Data Model

## User

- id
- role
- name
- contact
- preferred_language
- accessibility_preferences
- created_at

## ReporterIdentity

- id
- user_id
- protected contact fields
- access restrictions

## Complaint

- id
- reference_number
- reporter_identity_id
- original_text
- normalized_text
- language
- source_channel
- status
- category
- category_confidence
- priority
- priority_confidence
- location_text
- latitude
- longitude
- ward
- jurisdiction_id
- created_at
- updated_at

## ComplaintEvidence

- id
- complaint_id
- type
- storage_reference
- provenance
- redaction_state
- retention_until

## IncidentCluster

- id
- canonical_issue_type
- centroid/location
- created_at
- current_status
- duplicate_confidence

## IncidentComplaintLink

- incident_id
- complaint_id
- similarity_score

## RouteRecommendation

- id
- complaint/incident_id
- recommended_department
- recommended_team
- score
- confidence
- reasons
- routing_engine_version
- service_rule_version
- created_at

## Assignment

- id
- complaint/incident_id
- department_id
- team_id
- officer_id
- status
- assigned_at
- acknowledged_at

## TaskDependency

- parent_incident_id
- task_id
- depends_on_task_id
- dependency_type

## SLARecord

- id
- complaint/task_id
- policy_id
- started_at
- acknowledgement_due_at
- resolution_due_at
- risk_score
- breached_at
- escalation_level

## HumanOverride

- id
- complaint/incident_id
- field
- previous_value
- new_value
- reason_code
- note
- actor_id
- created_at

## ConsentRecord

- id
- reporter/complaint_id
- consent_type
- granted
- policy_version
- created_at

## AuditEvent

- id
- entity_type
- entity_id
- actor_id
- actor_role
- action
- old_value
- new_value
- reason
- source_component
- created_at

## Notification

- id
- complaint_id
- recipient
- channel
- template/type
- delivery_state
- created_at

---

# 32. Suggested API Surface

## Resident

`POST /api/complaints`
Create complaint.

`POST /api/complaints/{id}/evidence`
Upload evidence.

`GET /api/complaints/{reference}/status`
Get resident-safe status.

`POST /api/complaints/{id}/clarification`
Submit requested clarification.

`POST /api/complaints/{id}/correction`
Request or submit correction.

`POST /api/complaints/{id}/appeal`
Request human review/reopen where applicable.

`GET /api/complaints/{id}/consent`
Get consent settings.

`PATCH /api/complaints/{id}/consent`
Update permitted consent settings.

## Processing

`POST /api/internal/triage/{id}`
Run triage pipeline.

`POST /api/internal/deduplicate/{id}`
Find duplicate candidates.

`POST /api/internal/route/{id}`
Generate route recommendation.

`POST /api/internal/sla/{id}/predict`
Generate/update SLA risk.

## Operations

`GET /api/operations/queue`
List complaints/incidents.

`GET /api/operations/incidents/{id}`
Get full authorized detail.

`POST /api/operations/incidents/{id}/assign`
Assign team/officer.

`POST /api/operations/incidents/{id}/override`
Record human override.

`POST /api/operations/incidents/{id}/status`
Update status.

`POST /api/operations/incidents/{id}/escalate`
Escalate incident.

`POST /api/operations/incidents/{id}/resolve`
Record resolution.

## Analytics

`GET /api/analytics/overview`

`GET /api/analytics/neighborhoods`

`GET /api/analytics/sla`

`GET /api/analytics/fairness`

`GET /api/analytics/evaluation`

---

# 33. Notifications

Notifications may be simulated or implemented through:

- in-app,
- email,
- SMS simulation,
- or optional messaging integration.

Residents should be notified for important events such as:

- complaint created,
- clarification requested,
- department assigned,
- major status change,
- SLA breach/escalation,
- resolution proposed,
- complaint resolved,
- complaint reopened.

Messages should be plain-language and localized where possible.

---

# 34. AI Usage Boundaries

AI may assist with:

- language detection,
- translation,
- speech transcription integration,
- category extraction,
- entity extraction,
- urgency recommendation,
- clarification generation,
- duplicate similarity,
- route explanation,
- route recommendation support,
- SLA risk support,
- and plain-language resident status generation.

AI must not independently:

- deny a civic right/service,
- decide benefits eligibility,
- make legal/enforcement decisions,
- identify political affiliations,
- perform political profiling,
- retaliate against residents,
- expose reporters publicly,
- or silently reject uncertain cases.

---

# 35. Security Requirements

At minimum:

- authentication for staff surfaces,
- role-based access control,
- protected reporter identity fields,
- secure object/evidence URLs,
- audit logging,
- server-side authorization,
- input validation,
- rate limiting for public intake,
- abuse protection,
- secrets stored outside source code,
- and no raw sensitive data in client logs.

---

# 36. MVP Demonstration Scenario

The strongest end-to-end demonstration should cover most requirements in one flow.

Example:

1. A resident opens Lite Mode.
2. The resident submits a Hindi-English voice complaint.
3. The location is incomplete.
4. Speech is transcribed.
5. Language/code-switching is detected.
6. PII is detected and redacted from the operational view.
7. Urgency is detected.
8. The issue is recognized as a likely duplicate of an existing incident.
9. The complaint is linked to an incident cluster without removing the resident's reference number.
10. Jurisdiction is resolved.
11. The routing engine recommends one primary and one supporting department.
12. The reviewer sees confidence and reasoning.
13. The reviewer changes one route and selects an override reason.
14. Assignment occurs.
15. The system simulates high SLA risk or a breach.
16. Escalation is triggered.
17. The resident receives a plain-language update.
18. A field officer records resolution.
19. The audit trail shows every significant action.
20. The analytics dashboard updates using aggregated neighborhood data.
21. The evaluation view shows routing, duplicate, multilingual, and fairness metrics.

This single scenario should demonstrate the complete product story.

---

# 37. Minimum Viable Feature Set

The MVP must implement these features well:

1. Multilingual complaint submission.
2. Full Web and Lite resident intake.
3. SMS-style simulation.
4. Optional voice/audio intake.
5. Category/entity extraction with confidence.
6. Privacy redaction.
7. Duplicate detection and clustering.
8. Multi-factor routing.
9. Jurisdiction-aware routing.
10. Human review and reasoned override.
11. Multi-department routing for at least one scenario.
12. SLA tracking.
13. SLA breach or risk simulation.
14. Escalation.
15. Resident status timeline.
16. Correction/appeal path.
17. Operations dashboard.
18. Aggregated neighborhood analytics.
19. Audit trail.
20. Synthetic evaluation set.
21. Metrics dashboard.

---

# 38. Stretch / Hard-Mode Features

These may be implemented after the MVP:

- image similarity for duplicate detection,
- image-based issue recognition,
- noisy voice robustness,
- changing jurisdiction rules,
- versioned civic policy simulation,
- offline evidence synchronization,
- advanced SLA prediction model,
- malicious submission scoring,
- dynamic team capacity,
- recurrence forecasting,
- recurring emergency detection,
- advanced accessibility testing,
- automated retraining from reviewer overrides,
- and richer cross-department workflow orchestration.

---

# 39. Non-Goals

For the hackathon version, the following are not required unless the team explicitly chooses them:

- real emergency dispatch,
- real law-enforcement automation,
- real government eligibility decisions,
- real Aadhaar integration,
- production-grade telecom/SMS carrier integration,
- fully autonomous resolution,
- permanent resident surveillance,
- public display of exact complainant locations,
- or production-scale municipal integrations.

---

# 40. Success Criteria

The project should be considered successful when it can demonstrate that:

- residents can report an issue with minimal friction,
- multilingual input is handled reliably,
- incomplete information does not prevent urgent review,
- unnecessary personal information is protected,
- duplicates are clustered accurately,
- routes are more context-aware than category-only classification,
- routing decisions are explainable,
- humans can correct recommendations,
- overrides are auditable,
- SLA risk and breaches are visible,
- residents receive understandable updates,
- cross-department work can be coordinated,
- neighborhood trends are visible without exposing reporters,
- system performance is measured,
- and AI-assisted routing improves accountable handoff against a defined baseline.

---

# 41. Recommended Team Workstreams

A practical team split:

## Frontend / Resident Experience
- full intake,
- Lite Mode,
- status page,
- consent,
- accessibility.

## Operations Frontend
- reviewer queue,
- complaint detail,
- routing controls,
- SLA dashboard,
- map,
- analytics.

## Backend / Platform
- APIs,
- database,
- auth,
- audit,
- notification flow,
- service directory.

## AI / Triage
- language,
- extraction,
- urgency,
- duplicate embeddings,
- clarification.

## Routing / Planning
- jurisdiction,
- routing scores,
- workload,
- cross-department plans,
- SLA risk.

## Evaluation / Safety
- synthetic dataset,
- evaluation harness,
- privacy checks,
- fairness metrics,
- impact report/model card.

Team members may combine workstreams depending on team size.

---

# 42. Open Decisions

The following implementation choices have not yet been firmly decided and should be finalized by the team:

1. **Exact technology stack**
   - Current recommendation: Next.js/React + FastAPI + PostgreSQL/pgvector.

2. **Supported MVP languages**
   - At least two are required.
   - Current likely set: English + Hindi, with Marathi as a strong third language if time permits.

3. **Authentication**
   - Resident OTP/email/social login vs anonymous complaint + reference number.
   - Staff authentication must be protected.

4. **Map provider**
   - OpenStreetMap/Leaflet vs Google Maps.

5. **AI provider/model**
   - Must support reliable structured outputs and multilingual processing.
   - Core rules must remain outside the LLM.

6. **Notification integration**
   - In-app only vs email vs actual SMS provider.
   - SMS simulation is sufficient for the MVP requirement.

7. **Exact municipality/service directory**
   - A synthetic municipality and synthetic department map may be used for the demo unless a real licensed service directory is selected.

8. **Exact SLA values**
   - Should come from the chosen synthetic/real service directory and not be invented by the AI at runtime.

9. **Evidence image redaction scope**
   - Text-only PII redaction is MVP-critical.
   - Face/plate redaction may be stretch depending on time.

10. **Offline depth**
    - Minimum: draft persistence + retry.
    - Stretch: full service-worker/PWA background synchronization.

---

# 43. Recommended Product Name

Working name:

**Community Redressal Planner**

Optional user-facing alternatives can be selected later without changing the system architecture.

---

# 44. Final Product Summary

The Community Redressal Planner is an AI-assisted civic operations platform that converts messy, multilingual resident reports into structured, privacy-aware and accountable service workflows.

Its core differentiator is the **Civic Routing Engine**, which combines issue understanding with geography, jurisdiction, service responsibility, workload, SLA constraints, escalation rules, and cross-department dependencies. The routing engine never becomes an automated denial mechanism: uncertain cases are sent for human review, reviewers can override recommendations, and every important decision is explainable and auditable.

On the resident side, the platform prioritizes accessibility and trust through multilingual intake, Lite Mode, voice/SMS simulation, clear status, correction and appeal, consent controls, and privacy protection.

On the operations side, it provides deduplication, routing, workload-aware assignment, SLA-risk monitoring, escalation, cross-department coordination, audit history, and aggregated analytics.

The project is evaluated not simply on whether AI can classify complaints, but on whether the full system improves **correct routing, accountable handoff, response visibility, fairness, accessibility, privacy, and measurable service outcomes**.
