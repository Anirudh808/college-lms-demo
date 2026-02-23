# AI-Powered College LMS Demo

A polished, functional, marketing-ready demo of an AI-powered college Learning Management System. Built for investor and client demonstrations.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Login Flow

1. Go to `/login`
2. Select **College Tenant**: AXON Institute of Technology
3. Select **Subscription Plan**: Basic / Premium / Premium Plus
4. Select **Role**: Student / Faculty / HoD / Admin
5. Select **User** from the dropdown (role-specific)
6. Click **Enter Demo**

## Demo Flows to Showcase

### Student
- **Dashboard**: Enrolled courses, deadlines, attendance, AI Tutor quick access
- **Courses** → Course detail → Modules → Lesson viewer
- **AI Tutor**: Try Explain, Hint, Step-by-step (Basic plan has step-by-step locked)
- **Live Classes**: Schedule list, Join → fake classroom with chat and polls
- **Planner**: Upcoming tasks calendar
- **Integrity**: Plagiarism previews, AI usage log

### Faculty
- **Dashboard**: Assigned courses, pending grading, engagement chart
- **Grading**: Submissions list, AI grading assist (plan-limited)
- **Question Bank**: AI question generation (Premium+)
- **Live Classes**: Host sessions, create polls
- **Analytics**: At-risk students (Premium+)

### HoD
- **Dashboard**: Dept courses, faculty roster, pass rate charts
- **Approval Queue**: Content publishing workflow
- **Curriculum Intelligence**: Gap analysis (plan-limited)
- **CO/PO Attainment**: Charts
- **Reports**: PDF export (simulated)

### Admin
- **AI Governance**: Credits used, expired credits, usage spikes chart
- **User Management**: RBAC overview
- **Pricing & Plans**: Base fee ₹1200/user/year + plan differences
- **Settings**: Proctoring, SIS/SSO toggles (simulated)

## Demo Controls

- **Switch Role/Plan**: Avatar (top-right) → Switch Role/Plan — change context without logout
- **Simulate Next Day**: Resets daily limits, expires unused credits
- **Tour**: Help icon in top bar — 8-step guided tour

## Plan Gating

- **Basic**: Limited AI features; step-by-step, code debug locked for students
- **Premium**: More allowances; teaching copilot, at-risk analytics
- **Premium Plus**: Full features; industry mapping, NAAC readiness

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- Zustand (session + usage state)
- Recharts (charts)
- Dummy JSON data (no database)

## Data

All data is in `/data` as JSON files. No backend or API keys required.
