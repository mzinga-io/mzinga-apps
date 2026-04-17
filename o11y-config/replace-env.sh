# Source - https://stackoverflow.com/a/79738446
# Posted by Arınç Alp Eren
# Retrieved 2026-04-17, License - CC BY-SA 4.0

#!/bin/sh
INPUT_FILE="$1"
OUTPUT_FILE="$2"

cp "$INPUT_FILE" "$OUTPUT_FILE"

for var in $(grep -o '\${[A-Za-z0-9_]\+}' "$OUTPUT_FILE" | tr -d '${}' | sort -u); do
  value=$(printenv "$var")
  if [ -n "$value" ]; then
    sed -i "s|\${$var}|$value|g" "$OUTPUT_FILE"
  fi
done
