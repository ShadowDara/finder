#!/usr/bin/env python3

import subprocess
from datetime import datetime
from pathlib import Path


VERSION_FILE = "cppm_version"
OUTPUT_FILE = "generated_version.hpp"


def get_git_commit():
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            text=True
        ).strip()
    except subprocess.CalledProcessError:
        return "unknown"


def get_version():
    try:
        return Path(VERSION_FILE).read_text().strip()
    except FileNotFoundError:
        return "unknown"


def generate_header():
    commit = get_git_commit()
    version = get_version()
    date = datetime.now().strftime("%Y-%m-%d")


    content = f"""\
#pragma once

#define BUILD_VERSION "{version}"
#define BUILD_COMMIT "{commit}"
#define BUILD_DATE "{date}"
#define BUILD_MESSAGE " Version " BUILD_VERSION " from " BUILD_DATE " - commit: " BUILD_COMMIT " - by shadowdara!"
"""


    Path(OUTPUT_FILE).write_text(content)

    print(f"Generated {OUTPUT_FILE}")
    print(f"Version: {version}")
    print(f"Commit:  {commit}")
    print(f"Date:    {date}")


if __name__ == "__main__":
    generate_header()
