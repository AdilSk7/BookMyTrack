import os
import glob
import re

html_files = glob.glob('*.html')

reverse_substitutions = {
    r'<i class="fa-solid fa-house" style="font-size: 14px; margin-right: 4px;"></i>\s*': '',
    r'<i class="fa-solid fa-circle-info" style="font-size: 14px; margin-right: 4px;"></i>\s*': '',
    r'<i class="fa-solid fa-calendar-check" style="font-size: 14px; margin-right: 4px;"></i>\s*': '',
    r'<i class="fa-solid fa-clock-rotate-left" style="font-size: 14px; margin-right: 4px;"></i>\s*': '',
    r'<i class="fa-solid fa-indian-rupee-sign" style="font-size: 14px; margin-right: 4px;"></i>\s*': '',
    r'<i class="fa-solid fa-file-invoice" style="font-size: 14px; margin-right: 4px;"></i>\s*': '',
    r'<i class="fa-solid fa-calendar-days" style="font-size: 14px; margin-right: 4px;"></i>\s*': '',
    r'<i class="fa-solid fa-comment-dots" style="font-size: 14px; margin-right: 4px;"></i>\s*': '',
    r'<i class="fa-solid fa-headset" style="font-size: 14px; margin-right: 4px;"></i>\s*': '',
    r'<i class="fa-solid fa-shield-halved" style="font-size: 14px; margin-right: 4px;"></i>\s*': ''
}

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = content
    for pattern, replacement in reverse_substitutions.items():
        modified = re.sub(pattern, replacement, modified)
        
    if modified != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f"Reverted {file}")

print("Done!")
