# Permanent displays for all four games — v36

A saved game library now owns one stream room, independently of its saved
versions and ranges. Initialization adopts the oldest valid existing room and
persists the selected version, choosing an unfinished round on migration.
Existing per-version room keys are retained. The control host continues to
support the selected version's legacy room as an alias; the canonical host stays
connected across selection changes. Older copy-specific OBS links need one URL
replacement in the existing source to follow every version.

All editors and controls now offer the canonical link. The private Saved version
selector switches the host's snapshot in place and updates the edit target and
control URL. The picker blocks unsaved range edits and live rounds. Selection is
checked again under the storage lock. One control owner per game family prevents
multiple tabs from alternating the same source; extra tabs cannot change the
selection, and opening controls resumes an unfinished current viewer.

Private configuration, pairing secrets, planned prizes and selection metadata
remain excluded from published snapshots. Each game keeps its own connection,
size, stored settings and artwork. No prize, animation or audio changes.

Verification: 618 tests pass, including 17 added regression checks across four
real stores and session publishers: migration, original keys, edits/copies,
reload, in-place switch, legacy alias, duplicate owner, active-round protection
and wire privacy. Local browser checks cover all four selectors, unchanged URLs,
Darts reload, and a Vault control/display connection across selection changes.
See PERMANENT-SOURCES.md for Faith's one-time update and everyday workflow.
