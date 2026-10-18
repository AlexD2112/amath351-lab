"""Validate the published page graph, relative assets, anchors, and metadata."""
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids, self.links, self.references, self.canonicals = [], [], [], []
        self.h1 = 0
        self.feed(source)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "h1":
            self.h1 += 1
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs["href"])
        elif "href" in attrs:
            self.links.append(attrs["href"])
        if "src" in attrs:
            self.links.append(attrs["src"])
        for key in ("aria-labelledby", "aria-describedby", "aria-controls", "for"):
            self.references.extend(attrs.get(key, "").split())


files = [ROOT / "index.html", *sorted((ROOT / "chapters").rglob("*.html")), *sorted((ROOT / "student-labs").rglob("*.html"))]
pages = {}
for file in files:
    source = file.read_text()
    assert "{{" not in source, f"Unfilled placeholder in {file}"
    page = pages[file] = Page(source)
    assert page.h1 == 1, f"Expected one h1 in {file}"
    assert len(page.ids) == len(set(page.ids)), f"Duplicate IDs in {file}"
    assert set(page.references) <= set(page.ids), f"Unresolved ARIA/label reference in {file}"
    expected = "https://shzhang3.github.io/amath351-lab/" + file.relative_to(ROOT).as_posix().removesuffix("index.html")
    assert page.canonicals == [expected], f"Incorrect canonical URL in {file}"

edges = {file: set() for file in files}
for file, page in pages.items():
    for raw in page.links:
        link = urlsplit(raw)
        if link.scheme or link.netloc:
            continue
        assert not link.path.startswith("/"), f"Root-relative link escapes project site: {raw}"
        target = (file.parent / unquote(link.path)).resolve() if link.path else file
        if target.is_dir():
            target /= "index.html"
        assert target.is_relative_to(ROOT), f"Link escapes public tree: {raw}"
        assert target.is_file(), f"Broken link {raw} from {file.relative_to(ROOT)}"
        if link.fragment:
            assert target in pages and unquote(link.fragment) in pages[target].ids, f"Broken anchor {raw}"
        if target in pages:
            edges[file].add(target)

visited, pending = set(), [ROOT / "index.html"]
while pending:
    page = pending.pop()
    if page not in visited:
        visited.add(page)
        pending.extend(edges[page] - visited)
assert visited == set(files), "Some example or chapter pages are unreachable from the index"
catalog = json.loads((ROOT / "src/catalog.json").read_text())
assert len(catalog) == 3
ready = sum("source" in e for c in catalog for e in c["examples"])
student_labs = json.loads((ROOT / "src/student-labs.json").read_text())
assert len(files) == 1 + len(catalog) + ready + len(student_labs), "Published pages do not match the catalogs"
print(f"Verified {len(files)} reachable pages, three chapter entries, {len(student_labs)} student lab{"" if len(student_labs) == 1 else "s"}, all local links, anchors, stylesheets, and accessible labels.")
