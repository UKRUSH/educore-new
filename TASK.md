# EduCore — Complete Frontend Guide
> **Project:** Education Platform for University Students
> **Stack:** Next.js (App Router) · Tailwind CSS · Prisma · MySQL
> **Theme:** Blue · **Slogan:** Student Support System
> **Members:** 4 (one component each)

---

## 📁 Full Folder Structure

```
educore/
├── app/
│   ├── layout.tsx                        # Root layout (very light)
│   ├── globals.css                       # Global styles + CSS variables
│   ├── loading.tsx                       # Global loading fallback
│   ├── error.tsx                         # Global error page
│   ├── not-found.tsx                     # 404 page
│   │
│   ├── (public)/                         # Public pages (no login needed)
│   │   ├── page.tsx                      # Landing page
│   │   └── about/page.tsx
│   │
│   ├── (auth)/                           # Auth pages
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── (app)/                            # Protected dashboard pages
│   │   ├── layout.tsx                    # Sidebar + Topbar layout
│   │   ├── dashboard/page.tsx
│   │   │
│   │   ├── profile/                      # Component 1
│   │   │   ├── page.tsx
│   │   │   ├── setup/page.tsx
│   │   │   ├── academics/page.tsx
│   │   │   ├── clubs/page.tsx
│   │   │   ├── sports/page.tsx
│   │   │   └── progress/page.tsx
│   │   │
│   │   ├── materials/                    # Component 2
│   │   │   ├── page.tsx
│   │   │   ├── upload/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── bookmarks/page.tsx
│   │   │
│   │   ├── clubs/                        # Component 3
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── [id]/apply/page.tsx
│   │   │   └── applications/page.tsx
│   │   │
│   │   └── support/                      # Component 4
│   │       ├── mentors/page.tsx
│   │       ├── mentors/register/page.tsx
│   │       ├── sessions/page.tsx
│   │       ├── sessions/[id]/page.tsx
│   │       ├── sessions/[id]/apply/page.tsx
│   │       ├── community/page.tsx
│   │       └── mentor-dashboard/page.tsx
│   │
│   ├── admin/                            # Admin panel
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── clubs/page.tsx
│   │   ├── club-applications/page.tsx
│   │   └── mentors/page.tsx
│   │
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   └── logout/route.ts
│       ├── profile/
│       │   ├── me/route.ts
│       │   ├── semesters/route.ts
│       │   ├── semesters/[id]/route.ts
│       │   ├── subjects/route.ts
│       │   ├── clubs/route.ts
│       │   ├── sports/route.ts
│       │   └── suggestions/route.ts
│       ├── materials/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   ├── [id]/summarize/route.ts
│       │   ├── [id]/suggest/route.ts
│       │   └── bookmarks/route.ts
│       ├── clubs/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   ├── [id]/apply/route.ts
│       │   └── applications/route.ts
│       └── support/
│           ├── mentors/route.ts
│           ├── mentors/register/route.ts
│           ├── sessions/route.ts
│           ├── sessions/[id]/route.ts
│           ├── sessions/[id]/apply/route.ts
│           ├── notifications/route.ts
│           └── chat/route.ts
│
├── components/
│   ├── ui/                               # Global reusable UI
│   ├── layout/                           # Sidebar, Navbar
│   ├── profile/                          # Component 1 UI pieces
│   ├── materials/                        # Component 2 UI pieces
│   ├── clubs/                            # Component 3 UI pieces
│   └── support/                          # Component 4 UI pieces
│
├── features/
│   ├── profile/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── materials/
│   ├── clubs/
│   └── support/
│
├── lib/
│   ├── db/prisma.ts
│   ├── auth/session.ts
│   └── utils/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── middleware.ts
├── .env
└── README.md
```

---

---

# 🔐 AUTH PAGES
> Shared — All members benefit from these

---

## Page: `/login`
**File:** `app/(auth)/login/page.tsx`

**Purpose:** Student logs into the system

**UI Elements:**
- EduCore logo + tagline
- Email input field
- Password input field (with show/hide toggle)
- "Remember me" checkbox
- Login button (blue, full width)
- "Forgot password?" link
- "Don't have an account? Register" link
- Error message display (wrong credentials)

**CRUD:** `POST /api/auth/login`

**Fields:**
| Field | Type | Validation |
|---|---|---|
| email | text | required, valid email |
| password | text | required, min 6 chars |

**After Login:** Redirect to `/dashboard`

---

## Page: `/register`
**File:** `app/(auth)/register/page.tsx`

**Purpose:** New student creates an account

**UI Elements:**
- Full Name input
- University Email input
- Student ID input
- Password input
- Confirm Password input
- Faculty dropdown (select)
- Degree Program input
- Intake Year input (e.g. 2022)
- Register button
- "Already have an account? Login" link
- Success message / error message

**CRUD:** `POST /api/auth/register`

**Fields:**
| Field | Type | Validation |
|---|---|---|
| fullName | text | required |
| email | text | required, university email |
| studentId | text | required, unique |
| password | text | required, min 8 chars |
| confirmPassword | text | must match password |
| faculty | select | required |
| degree | text | required |
| intakeYear | number | required, 4 digits |

