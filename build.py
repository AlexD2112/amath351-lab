#!/usr/bin/env python3
"""Build the chapter index and example pages with the standard library."""

import argparse
from html import escape
import json
import math
from pathlib import Path
import posixpath
import re
import shutil

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "src"
BASE_URL = "https://shzhang3.github.io/amath351-lab/"


def href(current, target):
    relative = posixpath.relpath(target, posixpath.dirname(current) or ".")
    if relative.endswith("index.html"):
        return relative[:-10] or "./"
    return relative


def chapter_path(chapter):
    return f"chapters/{chapter['slug']}/index.html"


def example_path(chapter, example):
    return f"chapters/{chapter['slug']}/{example['slug']}/index.html"


def student_path(lab):
    return f"student-labs/{lab['slug']}/index.html"


def replace(template, **values):
    for key, value in values.items():
        template = template.replace("{{" + key + "}}", value)
    missing = re.findall(r"\{\{[A-Z_]+\}\}", template)
    if missing:
        raise ValueError(f"Unfilled placeholders: {missing}")
    return template


def illustration(index):
    def curve(points, opacity=1, width=2):
        d = " ".join(f"{'M' if i == 0 else 'L'}{x:.2f},{y:.2f}" for i, (x, y) in enumerate(points))
        return f'<path d="{d}" opacity="{opacity}" stroke-width="{width}"/>'

    artwork = ""
    if index == 1:
        for x in range(32, 290, 27):
            for y in range(25, 115, 22):
                slope = .35 * ((x - 32) / 70 - (112 - y) / 24)
                dx = 5 / math.hypot(1, slope)
                artwork += curve([(x-dx, y+slope*dx), (x+dx, y-slope*dx)], .28, 1)
        artwork += curve([(32+250*t/4, 107-18*(t-1+4*math.exp(-t))) for t in [i/40 for i in range(161)]], .9, 2.2)
    elif index == 2:
        artwork += curve([(26+i, 69-42*math.exp(-i/180)*math.cos(i/18)) for i in range(269)], .9, 2.2)
        artwork += curve([(26,69),(294,69)], .18, 1)
    else:
        artwork += curve([(160+79*math.exp(-t/11)*math.cos(t), 69+48*math.exp(-t/11)*math.sin(t)) for t in [i/35 for i in range(551)]], .9, 2.2)
        artwork += curve([(53,69),(268,69)], .18, 1) + curve([(160,14),(160,122)], .18, 1)
    return f'<svg class="site-chapter-art" viewBox="0 0 320 138" aria-hidden="true" focusable="false">{artwork}</svg>'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check committed output without writing.")
    parser.add_argument("--publish-dir", type=Path, help="Copy only public output to this directory.")
    args = parser.parse_args()
    catalog = json.loads((SOURCE / "catalog.json").read_text())
    student_labs = json.loads((SOURCE / "student-labs.json").read_text())
    template = (SOURCE / "page.html").read_text()
    outputs = {"assets/lab.css": (SOURCE / "site.css").read_text()}
    for vendor_file in (SOURCE / "vendor").iterdir():
        if vendor_file.is_file():
            outputs[f"assets/vendor/{vendor_file.name}"] = vendor_file.read_text()

    def page(path, title, description, body, chapter=None, example=None, index=0, student=None):
        home = href(path, "index.html")
        current = ' aria-current="page"' if path == "index.html" else ""
        nav = f'<a href="{home}"{current}>Chapters</a><a href="https://shzhang3.github.io/#teaching">Teaching</a><a href="https://github.com/shzhang3/amath351-lab" target="_blank" rel="noopener">GitHub ↗</a>'
        crumbs = ""
        if chapter:
            chapter_label = f"Chapter {index:02d}"
            crumbs = f'<nav class="site-breadcrumbs" aria-label="Breadcrumb"><a href="{home}">All chapters</a><span aria-hidden="true">/</span>'
            if example:
                crumbs += f'<a href="{href(path,chapter_path(chapter))}">{chapter_label}: {escape(chapter["title"])}</a><span aria-hidden="true">/</span><span aria-current="page">{escape(example["title"])}</span>'
            else:
                crumbs += f'<span aria-current="page">{chapter_label}</span>'
            crumbs += "</nav>"
        if student:
            crumbs = f'<nav class="site-breadcrumbs" aria-label="Breadcrumb"><a href="{home}">All chapters</a><span aria-hidden="true">/</span><a href="{home}#student-labs">Student Showcase</a><span aria-hidden="true">/</span><span aria-current="page">{escape(student["title"])}</span></nav>'
        example_nav = ""
        if example:
            ready = [e for e in chapter["examples"] if "source" in e]
            position = ready.index(example)
            previous = ready[position-1] if position else None
            following = ready[position+1] if position+1 < len(ready) else None
            previous_link = f'<a href="{href(path,example_path(chapter,previous))}"><small>Previous example</small>← {escape(previous["title"])}</a>' if previous else '<span></span>'
            next_link = f'<a href="{href(path,example_path(chapter,following))}"><small>Next example</small>{escape(following["title"])} →</a>' if following else '<span></span>'
            example_nav = f'<nav class="site-example-nav" aria-label="Example navigation">{previous_link}<a class="site-all-examples" href="{href(path,chapter_path(chapter))}">All chapter examples</a>{next_link}</nav>'
        if student:
            position = student_labs.index(student)
            previous = student_labs[position-1] if position else None
            following = student_labs[position+1] if position+1 < len(student_labs) else None
            previous_link = f'<a href="{href(path,student_path(previous))}"><small>Previous student project</small>← {escape(previous["title"])}</a>' if previous else '<span></span>'
            next_link = f'<a href="{href(path,student_path(following))}"><small>Next student project</small>{escape(following["title"])} →</a>' if following else '<span></span>'
            example_nav = f'<nav class="site-example-nav" aria-label="Student project navigation">{previous_link}<a class="site-all-examples" href="{home}#student-labs">All student projects</a>{next_link}</nav>'
        legacy = ""
        if path == "index.html":
            legacy = '<script>const legacy={"#amath351-slope-lab":"chapters/first-order/direction-fields/","#amath351-intro":"chapters/first-order/fluids/","#ai-flow":"chapters/first-order/fluids/#ai-flow","#ai-blowup":"chapters/first-order/fluids/#ai-blowup"};if(legacy[location.hash])location.replace(legacy[location.hash]);</script>'
        outputs[path] = replace(
            template, TITLE=escape(title), DESCRIPTION=escape(description, quote=True),
            CANONICAL=BASE_URL+path.removesuffix("index.html"),
            STYLESHEET=href(path,"assets/lab.css"), HOME_URL=home, HEADER_LINKS=nav,
            BREADCRUMBS=crumbs, CONTENT=body, EXAMPLE_NAV=example_nav, LEGACY_SCRIPT=legacy,
            NOSCRIPT='<noscript>Enable JavaScript to use the interactive plots. Explanations and navigation remain available.</noscript>' if example or student else ""
        )

    cards = []
    for i, chapter in enumerate(catalog, 1):
        count = sum("source" in e for e in chapter["examples"])
        status = f"{count} interactive examples ready" if count else "Examples coming as the course progresses"
        cards.append(f'<a class="site-chapter" href="{href("index.html",chapter_path(chapter))}">{illustration(i)}<div class="site-chapter-copy"><div class="site-kicker">Chapter {i:02d}</div><h2>{escape(chapter["title"])}</h2><p>{escape(chapter["description"])}</p><div class="site-chapter-status">{status}</div><div class="site-chapter-action">Explore chapter <span aria-hidden="true">→</span></div></div></a>')
    student_cards = ''.join(f'<a class="site-example" href="{href("index.html",student_path(lab))}"><small>{escape(lab["section"])} · By {escape(lab["author"])}</small><h3>{escape(lab["title"])}</h3><div class="site-example-equation">{escape(lab["label"])}</div><p>{escape(lab["description"])}</p><span class="site-example-link">Open experiment →</span></a>' for lab in student_labs)
    student_section = f'<section id="student-labs" class="site-student-labs" aria-labelledby="student-labs-heading"><div class="site-section-title"><h2 id="student-labs-heading">Student Showcase</h2><span>{len(student_labs)} from students in the course</span></div><p class="site-note">Exploring differential equations through student-created projects. Have an idea to share? See <a href="https://github.com/shzhang3/amath351-lab#student-showcase" target="_blank" rel="noopener">how to contribute</a>.</p><section class="site-examples" aria-label="Student Showcase">{student_cards}</section></section>' if student_labs else ''
    home_body = '<section class="site-hero"><div class="site-kicker">AMATH 351 · Differential equations</div><h1>One course.<br>A growing collection of experiments.</h1><p>Make a prediction, change a parameter, and see what follows. Choose a chapter to explore its examples.</p><p class="site-course">Autumn 2026 · University of Washington</p></section><section class="site-chapters" aria-label="Course chapters">'+''.join(cards)+'</section>'+student_section+'<section class="site-about"><h2>Built as we learn.</h2><p>This open-source lab grows alongside the course. Each example connects a mathematical idea to something you can observe and change. Later chapters will open as we reach their topics.</p></section>'
    page("index.html", "Explore the chapters", "Interactive differential equations examples in three chapters: first-order equations, higher-order linear equations, and linear systems.", home_body)

    for i, chapter in enumerate(catalog, 1):
        path = chapter_path(chapter)
        ready = [e for e in chapter["examples"] if "source" in e]
        planned = [e for e in chapter["examples"] if "source" not in e]
        body = f'<section class="site-hero"><div class="site-kicker">Chapter {i:02d}</div><h1>{escape(chapter["title"])}</h1><p>{escape(chapter["description"])}</p><p class="site-course">{escape(chapter["sections"])}</p></section>'
        if ready:
            body += f'<div class="site-section-title"><h2>Explore the examples</h2><span>{len(ready)} available now</span></div><section class="site-examples" aria-label="Available examples">'
            for n, example in enumerate(ready, 1):
                body += f'<a class="site-example" href="{href(path,example_path(chapter,example))}"><small>Example {n:02d} · {escape(example["section"])}</small><h3>{escape(example["title"])}</h3><div class="site-example-equation">{escape(example["label"])}</div><p>{escape(example["description"])}</p><span class="site-example-link">Open experiment →</span></a>'
            body += '</section>'
        else:
            body += '<p class="site-note">This chapter will grow as we reach it in class. The examples below are planned; interactive pages are not available yet.</p>'
        if planned:
            body += '<div class="site-section-title"><h2>Coming later in this chapter</h2><span>Planned examples</span></div><section class="site-examples" aria-label="Planned examples">'
            for example in planned:
                body += f'<article class="site-example site-example-planned"><small>{escape(example["section"])}</small><h3>{escape(example["title"])}</h3><p>{escape(example["description"])}</p><span class="site-example-link">Not open yet</span></article>'
            body += '</section>'
        page(path, chapter["title"], chapter["description"], body, chapter=chapter, index=i)
        for example in ready:
            path = example_path(chapter,example)
            fragment = (SOURCE / example["source"]).read_text()
            replacements = {}
            if example["slug"] == "fluids":
                replacements = {"AMATH351_INTRO_MODEL":(SOURCE / "prologue-model.cjs").read_text(), "DIRECTION_FIELD_URL":href(path,"chapters/first-order/direction-fields/index.html")}
            elif example["slug"] == "separable":
                replacements = {"SEPARABLE_MODEL":(SOURCE / "separable-model.cjs").read_text(), "BLOWUP_URL":href(path,"chapters/first-order/fluids/index.html")+"#ai-blowup"}
            elif example["slug"] in ("velocity", "planet-gzyx"):
                replacements = {"MOTION_MODEL":(SOURCE / "motion-model.cjs").read_text(), "D3_URL":href(path,"assets/vendor/d3.v7.9.0.min.js")}
            elif example["slug"] == "slope-fields":
                theorem = replace((SOURCE / "existence-explorer.html").read_text(), EXISTENCE_MODEL=(SOURCE / "existence-model.cjs").read_text())
                replacements = {"SLOPE_FIELD_MODEL":(SOURCE / "slope-field-model.cjs").read_text(), "D3_URL":href(path,"assets/vendor/d3.v7.9.0.min.js"), "THEOREM_EXPLORER":theorem}
            elif example["slug"] == "separable-examples":
                replacements = {"SEPARABLE_EXAMPLES_MODEL":(SOURCE / "separable-examples-model.cjs").read_text(), "D3_URL":href(path,"assets/vendor/d3.v7.9.0.min.js"), "AREA_URL":href(path,"chapters/first-order/separable/index.html"), "SLOPE_URL":href(path,"chapters/first-order/slope-fields/index.html")}
            elif example["slug"] == "integrating-factors":
                replacements = {"INTEGRATING_FACTOR_MODEL":(SOURCE / "integrating-factor-model.cjs").read_text(), "D3_URL":href(path,"assets/vendor/d3.v7.9.0.min.js")}
            elif example["slug"] == "exact-equations":
                replacements = {"EXACT_EQUATIONS_MODEL":(SOURCE / "exact-equations-model.cjs").read_text(), "D3_URL":href(path,"assets/vendor/d3.v7.9.0.min.js")}
            elif example["slug"] == "ai-self-improvement":
                replacements = {"AI_GROWTH_MODEL":(SOURCE / "ai-growth-model.cjs").read_text(), "D3_URL":href(path,"assets/vendor/d3.v7.9.0.min.js")}
            fragment = replace(fragment, **replacements)
            page(path, example["title"], example["description"], fragment, chapter=chapter, example=example, index=i)

    for lab in student_labs:
        path = student_path(lab)
        replacements = {"MODEL": (SOURCE / lab["model"]).read_text()} if "model" in lab else {}
        fragment = replace((SOURCE / lab["source"]).read_text(), **replacements)
        page(path, lab["title"], lab["description"], fragment, student=lab)

    for relative, content in outputs.items():
        output = ROOT / relative
        if args.check:
            if not output.exists() or output.read_text() != content:
                raise SystemExit(f"Generated output differs: {relative}. Run python3 build.py.")
        else:
            output.parent.mkdir(parents=True,exist_ok=True)
            output.write_text(content)
    if args.publish_dir:
        destination = args.publish_dir.resolve()
        if destination == ROOT or (ROOT in destination.parents and destination.name != "_site"):
            raise SystemExit("Use _site or a directory outside the repository for publishing.")
        for relative in outputs:
            output = destination / relative
            output.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(ROOT / relative,output)
    page_count = sum(path.endswith('.html') for path in outputs)
    print(f"{'Verified' if args.check else 'Built'} {page_count} pages and {len(outputs)-page_count} shared assets.")


if __name__ == "__main__":
    main()
