import docx

doc = docx.Document(r'c:\Users\Sumit\OneDrive\Desktop\FraudShield_AI\FraudShield_AI\docs\Draft Blue book format for 2026-27 -Final.docx')

for i, p in enumerate(doc.paragraphs):
    xml = p._p.xml
    has_sectPr = 'w:sectPr' in xml
    has_pageBreak = 'w:br w:type="page"' in xml or 'w:lastRenderedPageBreak' in xml
    if has_sectPr or has_pageBreak or p.style.name.startswith('Heading'):
        print(f"P{i:3d}: sectPr={has_sectPr}, pageBreak={has_pageBreak}, Style={p.style.name} | Text: {repr(p.text[:60])}")
