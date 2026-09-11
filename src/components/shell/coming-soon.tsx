export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-hairline bg-card p-12 text-center">
      <h2 className="font-display text-lg font-semibold text-text-primary">{title}</h2>
      <p className="mt-2 text-sm text-text-muted">
        This module hasn&apos;t been built yet — it&apos;s coming in a later step.
      </p>
    </div>
  );
}