**After Register:** Redirect to `/profile/setup`

---

## Page: `/forgot-password`
**File:** `app/(auth)/forgot-password/page.tsx`

**Purpose:** Reset password via email

**UI Elements:**
- Email input
- "Send Reset Link" button
- Success message
- Back to Login link

---

---

# 📊 DASHBOARD
> Shared overview — visible to all logged-in students

---

## Page: `/dashboard`
**File:** `app/(app)/dashboard/page.tsx`

**Purpose:** Main overview after login

**UI Elements:**
- Welcome card (student name + profile photo + score badge)
- Quick stats row:
  - Current GPA
  - Clubs joined count
  - Sports achievements count
  - Sessions attended count
- Upcoming support sessions widget (next 3 sessions)
- Recent uploaded materials widget (last 3)
- Active club applications status
- Notification feed (right sidebar or bottom)
- Quick action buttons:
  - Upload Material
  - Browse Sessions
  - Browse Clubs

**CRUD:** `GET /api/profile/me`, `GET /api/support/sessions`, `GET /api/materials`

---

---

# 👤 COMPONENT 1 — Login, Profile & 4-Year Progress Tracking
**Member:** 1
**Owner folder:** `features/profile/` · `components/profile/` · `app/(app)/profile/`

---

## Page: `/profile/setup`
**File:** `app/(app)/profile/setup/page.tsx`

**Purpose:** First-time profile setup wizard (multi-step)

**Steps:**

### Step 1 — Personal Details
- Full Name (pre-filled from register)
- Date of Birth
- Phone Number
- Profile Photo upload
- Gender (optional)

### Step 2 — Academic Info
- Faculty (dropdown)
- Degree Program
- Intake Year
- Expected Graduation Year
- Student Index Number

### Step 3 — Interests
- Sports interested in (multi-select chips)
- Society/Club interests (multi-select chips)
- Learning style preference (optional)

**UI Elements:**
- Step progress bar (Step 1 of 3)
- Back / Next / Finish buttons
- Preview card (live profile preview on right side)

**CRUD:** `POST /api/profile/me`

---

## Page: `/profile`
**File:** `app/(app)/profile/page.tsx`

**Purpose:** Student's full profile dashboard

**UI Elements:**
- Profile header card:
  - Profile photo
  - Name, Student ID, Faculty, Degree
  - Intake Year — Graduation Year
  - Overall Progress Score (Academic + Sports + Society combined)
  - Score breakdown badges (Academic / Sports / Society)
- Navigation tabs:
  - Overview | Academics | Clubs | Sports | Progress
- Overview tab content:
  - Current semester GPA
  - Latest semester subjects summary
  - Recently joined clubs
  - Recent sports achievements
  - Top 3 improvement suggestions panel
- Edit Profile button

**CRUD:** `GET /api/profile/me`, `PUT /api/profile/me`

---

## Page: `/profile/academics`
**File:** `app/(app)/profile/academics/page.tsx`

**Purpose:** Manage semester-by-semester academic records

**UI Elements:**

### Semester List Section
- List of all semesters (cards)
  - Semester number
  - GPA
  - Number of subjects
  - Expand / collapse subject list
- "Add Semester" button

### Add Semester Form (Modal or Inline)
- Semester Number (dropdown: Semester 1, 2, 3...)
- Academic Year (e.g. 2022/2023)
- GPA input (calculated or manual)
- "Save Semester" button

### Subject Records (inside each semester card)
- Subject Code
- Subject Name
- Credits
- Marks (%)
- Grade (A, B, C... auto-calculated from marks)
- "Add Subject" button per semester
- Edit / Delete per subject row

### GPA Trend Mini Chart
- Line chart showing GPA across all semesters

**CRUD:**
- `GET /api/profile/semesters` — list all semesters
- `POST /api/profile/semesters` — add semester
- `PUT /api/profile/semesters/[id]` — edit semester
- `DELETE /api/profile/semesters/[id]` — delete semester
- `POST /api/profile/subjects` — add subject to semester
- `PUT /api/profile/subjects/[id]` — edit subject
- `DELETE /api/profile/subjects/[id]` — delete subject

**DB Tables Used:** `Semester`, `SubjectResult`

---

## Page: `/profile/clubs`
**File:** `app/(app)/profile/clubs/page.tsx`

**Purpose:** Show clubs/societies the student has joined

**UI Elements:**
- Joined clubs list (cards):
  - Club name + logo
  - Role in club (member, secretary, president)
  - Joined date
  - Participation points
  - Active / Inactive badge
- "Add Club" button (manual entry if not via Component 3)
- Edit / Remove per entry
- Total society score displayed at top

**CRUD:**
- `GET /api/profile/clubs`
- `POST /api/profile/clubs`
- `PUT /api/profile/clubs/[id]`
- `DELETE /api/profile/clubs/[id]`

**DB Table:** `StudentClub`

---

## Page: `/profile/sports`
**File:** `app/(app)/profile/sports/page.tsx`

**Purpose:** Record and display sports achievements

