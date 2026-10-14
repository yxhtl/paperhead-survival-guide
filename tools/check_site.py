from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
BASE = "https://yxhtl.github.io/paperhead-survival-guide/"
PAGES = {"index.html": ("en", BASE), "zh.html": ("zh-CN", BASE + "zh.html")}
ALTERNATES = {"en": BASE, "zh-CN": BASE + "zh.html", "x-default": BASE}


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.language = None
        self.canonicals = []
        self.alternates = {}
        self.ids = set()
        self.links = []
        self.robots = []
        self.focuses = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.language = attrs.get("lang")
        if "id" in attrs:
            self.ids.add(attrs["id"])
        if tag == "meta" and attrs.get("name", "").lower() == "robots":
            self.robots.append(attrs.get("content", "").lower())
        if tag == "link":
            if attrs.get("rel") == "canonical":
                self.canonicals.append(attrs.get("href"))
            elif attrs.get("rel") == "alternate":
                self.alternates[attrs.get("hreflang")] = attrs.get("href")
        if tag == "a":
            self.links.append(attrs)
        if tag == "button" and "data-focus" in attrs:
            self.focuses.add(attrs["data-focus"])


for filename, (language, canonical) in PAGES.items():
    text = (ROOT / filename).read_text(encoding="utf-8")
    page = Page()
    page.feed(text)
    assert page.language == language, f"{filename}: wrong document language"
    assert page.canonicals == [canonical], f"{filename}: canonical must identify this language's URL"
    assert page.alternates == ALTERNATES, f"{filename}: language alternates must be reciprocal"
    assert all("noindex" not in rule and "nofollow" not in rule for rule in page.robots), f"{filename}: indexing blocked"
    assert "Local MVP" not in text and "本地首版" not in text, f"{filename}: local-only label remains"
    assert page.focuses == {"health", "movement", "clips"}, f"{filename}: missing focus choice"
    analytics_tag = '<script src="analytics.js?v=20261014" defer></script>'
    app_tag = '<script src="app.js?v=20261014" defer></script>'
    assert analytics_tag in text and app_tag in text, f"{filename}: missing versioned scripts"
    assert text.index(analytics_tag) < text.index(app_tag), f"{filename}: initialize analytics before recording interactions"
    assert 'name="google-site-verification"' in text, f"{filename}: missing Search Console verification"
    language_links = [a for a in page.links if a.get("class") == "language-link"]
    expected = "zh.html" if language == "en" else "./"
    assert len(language_links) == 1 and language_links[0].get("href") == expected, f"{filename}: wrong language switch destination"
    for anchor in page.links:
        href = anchor.get("href", "")
        parsed = urlparse(href)
        if parsed.scheme:
            assert parsed.scheme == "https", f"{filename}: insecure external link {href}"
            if anchor.get("target") == "_blank":
                assert "noopener" in anchor.get("rel", ""), f"{filename}: unsafe new tab link"
        elif parsed.path and parsed.path != "./":
            assert (ROOT / parsed.path).is_file(), f"{filename}: missing local destination {href}"
        elif parsed.fragment:
            assert parsed.fragment in page.ids, f"{filename}: broken section link {href}"

sitemap = ET.parse(ROOT / "sitemap.xml").getroot()
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "x": "http://www.w3.org/1999/xhtml"}
urls = sitemap.findall("s:url", ns)
assert {url.findtext("s:loc", namespaces=ns) for url in urls} == {item[1] for item in PAGES.values()}, "Sitemap must list both canonical pages"
assert len(urls) == len(PAGES), "Sitemap contains duplicate pages"
for url in urls:
    alternates = {link.get("hreflang"): link.get("href") for link in url.findall("x:link", ns)}
    assert alternates == ALTERNATES, "Sitemap language alternates do not match the pages"
assert (ROOT / ".nojekyll").is_file(), "Pages must serve the static source without Jekyll"
print("PASS: both languages, canonical URLs, reciprocal alternates, local links and sitemap")
