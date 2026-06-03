# Security Specification - SE2026 Daily Monitoring System

## Data Invariants
1. **User Role Enforcements**: Only authenticated users are authorized to list/get records of plots or daily submissions.
2. **Submission Accountability**: Each submission recorded must carry the valid sub-SLS Plot ID and the ID of the PML who authored/validated it.
3. **Temporal Integrity**: Chronological entries should use ISO format tags.

## The "Dirty Dozen" Vulnerabilities Evaluated & Blocked
1. **Unsigned-In Write Access**: Writing daily progress logs blocks unauthenticated public clients.
2. **ID Poisoning**: Enforce strict alphanumeric length boundaries on document keys to prevent directory exploitation.
3. **Orphaned Submissions**: Plot reference checks ensure submissions match mapped geographic census SLS.
4. **Spam Updates**: Prevent non-authorized actors from modifying historical submissions.

This specification guarantees stable, atomic real-time communication across coordinators, supervisors, and administrative officers.
