# Canvas and frame implementation plan

Date: 2026-10-18. Status: implementation in progress; the documentation milestone
is ready for review. This plan is provisional. Verify progress against the code,
maintained docs, and current user instructions before relying on it. Its commit
messages describe intended milestones, not commits that already exist.

The durable design is [A canvas inside a frame](../docs/canvas-and-frame.md).
Keep each milestone reviewable and commit it after its relevant checks pass.

1. **Document the model.** Commit the canvas/frame analogy, the default corner
   arrangement, placement and removal semantics, search recovery, and this
   staged plan. Suggested commit: `docs: define the canvas and frame model`.
2. **Add placement state.** Represent canvas layers, frame attachments, and
   recoverable default controls. Preserve existing saved work and use the
   current corners as the initial layout. Verify persistence and migration.
   Suggested commit: `feat: model canvas and frame placements`.
3. **Build Change layout.** Let the user arrange objects on frame edges or
   canvas layers. Replace the drawing-specific layer modes with the shared
   placement action. Verify moving windows, desktop items, and drawings without
   losing their identity or content. Suggested commit:
   `feat: add the Change layout canvas tool`.
4. **Make removal recoverable.** Add the settings safeguard for hiding canvas
   tools, keep personal objects when removing attachments, and make removed
   default controls available through unified canvas search. Verify search and
   recovery with the tools hidden. Suggested commit:
   `feat: recover frame controls through canvas search`.
5. **Verify the complete interaction and update usage docs.** Check the layout
   editor, temporary search arrangements, mobile layout, persistence, and
   existing canvas interactions in the running browser. Run the repository's
   independent checks and relevant regression tests. Update the README,
   features, spatial documentation, and design status to match what shipped.
   Commit any resulting fixes as coherent milestones, then commit the final
   documentation update: `docs: describe configurable canvas and frame layouts`.

Keep limitations explicit in documentation. A searchable catalog control must
remain recoverable without resetting the layout. Removing an attachment must
not delete its content, and installed app shortcuts must remain available until
the app is uninstalled.
