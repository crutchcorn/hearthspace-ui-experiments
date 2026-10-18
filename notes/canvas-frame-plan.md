# Canvas and frame implementation plan

Date: 2026-10-18. Status: implementation, verification, and documentation complete.
This historical plan remains
provisional context. Verify claims against the code, maintained docs, and
current user instructions before relying on it. Recorded hashes identify
completed implementation commits.

The durable design is [A canvas inside a frame](../docs/canvas-and-frame.md).
Keep each milestone reviewable and commit it after its relevant checks pass.

1. **Document the model — committed as `2051259`.** The canvas/frame analogy,
   default corner arrangement, placement and removal semantics, search
   recovery, and initial plan: `docs: define the canvas and frame model`.
2. **Add placement state — committed as `c452af5`.** Canvas layers, frame
   attachments, recoverable control metadata, validation, and persistence:
   `feat: model canvas and frame placements`.
3. **Extend search and canvas geometry — committed as `18b8e70`.** Unified
   drawing/widget results and frame-aware geometry operations, with regression
   coverage. This separates the underlying behavior from its editor.
4. **Settle drops and define the screen boundary — committed as `7572f13`.**
   Helpers and regression coverage for layout-drop overlap resolution,
   permanent background relocation, and attachments aligned with screen edges:
   `feat: settle layout drops and snap attachments to screen edges`.
5. **Build Change layout and recovery together — committed as `4e53696`.** The
   editor,
   frame rendering, pinned-window behavior, removal safeguard, and search
   recovery share App wiring, so they form one coherent UI milestone. Dragging
   chooses an edge or corner. Canvas, Background, and Frame choices set the
   object's placement without individual edge buttons or sliders. Frame picks
   the nearest edge. Existing attachments dropped in the interior return to
   the nearest edge; Canvas or Background explicitly detaches them. Side
   toolbars stack vertically with upright icons. Entering a new edge area while
   dragging animates the outline and contents into that orientation together;
   crossing the interior retains it until the next edge area. Both directions
   animate, with snapping on release. A stable centered widget probe prevents
   orientation changes from repeatedly switching the target edge. Pinned windows
   partially reveal on hover, open on click,
   retract on lost focus, and confirm before closing. Pinned shortcuts shrink
   into glass tiles. Layout moves resolve covered objects; background placement
   establishes new homes for displaced background work.
6. **Complete browser verification and usage docs — complete.** All 140 tests
   and the six independent repository checks passed. The build retains its
   existing large-chunk warning. Browser checks covered edge attachment and
   snapping without canvas auto-pan; pinned-window partial hover, click-to-open,
   focus-loss retraction, and close confirmation; protected tool removal and
   search recovery; drawings in frame placement and search; permanent background
   placement; merged mobile bars; side toolbar, dock, and system menus; and
   stable quarter-turn motion in both directions. Reload produced no new
   runtime errors. README, feature guide, spatial documentation, and design docs
   now describe the implemented behavior. This documentation milestone is
   recorded separately as:
   `docs: describe configurable canvas and frame layouts`.

Keep limitations explicit in documentation. A searchable catalog control must
remain recoverable without resetting the layout. Removing an attachment must
not delete its content, and installed app shortcuts must remain available until
the app is uninstalled.
