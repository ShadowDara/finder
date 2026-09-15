import json
from pathlib import Path


MIN_VERSION = "0.3.18"

# Ordner, in dem dieses Script liegt
folder = Path(__file__).parent / "templates"

wrong = 0
total = 0
notags = 0
noarraytags = 0
nodesc = 0


# ─────────────────────────────────────────────
# min_version ergänzen
# ─────────────────────────────────────────────

for json_file in folder.glob("*.json5"):
    total += 1

    try:
        with json_file.open("r", encoding="utf-8") as f:
            data = json.load(f)

        # Nur ergänzen, wenn min_version nicht vorhanden ist
        if "min_version" not in data:
            data["min_version"] = MIN_VERSION

            with json_file.open("w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
                f.write("\n")

            print(f"Ergänzt: {json_file.name}")

    except json.JSONDecodeError:
        print(f"Übersprungen (ungültiges JSON): {json_file.name}")
        wrong += 1

    except Exception as e:
        print(f"Fehler bei {json_file.name}: {e}")


# ─────────────────────────────────────────────
# tags überprüfen
# ─────────────────────────────────────────────

for json_file in folder.glob("*.json5"):
    try:
        with json_file.open("r", encoding="utf-8") as f:
            data = json.load(f)

        # Keine tags vorhanden
        if "tags" not in data:
            print(f"No Tags: {json_file.name}")
            notags += 1
            continue

        # tags vorhanden, aber kein Array / keine Liste
        if not isinstance(data["tags"], list):
            print(
                f"Tags is not an array: "
                f"{json_file.name} "
                f"(type: {type(data['tags']).__name__})"
            )
            noarraytags += 1

    except json.JSONDecodeError:
        # Bereits im ersten Durchlauf gezählt
        pass

    except Exception as e:
        print(f"Fehler bei {json_file.name}: {e}")


# ─────────────────────────────────────────────
# Description
# ─────────────────────────────────────────────

for json_file in folder.glob("*.json5"):
    try:
        with json_file.open("r", encoding="utf-8") as f:
            data = json.load(f)

        if "description" not in data:
            print(f"No Description: {json_file.name}")
            nodesc += 1
            continue

    except json.JSONDecodeError:
        # Bereits im ersten Durchlauf gezählt
        pass

    except Exception as e:
        print(f"Fehler bei {json_file.name}: {e}")


# ─────────────────────────────────────────────
# Statistik
# ─────────────────────────────────────────────

working = total - wrong

print()
print(f"Templates with wrong JSON: {wrong} from {total}")
print(f"Templates without tags: {notags} from {working} working templates")
print(
    f"Templates where tags is not an array: "
    f"{noarraytags} from {working - notags} templates with tags attribute"
)
print(f"{nodesc} Templates without description from {working}")
