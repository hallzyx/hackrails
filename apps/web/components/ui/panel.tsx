export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={"panel rounded-sm " + className}>{children}</section>
  );
}