**UI Elements:**
- Sports achievements list (cards):
  - Sport name
  - Achievement type (Trophy / Certificate / Medal)
  - Position/Place (1st, 2nd, 3rd...)
  - Date
  - Points awarded
  - Certificate/Trophy image (if uploaded)
- "Add Achievement" button
- Upload certificate / trophy image
- Edit / Delete per achievement
- Total sports score displayed at top

**CRUD:**
- `GET /api/profile/sports`
- `POST /api/profile/sports`
- `PUT /api/profile/sports/[id]`
- `DELETE /api/profile/sports/[id]`

**DB Table:** `SportAchievement`, `FileAsset`

---

## Page: `/profile/progress`
**File:** `app/(app)/profile/progress/page.tsx`

**Purpose:** Visual 4-year progress dashboard with suggestions

**UI Elements:**

### Progress Overview
- Overall Progress Score (big circular progress ring)
- Score breakdown:
  - Academic score
  - Sports score
  - Society score

### 4-Year Timeline Chart
- Line chart: GPA per semester (all 8 semesters)
- Bar chart: Sports points earned each year
- Bar chart: Society participation per year

### Weak Area Detection Panel
- Top 3 lowest-performing subjects (highlighted in red/orange)
- Per weakness: subject name, marks, suggestion text

### Improvement Suggestions
- Card list of suggestions:
  - "Your GPA dropped in Semester 3. Focus on [subject]."
  - "Upload your lecture notes to use the summarizer (Component 2)."
  - "Join a mentor session for [subject] (Component 4)."
  - "Your sports score is low. Try joining a sports club."

**CRUD:** `GET /api/profile/suggestions`

**DB Tables:** `Semester`, `SubjectResult`, `SportAchievement`, `StudentClub`

---

### Component 1 — UI Components (`components/profile/`)

| Component | File | Purpose |
|---|---|---|
| SemesterCard | `SemesterCard.tsx` | Shows one semester + subjects inside |
| SubjectTable | `SubjectTable.tsx` | Table of subjects with marks and grade |
| GpaLineChart | `GpaLineChart.tsx` | Line chart of GPA over semesters |
| ProgressRing | `ProgressRing.tsx` | Circular score ring |
| AchievementCard | `AchievementCard.tsx` | One sports achievement card |
| ClubBadge | `ClubBadge.tsx` | Joined club chip/badge |
| SuggestionCard | `SuggestionCard.tsx` | One improvement suggestion card |
| ProfileScoreBar | `ProfileScoreBar.tsx` | Academic/Sports/Society score bars |
| SetupStepper | `SetupStepper.tsx` | Multi-step progress indicator |

---

---

# 📚 COMPONENT 2 — Study Material Support
**Member:** 2
**Owner folder:** `features/materials/` · `components/materials/` · `app/(app)/materials/`

---

## Page: `/materials`
**File:** `app/(app)/materials/page.tsx`

**Purpose:** List all uploaded study materials

**UI Elements:**
- Page header: "My Study Materials"
- "Upload New Material" button (top right)
- Search bar (search by title or course code)
- Filter: All / PDF / Slides / Summarized / Not Summarized
- Materials grid (cards):
  - File icon (PDF / PPT)
  - Title
  - Course code
  - Upload date
  - "Summarized" badge if already processed
  - View / Delete buttons
- Empty state (if no materials uploaded yet)
- Pagination

**CRUD:** `GET /api/materials`, `DELETE /api/materials/[id]`

**DB Table:** `StudyMaterial`

---

## Page: `/materials/upload`
**File:** `app/(app)/materials/upload/page.tsx`

**Purpose:** Upload a PDF or lecture slide

**UI Elements:**
- Page title: "Upload Study Material"
- Drag-and-drop upload zone (accepts PDF, PPT, PPTX)
- OR "Browse File" button
- File preview (filename + size)
- Form fields:
  - Title (text input)
  - Course Code (text input, e.g. CS2020)
  - Material Type (dropdown: PDF / Lecture Slides / Notes)
  - Description (optional textarea)
- "Upload & Summarize" button
- Upload progress bar
- Success message → redirect to `/materials/[id]`
- Error message if file too large or wrong type

**CRUD:** `POST /api/materials`

**DB Table:** `StudyMaterial`, `FileAsset`

---

## Page: `/materials/[id]`
**File:** `app/(app)/materials/[id]/page.tsx`

**Purpose:** View a material's summary and suggested resources

**UI Elements:**

### Material Header
- File title + course code
- Upload date
- File type badge
- "Download Original" button

### Summary Section (tabs)

**Tab 1: Quick Summary**
- 3–5 sentence summary paragraph
- "Copy Summary" button

**Tab 2: Detailed Notes**
- Longer structured notes (bullet points or paragraphs)
- Sections/headings if detected

**Tab 3: Key Terms**
- Chip list of important keywords/terms
- Click a term → search suggestions filter by it

**Tab 4: Q&A (optional)**
- Auto-generated questions and answers from material

### "Summarize Now" button (if not yet summarized)
- Loading spinner while processing

