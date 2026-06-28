#!/usr/bin/env bash
# Renderiza os diagramas PlantUML (.puml) para PNG e SVG em docs/02-modelagem/rendered.
# Requer Java. Baixa o plantuml.jar automaticamente se ausente.
# Sem GraphViz, os diagramas de classe/componente/caso de uso usam o motor Smetana
# (definido via `!pragma layout smetana` nos próprios .puml).
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
JAR="$DIR/plantuml.jar"
SRC="$ROOT/docs/02-modelagem"
OUT="$SRC/rendered"
PLANTUML_VERSION="1.2024.8"

mkdir -p "$OUT"

if [ ! -f "$JAR" ]; then
  echo "[diagrams] baixando plantuml.jar ($PLANTUML_VERSION)..."
  curl -sL -o "$JAR" \
    "https://repo1.maven.org/maven2/net/sourceforge/plantuml/plantuml/${PLANTUML_VERSION}/plantuml-${PLANTUML_VERSION}.jar"
fi

echo "[diagrams] gerando PNG..."
java -jar "$JAR" -tpng -o "$OUT" "$SRC"/*.puml
echo "[diagrams] gerando SVG..."
java -jar "$JAR" -tsvg -o "$OUT" "$SRC"/*.puml

echo "[diagrams] concluído. Arquivos em $OUT:"
ls -1 "$OUT"
