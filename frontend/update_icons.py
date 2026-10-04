import os
import glob
import re

html_files = glob.glob('*.html')

substitutions = {
    r'>\s*Home\s*</a>': r'><i class="fa-solid fa-house" style="font-size: 14px; margin-right: 4px;"></i> Home</a>',
    r'>\s*About\s*</a>': r'><i class="fa-solid fa-circle-info" style="font-size: 14px; margin-right: 4px;"></i> About</a>',
    r'>\s*Reservation\s*</a>': r'><i class="fa-solid fa-calendar-check" style="font-size: 14px; margin-right: 4px;"></i> Reservation</a>',
    r'>\s*Schedule\s*</a>': r'><i class="fa-solid fa-clock-rotate-left" style="font-size: 14px; margin-right: 4px;"></i> Schedule</a>',
    r'>\s*Fare\s*</a>': r'><i class="fa-solid fa-indian-rupee-sign" style="font-size: 14px; margin-right: 4px;"></i> Fare</a>',
    r'>\s*PNR\s*</a>': r'><i class="fa-solid fa-file-invoice" style="font-size: 14px; margin-right: 4px;"></i> PNR</a>',
    r'>\s*My Bookings\s*</a>': r'><i class="fa-solid fa-calendar-days" style="font-size: 14px; margin-right: 4px;"></i> My Bookings</a>',
    r'>\s*Feedback\s*</a>': r'><i class="fa-solid fa-comment-dots" style="font-size: 14px; margin-right: 4px;"></i> Feedback</a>',
    r'>\s*Contact\s*</a>': r'><i class="fa-solid fa-headset" style="font-size: 14px; margin-right: 4px;"></i> Contact</a>',
    r'>\s*Admin\s*</a>': r'><i class="fa-solid fa-shield-halved" style="font-size: 14px; margin-right: 4px;"></i> Admin</a>'
}

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = content
    for pattern, replacement in substitutions.items():
        # Make sure we don't double-replace if they already have an <i> tag.
        # This regex ensures the match starts with `>` and is strictly text before `</a>`.
        # However, to avoid replacing other random things, we only want to do this if it's not already having an <i> tag.
        modified = re.sub(r'>(?!<i class=)' + pattern[2:], replacement, modified)
        
    if modified != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f"Updated {file}")

print("Done!")