### Suggested Resources Section
- Section title: "Related Learning Resources"
- Filter tabs: All / Articles / YouTube / Links
- Resource cards:
  - Icon (article/youtube/link)
  - Title
  - Source name
  - URL (opens in new tab)
  - "Bookmark" button (heart icon)
  - "Helpful / Not Helpful" thumbs buttons
- "Load More" button

**CRUD:**
- `GET /api/materials/[id]`
- `POST /api/materials/[id]/summarize`
- `GET /api/materials/[id]/suggest`
- `POST /api/materials/bookmarks` (bookmark a resource)
- `POST` rating (helpful/not helpful)

**DB Tables:** `StudyMaterial`, `MaterialSummary`, `SuggestedResource`, `Bookmark`

---

## Page: `/materials/bookmarks`
**File:** `app/(app)/materials/bookmarks/page.tsx`

**Purpose:** View all saved/bookmarked resources

**UI Elements:**
- Page title: "My Bookmarks"
- Bookmarks list (resource cards):
  - Title, source, type icon
  - Link to open
  - "Remove Bookmark" button
- Filter: All / Articles / YouTube / Links
- Empty state message if no bookmarks

**CRUD:**
- `GET /api/materials/bookmarks`
- `DELETE /api/materials/bookmarks/[id]`

**DB Table:** `Bookmark`

---

### Component 2 — UI Components (`components/materials/`)

| Component | File | Purpose |
|---|---|---|
| MaterialCard | `MaterialCard.tsx` | One material card in list |
| UploadDropzone | `UploadDropzone.tsx` | Drag-and-drop upload area |
| SummaryPanel | `SummaryPanel.tsx` | Shows summary content with tabs |
| KeyTermChip | `KeyTermChip.tsx` | Single keyword chip |
| ResourceCard | `ResourceCard.tsx` | One suggested resource card |
| BookmarkButton | `BookmarkButton.tsx` | Heart/bookmark toggle button |
| RatingButtons | `RatingButtons.tsx` | Helpful / Not Helpful buttons |
| UploadProgress | `UploadProgress.tsx` | File upload progress bar |

---

---

# 🏆 COMPONENT 3 — Sports & Society Application System
**Member:** 3
**Owner folder:** `features/clubs/` · `components/clubs/` · `app/(app)/clubs/`

---

## Page: `/clubs`
**File:** `app/(app)/clubs/page.tsx`

**Purpose:** Browse all university clubs and societies

**UI Elements:**
- Page title: "Clubs & Societies"
- Search bar (search by club name)
- Filter bar:
  - Category (Sports / Academic / Cultural / Religious / Other)
  - Status (Open / Full / Closed)
- Clubs grid (cards):
  - Club logo/image
  - Club name
  - Category badge
  - Short description
  - Seats available (e.g. "12 / 30 seats filled")
  - Seats progress bar (visual fill)
  - Status badge: Open / Full / Closed
  - "View Details" button
- Total clubs count shown

**CRUD:** `GET /api/clubs`

**DB Table:** `Club`

---

## Page: `/clubs/[id]`
**File:** `app/(app)/clubs/[id]/page.tsx`

**Purpose:** Club detail page — full info before applying

**UI Elements:**
- Club banner image (top)
- Club name + category badge
- Description (full text)
- Requirements section:
  - List of requirements to join (e.g. GPA > 3.0, Year 1 or above)
- What to do after joining:
  - Responsibilities and activities
- Capacity section:
  - Total seats: 30
  - Filled: 12
  - Available: 18
  - Visual progress bar
- Status badge: Open / Full / Closed
- "Apply to Join" button (disabled if Full or already applied)
- Already applied status (shows "Application Pending" or "Approved")
- Club contact info (email, social)

**CRUD:** `GET /api/clubs/[id]`

---

## Page: `/clubs/[id]/apply`
**File:** `app/(app)/clubs/[id]/apply/page.tsx`

**Purpose:** Application form to join a specific club

**UI Elements:**
- Page title: "Apply for [Club Name]"
- Club name reminder card (top)
- Application form:
  - Full Name (pre-filled)
  - Student ID (pre-filled)
  - Faculty / Degree (pre-filled)
  - Current Year / Semester
  - GPA (pre-filled or manual)
  - Why do you want to join? (textarea, required)
  - What can you contribute? (textarea)
  - Previous experience (textarea, optional)
  - Available days (checkbox: Mon/Tue/Wed/Thu/Fri/Sat)
  - Any additional info (optional)
- "Submit Application" button
- Cancel button
- Confirmation modal before submit
- Success message → redirect to `/clubs/applications`

**CRUD:** `POST /api/clubs/[id]/apply`

**DB Table:** `ClubApplication`

---

## Page: `/clubs/applications`
**File:** `app/(app)/clubs/applications/page.tsx`

**Purpose:** Student views their own club application history and statuses

**UI Elements:**
- Page title: "My Applications"
- Application list (cards):
  - Club name + logo
  - Applied date
  - Status badge:
    - 🟡 Pending
    - ✅ Approved
    - ❌ Rejected
    - 🔵 Waitlisted
  - Feedback message (shown if status is Approved/Rejected)
  - "View Details" expand button
