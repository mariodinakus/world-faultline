#!/usr/bin/env python3
"""Fetch and normalize World Bank Pink Sheet historical monthly nominal prices.
Uses Python standard library only; fails closed when the source structure changes.
No guessed values are ever committed. Run from repository root.
"""
import datetime as dt
import io
import json
import pathlib
import posixpath
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

SOURCE_PAGE = "https://www.worldbank.org/en/research/commodity-markets"
PINNED = "https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx"
OUT = pathlib.Path("pax/data/economy-prices.json")
NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
ALIAS = {
    "brent": ["oil_brent", "crude oil, brent", "crude oil brent", "brent"],
    "gas_eu": ["ngas_eur", "natural gas (europe)", "natural gas, europe", "gas_europe", "gas, europe"],
    "wheat": ["wheat_us_hrw", "wheat (u.s. hrw)", "wheat (us hrw)", "wheat, us hrw", "wheat us"],
    "urea": ["urea"],
    "gold": ["gold"],
    "copper": ["copper"],
    "rice": ["rice_5", "rice (thai 5%)", "rice, thai 5%", "rice thai 5", "rice (thai)"]
}
FALLBACK_UNITS = {"brent": "US$/bbl", "gas_eu": "US$/mmbtu", "wheat": "US$/mt",
                  "urea": "US$/mt", "gold": "US$/troy oz", "copper": "US$/mt", "rice": "US$/mt"}

def get(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; PAXResearch/1.0)"})
    with urllib.request.urlopen(request, timeout=55) as reply:
        return reply.read()

def candidates():
    try:
        from html.parser import HTMLParser
        class Links(HTMLParser):
            hrefs = []
            def handle_starttag(self, tag, attrs):
                if tag == "a":
                    u = dict(attrs).get("href", "")
                    if "CMO-Historical-Data-Monthly" in u:
                        self.hrefs.append(urllib.parse.urljoin(SOURCE_PAGE, u))
        parser = Links()
        parser.feed(get(SOURCE_PAGE).decode("utf-8", "ignore"))
        for u in parser.hrefs:
            if urllib.parse.urlparse(u).hostname in {"thedocs.worldbank.org", "www.worldbank.org"}:
                yield u
    except Exception as e:
        print("Landing discovery unavailable:", str(e)[:160])
    yield PINNED

def xlsx_bytes():
    for url in dict.fromkeys(candidates()):
        try:
            data = get(url)
            if len(data) > 10000 and zipfile.is_zipfile(io.BytesIO(data)):
                print("Workbook:", url, len(data), "bytes")
                return data, url
        except Exception as e:
            print("Workbook candidate failed:", str(e)[:130])
    raise RuntimeError("No official World Bank monthly workbook could be retrieved")

def colnum(cell):
    letters = re.match(r"^[A-Z]+", cell or "")
    if not letters:
        return None
    out = 0
    for ch in letters.group():
        out = out * 26 + ord(ch) - 64
    return out - 1

def sheet_rows(data):
    with zipfile.ZipFile(io.BytesIO(data)) as book:
        shared = []
        if "xl/sharedStrings.xml" in book.namelist():
            st = ET.fromstring(book.read("xl/sharedStrings.xml"))
            for entry in st.findall("x:si", NS):
                shared.append("".join(t.text or "" for t in entry.findall(".//x:t", NS)))
        wb = ET.fromstring(book.read("xl/workbook.xml"))
        names = wb.findall(".//x:sheets/x:sheet", NS)
        chosen = next((x for x in names if x.get("name") == "Monthly Prices"), None)
        if chosen is None:
            raise RuntimeError("World Bank workbook lacks Monthly Prices")
        rel_id = chosen.get(RNS + "id")
        relroot = ET.fromstring(book.read("xl/_rels/workbook.xml.rels"))
        rel = next((x for x in relroot if x.get("Id") == rel_id), None)
        if rel is None:
            raise RuntimeError("Sheet relationship unresolved")
        target = rel.get("Target", "")
        path = (target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target))
        root = ET.fromstring(book.read(path))
        result = []
        for row in root.findall(".//x:sheetData/x:row", NS):
            cells = {}
            for cell in row.findall("x:c", NS):
                ci = colnum(cell.get("r"))
                if ci is None:
                    continue
                v = cell.find("x:v", NS)
                if v is not None and v.text is not None:
                    val = shared[int(v.text)] if cell.get("t") == "s" else v.text
                else:
                    val = "".join(t.text or "" for t in cell.findall(".//x:t", NS))
                cells[ci] = val
            result.append(cells)
        return result

def norm(text):
    return re.sub(r"\s+", " ", str(text).strip().casefold())

def choose_columns(head):
    selected = {}
    for key, synonyms in ALIAS.items():
        for synonym in synonyms:
            possible = [(i, str(v)) for i, v in head.items() if norm(synonym) in norm(v)]
            if possible:
                selected[key] = min(possible, key=lambda x: len(x[1]))[0]
                break
    if len(selected) < 6 or "brent" not in selected or "wheat" not in selected:
        raise RuntimeError("Series headers do not match known Pink Sheet columns: " + repr(head))
    if len(set(selected.values())) != len(selected):
        raise RuntimeError("Ambiguous commodity column assignment")
    return selected

def build(data, url):
    rows = sheet_rows(data)
    date_pat = re.compile(r"^(19|20)\d{2}M(0[1-9]|1[0-2])$", re.I)
    start = next((i for i, row in enumerate(rows) if date_pat.fullmatch(str(row.get(0, "")).strip())), None)
    if start is None or start < 2:
        raise RuntimeError("Missing YYYYMMM monthly rows")
    colmap, header_index = None, None
    for i in range(max(0, start - 8), start):
        try:
            selection = choose_columns(rows[i])
        except RuntimeError:
            continue
        if colmap is None or len(selection) > len(colmap):
            colmap, header_index = selection, i
    if not colmap:
        raise RuntimeError("Cannot locate monthly price series heading row")
    units_row = rows[header_index + 1] if header_index + 1 < start else {}
    result = {key: {"label": str(rows[header_index].get(idx, key)),
                    "unit": FALLBACK_UNITS[key], "points": []} for key, idx in colmap.items()}
    max_month = dt.date.today().strftime("%Y-%m")
    for row in rows[start:]:
        date = str(row.get(0, "")).strip()
        if not date_pat.fullmatch(date):
            continue
        month = date[:4] + "-" + date[-2:]
        if month < "2000-01" or month > max_month:
            continue
        for key, column in colmap.items():
            raw = str(row.get(column, "")).strip().replace(",", "")
            try:
                number = float(raw)
            except ValueError:
                continue
            if not 0 < number < 1000000:
                continue
            result[key]["points"].append([month, round(number, 5)])
    for key, item in result.items():
        if len(item["points"]) < 120 or len({p[0] for p in item["points"]}) != len(item["points"]):
            raise RuntimeError("Series appears incomplete or duplicated: " + key)
    last = max(item["points"][-1][0] for item in result.values())
    return {"schemaVersion": 1, "provider": "World Bank Pink Sheet", "frequency": "monthly",
            "periodStart": "2000-01", "lastPeriod": last, "sourceUrl": url,
            "sourcePage": SOURCE_PAGE, "currency": "USD", "nominal": True, "series": result}

if __name__ == "__main__":
    data, url = xlsx_bytes()
    parsed = build(data, url)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(parsed, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("Wrote", OUT, parsed["lastPeriod"], {k: len(v["points"]) for k, v in parsed["series"].items()})
