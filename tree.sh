#!/bin/bash

# Функция для рекурсивного обхода директорий с исключением служебных папок
walk() {
    local dir="$1"
    local prefix="$2"

    # Получаем список файлов и директорий, исключая служебные папки
    local entries=()
    while IFS= read -r -d '' entry; do
        local basename_entry=$(basename "$entry")
        # Исключаем служебные папки
        if [[ "$basename_entry" != "node_modules" &&
              "$basename_entry" != "dist" &&
              "$basename_entry" != ".git" &&
              "$basename_entry" != ".idea" &&
              "$basename_entry" != ".vscode" ]]; then
            entries+=("$entry")
        fi
    done < <(find "$dir" -maxdepth 1 -mindepth 1 -print0 | sort -V)

    local count=${#entries[@]}
    local index=0

    for entry in "${entries[@]}"; do
        local basename_entry=$(basename "$entry")
        local is_last_entry=$((++index == count))

        if [[ -d "$entry" ]]; then
            # Это директория
            if [[ $is_last_entry -eq 1 ]]; then
                echo "${prefix}└── ${basename_entry}"
                walk "$entry" "${prefix}    "
            else
                echo "${prefix}├── ${basename_entry}"
                walk "$entry" "${prefix}│   "
            fi
        else
            # Это файл
            if [[ $is_last_entry -eq 1 ]]; then
                echo "${prefix}└── ${basename_entry}"
            else
                echo "${prefix}├── ${basename_entry}"
            fi
        fi
    done
}

# Определяем имя файла для вывода
OUTPUT_FILE="tree.txt"

# Определяем стартовую директорию
if [ $# -eq 0 ]; then
    START_DIR="."
else
    START_DIR="$1"
fi

# Проверка существования директории
if [ ! -d "$START_DIR" ]; then
    echo "Ошибка: '$START_DIR' не является директорией или не существует."
    exit 1
fi

# Выводим имя корневой директории и запускаем обход в файл
{
    echo "$(basename "$(pwd)")"
    walk "." ""
} > "$OUTPUT_FILE"

echo "Дерево файлов сохранено в файл: $OUTPUT_FILE"