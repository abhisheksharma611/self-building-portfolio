import Image from "next/image";
import Engine from "@/components/Engine";
import { THUMBS } from "@/components/thumbs";
import { about, bench, contact, hero, links, projects, stack, stats, timeline } from "@/lib/content";

export default function Page() {
  return (
    <>
      <main id="page">
        {/* ------------------------------------------------------- hero */}
        <section className="hero" id="top">
          <header className="nav" data-block>
            <a className="brand" href="#top" data-b="box">
              <span className="logo">AK</span>
              <span>Abhishek Kumar T</span>
            </a>
            <nav>
              <a href="#about" data-b="text">
                About
              </a>
              <a href="#work" data-b="text">
                Work
              </a>
              <a href="#stack" data-b="text">
                Stack
              </a>
              <a href="#contact" data-b="text">
                Contact
              </a>
            </nav>
            <span className="avail" data-b="box">
              <i />
              Open to work
            </span>
          </header>

          <svg
            className="mega"
            data-block
            data-b="mega"
            preserveAspectRatio="none"
            aria-label="Developer"
            role="img"
          >
            <text>DEVELOPER</text>
          </svg>

          <div className="intro" data-block>
            <span className="hello" data-b="text">
              {hero.greeting}
            </span>
            <h1 className="name" data-b="box">
              {hero.name}
            </h1>
            <p className="role" data-b="text">
              <i />
              {hero.role}
            </p>
            <p className="lede" data-b="text">
              {hero.lede.map((part, i) =>
                typeof part === "string" ? (
                  <span key={i}>{part}</span>
                ) : (
                  <b key={i}>{part.strong}</b>
                ),
              )}
            </p>
            <div className="cta">
              <a className="btn pri" href="#work" data-b="box">
                See the work
              </a>
              <a className="btn" href={links.github} target="_blank" rel="noopener noreferrer" data-b="box">
                Follow on GitHub
              </a>
              <a className="btn" href={links.resume} target="_blank" rel="noopener noreferrer" data-b="box">
                Download résumé
              </a>
            </div>
          </div>

          <figure className="portrait" data-block>
            <div className="pwrap">
              <div className="disc" data-b="box">
                <Image
                  src="/Avatar.webp"
                  alt="Abhishek Kumar T"
                  width={720}
                  height={720}
                  priority
                  sizes="(max-width: 980px) 70vw, 30vw"
                />
              </div>
              <figcaption className="tagline" data-b="text">
                {hero.tagline}
              </figcaption>
            </div>
          </figure>

          <aside className="now" data-block>
            <h2 data-b="text">On the bench right now</h2>
            <ul>
              {bench.map((b) => (
                <li key={b.title} data-b="box">
                  <strong data-b="text">{b.title}</strong>
                  <span data-b="text">{b.text}</span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="stats" data-block>
            {stats.map((s) => (
              <div className="stat" key={s.label} data-b="box">
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------ about */}
        <section className="sec about" id="about">
          <div data-block>
            <h2 className="h" data-b="text">
              How I got here
            </h2>
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} data-b="text">
                {p}
              </p>
            ))}
            <p className="quote" data-b="text">
              {about.quote}
            </p>
          </div>
          <ol className="time" data-block>
            {timeline.map((t) => (
              <li key={t.year} data-b="box">
                <b data-b="text">{t.year}</b>
                <span data-b="text">{t.text}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ------------------------------------------------------- work */}
        <section className="sec" id="work">
          <div data-block>
            <h2 className="h" data-b="text">
              Things I&apos;ve shipped
            </h2>
            <p className="sub" data-b="text">
              Six projects on GitHub. Web apps, machine learning and Python practice, all public.
            </p>
          </div>
          <div className="cards">
            {projects.map((p, i) => (
              <article className="card" key={p.name} data-block data-b="box">
                <div className="thumb" data-b="box">
                  <svg viewBox="0 0 320 180" role="presentation">
                    {THUMBS[i]}
                  </svg>
                </div>
                <div className="body">
                  <span className={p.outline ? "kind hw" : "kind"} data-b="box">
                    {p.kind}
                  </span>
                  <h3 data-b="text">
                    <a href={p.href} target="_blank" rel="noopener noreferrer">
                      {p.name}
                    </a>
                  </h3>
                  <p data-b="text">{p.blurb}</p>
                  <div className="tags" data-b="box">
                    {p.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------ stack */}
        <section className="sec" id="stack">
          <div data-block>
            <h2 className="h" data-b="text">
              What I build with
            </h2>
          </div>
          <div className="stack" data-block>
            {stack.slice(0, 3).map((row) => (
              <div className="row" key={row.label} data-b="box">
                <h3 data-b="text">{row.label}</h3>
                <div className="chips">
                  {row.items.map((item) => (
                    <span key={item} className={item === row.hot ? "hot" : ""} data-b="box">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="stack stack--second" data-block data-break>
            {stack.slice(3).map((row) => (
              <div className="row" key={row.label} data-b="box">
                <h3 data-b="text">{row.label}</h3>
                <div className="chips">
                  {row.items.map((item) => (
                    <span key={item} className={item === row.hot ? "hot" : ""} data-b="box">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- contact */}
        <section className="sec contact" id="contact">
          <div className="swarm-stage" id="swarmStage" />
          <div data-block data-finale>
            <h2 className="h" data-b="text">
              {contact.heading}
            </h2>
            <p className="sub" data-b="text">
              {contact.sub}
            </p>
            <div className="cta">
              {contact.buttons.map((b) => (
                <a
                  key={b.label}
                  className={b.primary ? "btn pri" : "btn"}
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-b="box"
                >
                  {b.label}
                </a>
              ))}
            </div>
            <p className="foot" data-b="text">
              This page was assembled live by 18 cursors. Press <kbd>R</kbd> to watch it again,{" "}
              <kbd>A</kbd> for a slow glide.
            </p>
          </div>
        </section>
      </main>

      <Engine />
    </>
  );
}
