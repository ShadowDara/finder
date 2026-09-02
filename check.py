import json
from pathlib import Path


MIN_VERSION = "0.3.15"

# Ordner, in dem dieses Script liegt
folder = Path(__file__).parent
folder = Path(str(folder) + "/templates")

wrong = 0
all = 0
notags = 0

for json_file in folder.glob("*.json5"):
    all += 1
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
        else:
            #print(f"Bereits vorhanden: {json_file.name}")
            pass

    except json.JSONDecodeError:
        print(f"Übersprungen (ungültiges JSON): {json_file.name}")
        wrong += 1
    except Exception as e:
        print(f"Fehler bei {json_file.name}: {e}")


for json_file in folder.glob("*.json5"):
    try:
        with json_file.open("r", encoding="utf-8") as f:
            data = json.load(f)

        # Nur ergänzen, wenn min_version nicht vorhanden ist
        if "tags" not in data:
            print(f"No Tags: {json_file.name}")
            notags += 1

    except json.JSONDecodeError:
        print(f"Übersprungen (ungültiges JSON): {json_file.name}")
    except Exception as e:
        print(f"Fehler bei {json_file.name}: {e}")

print(f"\nWrong JSON {wrong} from {all}")
print(f"Templates without tags {notags} from {all - wrong} Working")
