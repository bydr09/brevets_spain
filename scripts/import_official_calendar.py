"""Import the master event rows from the official 2027 brevet calendar PDF."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from datetime import datetime
from pathlib import Path

import pdfplumber


PROVINCE_ALIASES = {
    "a coruna": "A Coruña",
    "alacant": "Alicante",
    "alicante": "Alicante",
    "barcelon": "Barcelona",
    "cordoba": "Córdoba",
    "huesca": "Huesca",
    "jaen": "Jaén",
    "leon": "León",
    "lleida": "Lleida",
    "lugo": "Lugo",
    "madrid": "Madrid",
    "murcia": "Murcia",
    "navarra": "Navarra",
    "ourense": "Ourense",
    "palma": "Illes Balears",
    "salamanca": "Salamanca",
    "sevilla": "Sevilla",
    "tarragon": "Tarragona",
    "toledo": "Toledo",
    "valencia": "Valencia",
    "zaragoza": "Zaragoza",
}

COMMUNITY_BY_PROVINCE = {
    "A Coruña": "Galicia",
    "Alicante": "Comunitat Valenciana",
    "Barcelona": "Catalunya",
    "Córdoba": "Andalucía",
    "Huesca": "Aragón",
    "Illes Balears": "Illes Balears",
    "Jaén": "Andalucía",
    "León": "Castilla y León",
    "Lleida": "Catalunya",
    "Lugo": "Galicia",
    "Madrid": "Comunidad de Madrid",
    "Murcia": "Región de Murcia",
    "Navarra": "Comunidad Foral de Navarra",
    "Ourense": "Galicia",
    "Salamanca": "Castilla y León",
    "Sevilla": "Andalucía",
    "Tarragona": "Catalunya",
    "Toledo": "Castilla-La Mancha",
    "Valencia": "Comunitat Valenciana",
    "Zaragoza": "Aragón",
}


def normalized(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    return "".join(char for char in value if not unicodedata.combining(char)).casefold().strip()


def slug(value: str) -> str:
    value = normalized(value)
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def canonical_province(raw_value: str) -> str | None:
    value = normalized(raw_value)
    for prefix, province in PROVINCE_ALIASES.items():
        if value.startswith(prefix):
            return province
    return None


def load_enrichment(path: Path) -> dict[tuple[str, int, str], dict]:
    if not path.exists():
        return {}

    events = json.loads(path.read_text(encoding="utf-8"))
    return {
        (event["date"], int(event["distance_km"]), normalized(event["start_locality"])): event
        for event in events
    }


def extract_events(pdf_path: Path, existing_path: Path, source_checked_at: str) -> tuple[list[dict], int]:
    enrichment = load_enrichment(existing_path)
    events: list[dict] = []
    enriched_count = 0

    with pdfplumber.open(pdf_path) as document:
        # Pages 1-6 contain the master columns. Later pages are horizontal
        # continuations or partial repetitions of these same spreadsheet rows.
        # Pages 7-12 contain province and hyperlinks aligned to the same rows.
        for page_index, page in enumerate(document.pages[:6]):
            found_tables = page.find_tables()
            if not found_tables:
                continue

            table = found_tables[0]
            side_page = document.pages[page_index + 6]
            side_words = side_page.extract_words()
            for row_geometry, row in zip(table.rows, table.extract()):
                if not row or len(row) < 9:
                    continue

                club, acp_code, ride_organizer, _organizer_email, distance_label, date_text, elevation, extreme, locality = [
                    (cell or "").strip() for cell in row[:9]
                ]
                if not re.fullmatch(r"\d{2}/\d{2}/\d{4}", date_text):
                    continue

                date = datetime.strptime(date_text, "%d/%m/%Y").date()
                if date.year != 2027:
                    continue

                distance_match = re.match(r"(\d+)", distance_label)
                if not distance_match:
                    continue
                distance_km = int(distance_match.group(1))

                y0, y1 = row_geometry.bbox[1], row_geometry.bbox[3]
                province_text = " ".join(
                    word["text"]
                    for word in side_words
                    if y0 <= word["top"] < y1 and 50 <= word["x0"] < 92
                )
                province = canonical_province(province_text)
                community = COMMUNITY_BY_PROVINCE.get(province) if province else None

                row_annotations = [
                    annotation
                    for annotation in (side_page.annots or [])
                    if y0 <= (annotation["top"] + annotation["bottom"]) / 2 < y1
                    and annotation.get("uri")
                ]
                organizer_url = next(
                    (annotation["uri"] for annotation in row_annotations if annotation["x0"] < 200),
                    None,
                )
                event_url = next(
                    (annotation["uri"] for annotation in row_annotations if annotation["x0"] >= 200),
                    None,
                )

                key = (date.isoformat(), distance_km, normalized(locality))
                detail = enrichment.get(key, {})
                if detail:
                    enriched_count += 1

                event_id = f"{date.year}-{acp_code.lower()}-{date.strftime('%m%d')}-{distance_label.lower()}-{slug(locality)}"
                event = {
                    "id": event_id,
                    "name": detail.get("name", f"BRM {distance_label} - {locality}"),
                    "date": date.isoformat(),
                    "start_time": detail.get("start_time"),
                    "timezone": detail.get("timezone", "Europe/Madrid"),
                    "distance_km": distance_km,
                    "distance_label": distance_label,
                    "start_locality": locality,
                    "province": province or detail.get("province"),
                    "autonomous_community": community or detail.get("autonomous_community"),
                    "organizer": club,
                    "acp_code": acp_code,
                    "ride_organizer": ride_organizer,
                    "elevation_m": int(elevation) if elevation.isdigit() else None,
                    "is_600_plus_8000m": extreme.upper() == "X" or distance_label.upper() == "600E",
                    "verification_status": "official_calendar",
                    "source_type": "official_calendar_pdf",
                    "source_document": "sources/calendario_brevets_2027_oficial.pdf",
                    "source_page": page_index + 1,
                    "source_checked_at": source_checked_at,
                }
                if organizer_url:
                    event["organizer_url"] = organizer_url
                if event_url:
                    event["event_url"] = event_url
                if detail.get("source_url"):
                    event["detail_source_url"] = detail["source_url"]
                events.append(event)

    events.sort(key=lambda event: (event["date"], event["distance_km"], event["organizer"]))
    return events, enriched_count


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--existing", type=Path, default=Path("data/brevets_2027.json"))
    parser.add_argument("--checked-at", default="2026-11-05")
    args = parser.parse_args()

    events, enriched_count = extract_events(args.pdf, args.existing, args.checked_at)
    ids = [event["id"] for event in events]
    if len(events) != 159:
        raise ValueError(f"Expected 159 events for calendar year 2027, found {len(events)}")
    if len(ids) != len(set(ids)):
        raise ValueError("Generated event identifiers are not unique")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(events, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Imported {len(events)} official events; enriched {enriched_count} from existing data")


if __name__ == "__main__":
    main()