- Filter: All / Pending / Approved / Rejected
- Empty state if no applications

**CRUD:** `GET /api/clubs/applications` (student's own applications)

**DB Tables:** `ClubApplication`, `ApplicationFeedback`

---

## Admin Page: `/admin/clubs`
**File:** `app/admin/clubs/page.tsx`

**Purpose:** Admin manages all clubs

**UI Elements:**
- Page title: "Manage Clubs"
- "Add New Club" button
- Clubs table:
  - Club Name
  - Category
  - Total Capacity
  - Available Seats
  - Status toggle (Open / Closed)
  - Edit / Delete buttons
- Add/Edit Club Modal:
  - Club name
  - Category (dropdown)
  - Description
  - Total capacity (number)
  - Requirements (textarea)
  - Upload club logo/image
  - Status (Open / Closed)
  - Save button

**CRUD:**
- `GET /api/clubs` (admin — all clubs)
- `POST /api/clubs` (create)
- `PUT /api/clubs/[id]` (edit)
- `DELETE /api/clubs/[id]` (delete)

---

## Admin Page: `/admin/club-applications`
**File:** `app/admin/club-applications/page.tsx`

**Purpose:** Admin reviews, approves, rejects applications and sends feedback

**UI Elements:**
- Page title: "Club Applications"
- Filter bar:
  - Club name (dropdown)
  - Status (Pending / Approved / Rejected)
- Applications table:
  - Student name + ID
  - Club name
  - Applied date
  - Status badge
  - "View Answers" button (expand form responses)
  - Approve / Reject / Waitlist buttons
  - Send Feedback button (opens message modal)
- Feedback Modal:
  - Message textarea
  - Send button
- Bulk approve option (optional)
- Pagination

**CRUD:**
- `GET /api/clubs/applications` (all)
- `PUT /api/clubs/applications/[id]` (update status)
- `POST /api/clubs/applications/[id]/feedback` (send feedback)

**DB Tables:** `ClubApplication`, `ApplicationFeedback`

---

### Component 3 — UI Components (`components/clubs/`)

| Component | File | Purpose |
|---|---|---|
| ClubCard | `ClubCard.tsx` | Club card in directory grid |
| SeatsBar | `SeatsBar.tsx` | Visual seats available progress bar |
| StatusBadge | `StatusBadge.tsx` | Open / Full / Closed badge |
| ApplicationForm | `ApplicationForm.tsx` | Full club application form |
| ApplicationCard | `ApplicationCard.tsx` | Student's application status card |
| FeedbackBox | `FeedbackBox.tsx` | Shows feedback message from admin |
| AdminApplicationRow | `AdminApplicationRow.tsx` | Admin table row with action buttons |
| FeedbackModal | `FeedbackModal.tsx` | Modal to send feedback message |
| ClubFormModal | `ClubFormModal.tsx` | Add/Edit club modal |

---

---

# 🎓 COMPONENT 4 — Student Support System
**Member:** 4
**Owner folder:** `features/support/` · `components/support/` · `app/(app)/support/`

---

## Page: `/support/mentors`
**File:** `app/(app)/support/mentors/page.tsx`

**Purpose:** Browse all registered Dean List mentors

**UI Elements:**
- Page title: "Student Mentors"
- "Become a Mentor" button (top right — for Dean List students)
- Search bar (search by name or subject)
- Filter: Subject (dropdown), Faculty (dropdown)
- Mentors grid (cards):
  - Profile photo
  - Mentor name
  - Faculty / Degree
  - Subjects they support (chips)
  - Dean List badge ⭐
  - Rating (stars, from feedback)
  - Sessions conducted count
  - "View Sessions" button
- Empty state if no mentors found

**CRUD:** `GET /api/support/mentors`

**DB Table:** `MentorProfile`

---

## Page: `/support/mentors/register`
**File:** `app/(app)/support/mentors/register/page.tsx`

**Purpose:** Dean List student registers as a mentor

**UI Elements:**
- Page title: "Register as a Mentor"
- Info banner: "Only Dean List students can register as mentors."
- Registration form:
  - Full Name (pre-filled)
  - Student ID (pre-filled)
  - Faculty / Degree (pre-filled)
  - Current GPA (pre-filled or manual)
  - Dean List proof (upload certificate/screenshot)
  - Subjects I can teach (multi-select from list)
  - Short bio (textarea — why you want to mentor)
  - Preferred days (checkboxes)
  - Contact preference (email / chat)
- "Submit Registration" button
- Note: "Your registration will be reviewed before activation."
- Success message → redirect to `/support/mentors`

**CRUD:** `POST /api/support/mentors/register`

**DB Table:** `MentorProfile`

---

## Page: `/support/sessions`
**File:** `app/(app)/support/sessions/page.tsx`

**Purpose:** Browse all available mentor support sessions

**UI Elements:**
- Page title: "Support Sessions"
- Search bar (by subject or mentor name)
- Filter bar:
  - Subject (dropdown)
  - Date range
  - Status: Available / Full / Upcoming / Past
- Sessions list (cards):
  - Subject name + icon
  - Mentor name + photo
  - Date and time
  - Seats counter: "6 / 10 seats filled" (visual bar)
  - Status badge: Open / Full / Closed
  - "Apply" button (disabled if Full or already applied)
  - Already applied badge if student applied
- Empty state message
- Pagination

**CRUD:** `GET /api/support/sessions`

**DB Table:** `SupportSession`

---

## Page: `/support/sessions/[id]`
**File:** `app/(app)/support/sessions/[id]/page.tsx`

**Purpose:** View details of one support session

**UI Elements:**
- Session header:
  - Subject name (large)
  - Status badge
- Mentor info card:
  - Photo, name, faculty, GPA
  - Dean List badge
  - Rating
  - Subjects they teach
- Session details:
  - Date and time
  - Duration (e.g. 1 hour)
  - Platform (Microsoft Teams / Zoom / Google Meet)
  - Meeting link (shown only after acceptance)
  - Max students: 10
  - Currently applied: 6
  - Seats left: 4
  - Seats progress bar
- Session description / what will be covered
- "Apply to Join" button (if open + not yet applied)
- If already applied: "Application Pending" badge
- If accepted: "You are accepted! Join here →" button
- If rejected: "Not accepted this time" message

**CRUD:** `GET /api/support/sessions/[id]`

---

## Page: `/support/sessions/[id]/apply`
**File:** `app/(app)/support/sessions/[id]/apply/page.tsx`

**Purpose:** Student applies to join a session

**UI Elements:**
- Session reminder card (subject, mentor, date/time)
- Confirmation message: "You are applying to join this session."
- Form:
  - Reason for joining (textarea — why do you need help in this subject?)
  - Current marks in this subject (optional)
- "Confirm Application" button
- Cancel button
- Confirmation modal before submit
- Success message → redirect to `/support/sessions`

**CRUD:** `POST /api/support/sessions/[id]/apply`

**DB Table:** `SessionApplication`

---

## Page: `/support/community`
**File:** `app/(app)/support/community/page.tsx`

**Purpose:** Real-time student community chat and discussions

**UI Elements:**

### Left Panel — Rooms
- "General" community chat
- Subject-based rooms (e.g. #mathematics, #programming, #science)
- Active users count per room
- "+" Create new room button (optional)

### Main Panel — Chat Area
- Room title at top
- Messages area (scrollable):
  - Sender photo + name
  - Message text
  - Timestamp
  - Reply button
- Typing indicator ("John is typing...")
- Message input bar at bottom
- Send button
- Emoji button (optional)
- File/image attachment (optional)

### Right Panel — Members
- Online members list
- Profile photo + name
- Online status indicator (green dot)

**CRUD + WebSocket:**
- `GET /api/support/chat` (load history)
- WebSocket: emit / receive messages in real-time

**DB Tables:** `ChatRoom`, `ChatMessage`

---

## Page: `/support/mentor-dashboard`
**File:** `app/(app)/support/mentor-dashboard/page.tsx`

**Purpose:** Mentor manages their sessions and reviews applicants

**UI Elements:**

### Dashboard Header
- Mentor name + Dean List badge
- Total sessions created
- Total students helped
- Average rating

### My Sessions Section
- Sessions list:
  - Subject, date/time, seats (X/10)
  - Status badge
  - "View Applicants" button
  - Edit session button
  - Cancel/Delete session button
- "Create New Session" button

### Create Session Modal
- Subject (dropdown or text input)
- Date picker
- Time picker
- Duration (dropdown: 30min / 1hr / 1.5hr / 2hr)
- Platform (Teams / Zoom / Google Meet)
- Meeting link (URL input)
- Description (what will be covered)
- Max students (fixed at 10)
- "Create Session" button

### Applicants Panel (for each session)
- Session title reminder
- Applicants list (table):
  - Student name + ID
  - Faculty
  - Reason for joining (expandable)
  - Applied date
  - Status: Pending / Accepted / Rejected
  - Accept / Reject buttons (greyed out if 10 already accepted)
- Auto-email note: "Accepted students will receive the meeting link by email."
- Accepted count: 7/10 (shows remaining slots)

**CRUD:**
- `GET /api/support/sessions` (mentor's sessions)
- `POST /api/support/sessions` (create)
- `PUT /api/support/sessions/[id]` (edit)
- `DELETE /api/support/sessions/[id]` (cancel)
- `GET /api/support/sessions/[id]/applicants`
- `PUT /api/support/sessions/[id]/applicants/[applicationId]` (accept/reject)

**Triggers:**
- On Accept → send email to student with meeting link
- On Accept → emit WebSocket notification to student

**DB Tables:** `SupportSession`, `SessionApplication`, `Notification`

---

### Component 4 — UI Components (`components/support/`)

| Component | File | Purpose |
|---|---|---|
| MentorCard | `MentorCard.tsx` | One mentor card in browse list |
| SessionCard | `SessionCard.tsx` | One session card with seat counter |
| SeatCounter | `SeatCounter.tsx` | X/10 seats progress bar |
| MentorRegisterForm | `MentorRegisterForm.tsx` | Full mentor registration form |
| SessionCreateModal | `SessionCreateModal.tsx` | Create/Edit session popup |
| ApplicantRow | `ApplicantRow.tsx` | One applicant row with accept/reject |
| ChatMessage | `ChatMessage.tsx` | Single chat message bubble |
| ChatRoomList | `ChatRoomList.tsx` | Left panel room list |
| OnlineMembersList | `OnlineMembersList.tsx` | Right panel online users |
| NotificationBell | `NotificationBell.tsx` | Top nav bell with count badge |
| NotificationDropdown | `NotificationDropdown.tsx` | Dropdown list of notifications |
| SessionFeedbackForm | `SessionFeedbackForm.tsx` | Post-session rating + comment |

---

---

# 🔔 NOTIFICATIONS SYSTEM
> Used across Component 4 (and other parts)

**How it works:**
- Student applies → mentor gets notification
- Mentor accepts → student gets notification + email
- System sends email with meeting link
- Bell icon in top nav shows unread count

**UI Elements:**
- Bell icon (in Navbar)
- Red badge count (unread notifications)
- Dropdown panel:
  - Each notification: icon + message + timestamp
  - "Mark all as read" button
  - Link to relevant page
- Toast pop-up for real-time notifications (bottom-right corner)

**CRUD + WebSocket:**
- `GET /api/support/notifications`
- `PUT /api/support/notifications/[id]` (mark as read)
- WebSocket: receive new notifications in real-time

---

---

# 🛡️ ADMIN PANEL
> Admin-only pages for managing platform data

---

## Page: `/admin`
**File:** `app/admin/page.tsx`

**Purpose:** Admin overview dashboard

**UI Elements:**
- Total students count
- Total clubs count
- Pending applications count
- Active sessions count
- Recent activity feed

---

## Page: `/admin/mentors`
**File:** `app/admin/mentors/page.tsx`

**Purpose:** Verify and manage mentor registrations

**UI Elements:**
- Pending mentor registrations table
- Student name, ID, GPA, Dean List certificate
- Approve / Reject buttons
- Verified mentors list
- Revoke mentor status button

---

---

# 🎨 SHARED UI COMPONENTS
> `components/ui/` — Used everywhere

| Component | File | Purpose |
|---|---|---|
| Button | `Button.tsx` | Primary, secondary, danger variants |
| Input | `Input.tsx` | Text input with label + error state |
| TextArea | `TextArea.tsx` | Multi-line input |
| Select | `Select.tsx` | Dropdown select |
| Modal | `Modal.tsx` | Reusable popup/dialog |
| Card | `Card.tsx` | Generic card container |
| Badge | `Badge.tsx` | Status chips (color variants) |
| Toast | `Toast.tsx` | Success/error notifications |
| Skeleton | `Skeleton.tsx` | Loading placeholder |
| Avatar | `Avatar.tsx` | Profile photo circle |
| Tabs | `Tabs.tsx` | Tab navigation |
| Pagination | `Pagination.tsx` | Page navigation |
| ConfirmModal | `ConfirmModal.tsx` | "Are you sure?" popup |
| EmptyState | `EmptyState.tsx` | No data found message |
| FileUpload | `FileUpload.tsx` | Drag-and-drop file input |

---

# 🗂️ LAYOUT COMPONENTS
> `components/layout/`

| Component | File | Purpose |
|---|---|---|
| Sidebar | `Sidebar.tsx` | Left navigation (all routes) |
| Topbar | `Topbar.tsx` | Top nav (search, bell, user avatar) |
| Footer | `Footer.tsx` | Simple bottom footer |
| AuthLayout | `AuthLayout.tsx` | Centered layout for login/register |
| DashboardLayout | `DashboardLayout.tsx` | Sidebar + Topbar wrapper |

---

---

# 🗃️ DATABASE TABLES SUMMARY

| Table | Component | Purpose |
|---|---|---|
| User | 1 | Login credentials + role |
| StudentProfile | 1 | Student personal info |
| Semester | 1 | Semester record per student |
| SubjectResult | 1 | Subjects + marks per semester |
| StudentClub | 1 | Clubs joined by student |
| SportAchievement | 1 | Sports trophies + certificates |
| FileAsset | 1, 2 | Uploaded files (images, PDFs) |
| StudyMaterial | 2 | Uploaded PDF/slides |
| MaterialSummary | 2 | AI/text summary results |
| SuggestedResource | 2 | Suggested articles/links |
| Bookmark | 2 | Saved resources |
| Club | 3 | University clubs master data |
| ClubApplication | 3 | Student applications to clubs |
| ApplicationFeedback | 3 | Admin feedback per application |
| MentorProfile | 4 | Dean List mentor info |
| SupportSession | 4 | Mentor-created sessions |
| SessionApplication | 4 | Student applications to sessions |
| Notification | 4 | In-app notifications |
| ChatRoom | 4 | Community + session chat rooms |
| ChatMessage | 4 | Individual chat messages |
| SessionFeedback | 4 | Post-session rating + comment |

---

---

# 🚀 API ENDPOINTS SUMMARY

## Auth
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register new student |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |

## Profile (Component 1)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/profile/me` | Get current student profile |
| PUT | `/api/profile/me` | Update profile |
| GET | `/api/profile/semesters` | List all semesters |
| POST | `/api/profile/semesters` | Add semester |
| PUT | `/api/profile/semesters/[id]` | Edit semester |
| DELETE | `/api/profile/semesters/[id]` | Delete semester |
| POST | `/api/profile/subjects` | Add subject to semester |
| PUT | `/api/profile/subjects/[id]` | Edit subject |
| DELETE | `/api/profile/subjects/[id]` | Delete subject |
| GET | `/api/profile/clubs` | Get joined clubs |
| POST | `/api/profile/clubs` | Add club record |
| DELETE | `/api/profile/clubs/[id]` | Remove club record |
| GET | `/api/profile/sports` | Get sports achievements |
| POST | `/api/profile/sports` | Add achievement |
| PUT | `/api/profile/sports/[id]` | Edit achievement |
| DELETE | `/api/profile/sports/[id]` | Delete achievement |
| GET | `/api/profile/suggestions` | Get improvement suggestions |

## Materials (Component 2)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/materials` | List all materials |
| POST | `/api/materials` | Upload new material |
| GET | `/api/materials/[id]` | Get one material |
| DELETE | `/api/materials/[id]` | Delete material |
| POST | `/api/materials/[id]/summarize` | Trigger summarization |
| GET | `/api/materials/[id]/suggest` | Get resource suggestions |
| GET | `/api/materials/bookmarks` | Get bookmarks |
| POST | `/api/materials/bookmarks` | Add bookmark |
| DELETE | `/api/materials/bookmarks/[id]` | Remove bookmark |

## Clubs (Component 3)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/clubs` | List all clubs |
| POST | `/api/clubs` | Create club (admin) |
| GET | `/api/clubs/[id]` | Get club details |
| PUT | `/api/clubs/[id]` | Edit club (admin) |
| DELETE | `/api/clubs/[id]` | Delete club (admin) |
| POST | `/api/clubs/[id]/apply` | Apply to club |
| GET | `/api/clubs/applications` | Student's applications |
| PUT | `/api/clubs/applications/[id]` | Update application status (admin) |
| POST | `/api/clubs/applications/[id]/feedback` | Send feedback (admin) |

## Support (Component 4)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/support/mentors` | List all mentors |
| POST | `/api/support/mentors/register` | Register as mentor |
| GET | `/api/support/sessions` | List sessions |
| POST | `/api/support/sessions` | Create session (mentor) |
| GET | `/api/support/sessions/[id]` | Get session details |
| PUT | `/api/support/sessions/[id]` | Edit session (mentor) |
| DELETE | `/api/support/sessions/[id]` | Cancel session (mentor) |
| POST | `/api/support/sessions/[id]/apply` | Apply to session |
| GET | `/api/support/notifications` | Get notifications |
| PUT | `/api/support/notifications/[id]` | Mark notification read |
| GET | `/api/support/chat` | Load chat history |

---

---

# 👥 TEAM TASK OWNERSHIP

| Member | Component | Pages to Build | API Routes | Services |
|---|---|---|---|---|
| Member 1 | Profile + Auth | `/login`, `/register`, `/profile/*` (5 pages) | `/api/auth/*`, `/api/profile/*` | `profile.service.ts` |
| Member 2 | Materials | `/materials/*` (4 pages) | `/api/materials/*` | `materials.service.ts` |
| Member 3 | Clubs | `/clubs/*` (4 pages) + `/admin/clubs`, `/admin/club-applications` | `/api/clubs/*` | `clubs.service.ts` |
| Member 4 | Support | `/support/*` (7 pages) | `/api/support/*` | `support.service.ts`, `email.service.ts`, `websocket.service.ts` |

---

# ✅ DEVELOPMENT CHECKLIST

### Week 1–2 — Setup
- [ ] Initialize project, set up Tailwind + Prisma
- [ ] Create DB schema + run migrations
- [ ] Build shared UI components
- [ ] Build layout (Sidebar + Topbar)
- [ ] Set up auth (login + register)
- [ ] Middleware route protection

### Week 3–4 — Component 1 (Profile)
- [ ] Profile setup wizard
- [ ] Academic records CRUD
- [ ] Sports + clubs CRUD
- [ ] Progress charts

### Week 5–6 — Component 2 (Materials)
- [ ] File upload
- [ ] Summary display
- [ ] Resource suggestions
- [ ] Bookmarks

### Week 7–8 — Component 3 (Clubs)
- [ ] Club directory + detail
- [ ] Application form + status
- [ ] Admin approval panel

### Week 9–10 — Component 4 (Support)
- [ ] Mentor registration
- [ ] Session creation + apply
- [ ] Email notification
- [ ] WebSocket community chat

### Week 11 — Testing + Polish
- [ ] All forms validation
- [ ] Loading states + skeleton
- [ ] Error handling
- [ ] Mobile responsive check
- [ ] Final testing

---

> 📌 **Note:** Each member should create `loading.tsx` inside their route folders for smooth loading UX.
