import React from "react";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-10 animate-fade-in">
      <h1 className="text-3xl md:text-4xl font-bold text-content-primary mb-4 font-display tracking-tight">
        {title}
      </h1>
      <p className="text-lg text-content-secondary leading-relaxed max-w-3xl">
        {description}
      </p>
    </div>
  );
}

export function OnThisPage({
  links,
}: {
  links: { id: string; label: string }[];
}) {
  return (
    <div className="hidden xl:block w-64 shrink-0 sticky top-32 self-start pl-8 border-l border-border/40">
      <h5 className="text-xs font-bold text-content-primary uppercase tracking-widest mb-4">
        On this page
      </h5>
      <ul className="space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
              className="text-content-secondary hover:text-primary transition-colors block"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GenericViewContent({
  title,
  description,
  features,
}: {
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="flex gap-10 animate-fade-in">
      <div className="flex-1 min-w-0">
        <PageHeader title={title} description={description} />
        <div className="grid gap-4">
          {features.map((f, i) => {
            const [head, tail] = f.split(":");
            return (
              <div
                key={i}
                className="group flex items-start gap-4 p-5 rounded-xl bg-background-secondary/20 border border-border/60 hover:bg-background-secondary/40 hover:border-border hover:shadow-md transition-all"
              >
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                <div className="text-content-primary">
                  {tail ? (
                    <>
                      <span className="text-base font-bold block mb-1 text-content-primary font-display">
                        {head}
                      </span>
                      <span className="text-content-secondary text-sm leading-relaxed">
                        {tail}
                      </span>
                    </>
                  ) : (
                    <span className="text-base">{f}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <OnThisPage
        links={[
          {
            id: "features",
            label: "Features",
          },
        ]}
      />
    </div>
  );
}


