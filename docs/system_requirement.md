# Functional Requirement: Add New Appointment

## ⚠️ STRICT CONSTRAINTS (MANDATORY)
**CRITICAL NOTE FOR AI:** Any reading, analysis, design, or code generation based on this document **MUST STRICTLY COMPLY** with the data flow, methods, and object structures defined in the attached `Sequence Diagram` and `Class Diagram`. Do not invent or alter logic/structures outside the scope of these diagrams.

---

## 1. Main Flow
1. **Trigger:** The scenario begins when the user chooses to add a new appointment in the UI.
2. **Form Initialization:** The UI notices which part of the calendar is active and pops up an "Add Appointment" window for that specific date and time.
3. **Data Entry:** The user enters the necessary information about the appointment, including:
   - Name
   - Location
   - Start time
   - End time
4. **Validation:** The UI checks the input data for validity. (See section *3. Validation Rules*).
5. **Storage:** 
   - The calendar records the new appointment in the user's list of appointments. 
   - Any reminder selected by the user is added to the list of reminders.

## 2. Alternative Flows / Exceptions

### 2.1. Time Conflict
- **Condition:** The user already has an appointment at the selected time.
- **Handling:** The user is shown a warning message.
- **Next Action:** The user is asked to choose an available time OR replace the previous appointment.

### 2.2. Joining an Existing Group Meeting
- **Condition:** The user enters an appointment with the same **name** and **duration** as an existing group meeting.
- **Handling:** The calendar asks the user whether he/she intended to join that group meeting instead.
- **Next Action:** If the user confirms, the user is added to that group meeting's list of participants.

## 3. Validation Rules
The UI will prevent the user from entering an appointment that has invalid information, specifically:
- Empty name.
- Negative duration (e.g., end time occurs before start time).

## 4. UI/UX Requirements
- **Design Philosophy:** The user interface must feature a **modern and minimalist design**.
- **User Experience:** The layout should be clean, intuitive, and distraction-free, ensuring the user can focus entirely on the appointment details without visual clutter.