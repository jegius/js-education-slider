#!/bin/bash

# Функция для создания текстового представления дерева файлов
create_tree() {
    local dir="$1"
    local output_file="$2"

    # Функция для рекурсивного обхода директорий с исключением служебных папок
    walk() {
        local current_dir="$1"
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
        done < <(find "$current_dir" -maxdepth 1 -mindepth 1 -print0 | sort -V)

        local count=${#entries[@]}
        local index=0

        for entry in "${entries[@]}"; do
            local basename_entry=$(basename "$entry")
            local is_last_entry=$((++index == count))

            if [[ -d "$entry" ]]; then
                # Это директория
                if [[ $is_last_entry -eq 1 ]]; then
                    echo "${prefix}└── ${basename_entry}" >> "$output_file"
                    walk "$entry" "${prefix}    "
                else
                    echo "${prefix}├── ${basename_entry}" >> "$output_file"
                    walk "$entry" "${prefix}│   "
                fi
            else
                # Это файл
                if [[ $is_last_entry -eq 1 ]]; then
                    echo "${prefix}└── ${basename_entry}" >> "$output_file"
                else
                    echo "${prefix}├── ${basename_entry}" >> "$output_file"
                fi
            fi
        done
    }

    # Записываем имя корневой директории и запускаем обход
    echo "$(basename "$(pwd)")" > "$output_file"
    walk "." ""
}

# Функция для сбора содержимого файлов
collect_content() {
    local dir="$1"
    local output_file="$2"

    # Сначала создаем дерево файлов
    create_tree "$dir" "$output_file"
    echo "" >> "$output_file"

    # Обходим все файлы с нужными расширениями, исключая служебные папки
    while IFS= read -r -d '' file; do
        # Пропускаем бинарные файлы и файлы с неподдерживаемыми кодировками
        if file --mime-type "$file" | grep -q "text/"; then
            echo "Обработка: $file"

            # Записываем информацию о файле и его содержимое
            echo "// === Файл: $file ===" >> "$output_file"
            cat "$file" >> "$output_file" 2>/dev/null || echo "// Ошибка чтения файла" >> "$output_file"
            echo "" >> "$output_file"
            echo "" >> "$output_file"
        fi

    done < <(find "$dir" -type f \( -name "*.css" -o -name "*.js" -o -name "*.html" -o -name "*.json" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" -not -path "*/.idea/*" -not -path "*/.vscode/*" -print0)
}

# Определяем имя файла для вывода
OUTPUT_FILE="project_documentation.txt"

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

echo "Начинаем создание документации проекта..."
echo "Исключаем папки: node_modules, dist, .git, .idea, .vscode"
echo ""

# Запускаем сбор документации
collect_content "$START_DIR" "$OUTPUT_FILE"

echo ""
echo "Документация проекта сохранена в файл: $OUTPUT_FILE"