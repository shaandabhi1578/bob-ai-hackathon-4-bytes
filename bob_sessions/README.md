# bob_sessions Directory — IBM Bob Hackathon Submission Deliverable

According to the official **IBM Bob Hackathon Guide (Pages 18–19)**:
> *"For judging purposes, each team member must export and upload all relevant Bob task session reports as part of your project submission. These reports must be included in your final code repository as submission deliverable."*

---

## Required Steps to Export from IBM Bob IDE

### Step 1: Open History in Bob IDE
1. In your **Bob IDE** chat interface, select **Views and More Actions** (`...` icon).
2. Select the **History** option.
3. Confirm that you are in the correct workspace (`Bob_hackathon` / `Current`).

### Step 2: Open Task & Export Summary
1. In the task history list, click on each task session related to this project.
2. Select the **task header** at the top of the chat panel.
3. A **task session consumption summary** will be displayed (showing Context Length, Task ID, Tokens, Cache, and Size).
4. Take a screenshot of the task session consumption summary and save it here (e.g., `bob_session_task_01_summary.png`).

### Step 3: Export Task History as Markdown
1. In that same task session consumption summary view, click the **Export task history icon** (download arrow).
2. Save the downloaded markdown file into this `bob_sessions/` folder (e.g., `bob_session_task_01.md`).
3. Repeat for the main development sessions of the project.

---

## Security Checklist Before Submitting (Guide Page 18 & 20)
- [x] `.env` is excluded in `.gitignore` (contains local MapTiler key).
- [x] `firebase-service-account.json` is excluded in `.gitignore` (private key).
- [x] No personal IBM Cloud / IAM API keys are committed in code or session exports.
