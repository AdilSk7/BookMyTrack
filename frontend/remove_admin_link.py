import os
import glob
files = glob.glob('*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    if '<a href="admin.html">Admin</a>' in content:
        content = content.replace('      <a href="admin.html">Admin</a>\n', '')
        content = content.replace('      <a href="admin.html">Admin</a>', '')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f'Removed Admin link from {f}')
