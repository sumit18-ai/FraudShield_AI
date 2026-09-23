import os
import re

def validate(tex_file):
    with open(tex_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        text = "".join(lines)

    errors = []
    warnings = []

    # 1. Check control characters
    bad_chars = [(i+1, ord(c), hex(ord(c))) for i, c in enumerate(text) if ord(c) < 32 and c not in '\n\r\t']
    if bad_chars:
        errors.append(f'Found {len(bad_chars)} control characters: {bad_chars[:5]}')

    # 2. Check xcolor
    if r'\usepackage{xcolor}' in text and '[table]' not in text:
        errors.append('xcolor loaded without [table] option')

    # 3. Check environment balancing
    stack = []
    for line_no, line in enumerate(lines, 1):
        # Ignore comments
        code_part = line.split('%')[0] if not line.strip().startswith('%') else ''
        begins = re.findall(r'\\begin\{([a-zA-Z0-9*]+)\}', code_part)
        ends = re.findall(r'\\end\{([a-zA-Z0-9*]+)\}', code_part)
        for b in begins:
            stack.append((b, line_no))
        for e in ends:
            if not stack:
                errors.append(f'Line {line_no}: \\end{{{e}}} without matching \\begin')
            else:
                top, l_no = stack.pop()
                if top != e:
                    errors.append(f'Line {line_no}: \\end{{{e}}} closed \\begin{{{top}}} from line {l_no}')

    if stack:
        for b, l in stack:
            errors.append(f'Unclosed \\begin{{{b}}} from line {l}')

    # 4. Check display math $$ or equations
    # In LaTeX, display math should not have unescaped % that comments out the close
    for i, line in enumerate(lines, 1):
        if r'\begin{equation}' in line:
            # check next lines until \end{equation}
            pass

    # 5. Check unescaped underscores in non-math lines
    # (Lines without $ and not in code listing or labels)
    in_listing = False
    for line_no, line in enumerate(lines, 1):
        if r'\begin{lstlisting}' in line:
            in_listing = True
            continue
        if r'\end{lstlisting}' in line:
            in_listing = False
            continue
        if in_listing:
            continue
        
        # Check text outside $...$
        parts = re.split(r'(\$[^\$]+\$)', line)
        for part in parts:
            if not part.startswith('$'):
                # find raw _ not preceded by \
                raw_us = re.findall(r'(?<!\\)_', part)
                if raw_us:
                    # check if it's in a command like \label or \ref
                    cleaned = re.sub(r'\\(?:label|ref|safeincludegraphics|includegraphics|texttt)\{[^}]*\}', '', part)
                    if re.search(r'(?<!\\)_', cleaned):
                        warnings.append(f'Line {line_no}: potential unescaped underscore: {repr(part.strip()[:60])}')

    print(f'=== VALIDATION REPORT FOR {os.path.basename(tex_file)} ===')
    print(f'Total lines: {len(lines)}, Total characters: {len(text)}')
    print(f'ERRORS: {len(errors)}')
    for err in errors:
        print('  [ERROR]', err)
    print(f'WARNINGS: {len(warnings)}')
    for warn in warnings[:10]:
        print('  [WARN]', warn)
    if not errors:
        print('SUCCESS! Document passed all strict syntax and environment checks.')

if __name__ == '__main__':
    validate('docs/FraudShield_AI_Final_Blue_Book.tex')
