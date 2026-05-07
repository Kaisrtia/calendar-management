# Group Meeting CRUD Diagrams

## Class Diagram

```mermaid
classDiagram
    class User {
        +String userId
    }

    class GroupMeeting {
        +String meetingId
        +String title
        +DateTime startTime
        +DateTime endTime
        +String ownerId
        +DateTime? deletedAt
    }

    class GroupMeetingParticipant {
        +String id
        +String meetingId
        +String userId
        +DateTime? deletedAt
    }

    User "1" --> "0..*" GroupMeeting : owns / primary controller
    GroupMeeting "1" --> "0..*" GroupMeetingParticipant : participant links
    User "1" --> "0..*" GroupMeetingParticipant : participates through

    note for GroupMeeting "ownerId is the primary controller.\nOnly owner can update details or delete the meeting.\ndeletedAt hides the meeting for everyone."
    note for GroupMeetingParticipant "deletedAt soft-deletes one user's participation.\nThe meeting remains active for owner and other participants."
```

## Sequence Diagram A: Owner Delete

```mermaid
sequenceDiagram
    actor Owner
    participant UI
    participant API as Backend API
    participant DB as Database

    Owner->>UI: Select Delete Meeting
    UI->>Owner: Show confirmation prompt
    Owner->>UI: Confirm delete
    UI->>API: DELETE /appointments/{appointmentId}?userId=ownerId
    API->>DB: Read meeting with ownerId and deletedAt
    DB-->>API: Active meeting owned by user
    API->>DB: UPDATE GroupMeeting SET deletedAt = now()
    DB-->>API: Meeting soft-deleted
    API-->>UI: Deleted successfully
    UI->>API: Refresh owner schedule
    API->>DB: Query only meetings where deletedAt IS NULL
    DB-->>API: Meeting omitted
    API-->>UI: Updated schedule
    UI-->>Owner: Meeting removed from owner and participant views
```

## Sequence Diagram B: Participant Leave

```mermaid
sequenceDiagram
    actor Participant
    participant UI
    participant API as Backend API
    participant DB as Database

    Participant->>UI: Select Remove from Schedule
    UI->>Participant: Show alert / confirmation
    Participant->>UI: Confirm remove
    UI->>API: POST /appointments/group-meetings/{meetingId}/leave
    API->>DB: Read active GroupMeetingParticipant link
    DB-->>API: Link found and user is not owner
    API->>DB: UPDATE GroupMeetingParticipant SET deletedAt = now()
    DB-->>API: Participant link soft-deleted
    API-->>UI: Removed from schedule
    UI->>API: Refresh participant schedule
    API->>DB: Query active meetings with participant deletedAt IS NULL
    DB-->>API: Meeting omitted for that participant only
    API-->>UI: Updated schedule
    UI-->>Participant: Meeting removed from this user's view
```
