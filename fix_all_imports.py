#!/usr/bin/env python3
import os
import re

def fix_imports_comprehensive(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Fix type imports from relative paths to shared (both import and export statements)
    content = re.sub(r'(from|import) ["\']\.\.+/types/([^"\']+)["\']', r'\1 "@convex-panel/shared"', content)
    content = re.sub(r'(from|import) ["\']\.\.+/types["\']', r'\1 "@convex-panel/shared"', content)
    
    # Fix utils imports to local (excluding types)
    content = re.sub(r'from ["\']\.\.+/utils/([^"\']+)["\']', r'from "../utils/\1"', content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    desktop_src = 'apps/desktop/src'
    count = 0
    
    for root, dirs, files in os.walk(desktop_src):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = os.path.join(root, file)
                if fix_imports_comprehensive(file_path):
                    count += 1
                    if count <= 50:  # Only print first 50
                        print(f"Fixed: {file_path}")
    
    print(f"\nFixed {count} files total")

if __name__ == '__main__':
    main()
