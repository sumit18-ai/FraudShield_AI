import os
import re

with open(r'docs/FraudShield_AI_Blue_Book_Report.md', 'r', encoding='utf-8') as f:
    text = f.read()

math_blocks = re.findall(r'\$\$(.*?)\$\$', text, flags=re.DOTALL)
print('Total display math blocks in markdown:', len(math_blocks))
for i, m in enumerate(math_blocks):
    print(f'=== BLOCK {i+1} ===')
    print(repr(m.strip()))
